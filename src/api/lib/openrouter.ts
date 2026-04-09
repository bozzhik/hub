import {OpenRouter} from '@openrouter/sdk'

const OPENROUTER_ROUTER_MODEL = 'openrouter/free'
const MODELS_CACHE_TTL_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 45_000

type NumberLike = number | string | null | undefined

type ModelAttemptError = {
  model: string
  status: number
  message: string
}

export type RankedFreeModel = {
  rank: number
  score: number
  id: string
  name: string
  description?: string
  contextLength: number
  maxCompletionTokens: number
  createdAt?: string
  modality?: string | null
  modalities: {
    input: string[]
    output: string[]
  }
  pricing: {
    prompt: string
    completion: string
  }
}

export type FreeModelChatResult = {
  text: string
  model: string
  requestedModel?: string
  usedFallback: boolean
  attemptedModels: string[]
  attemptErrors: ModelAttemptError[]
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

export type FreeModelChatStreamResult = {
  stream: AsyncIterable<{
    model?: string
    usage?: {
      promptTokens?: number
      completionTokens?: number
      totalTokens?: number
    }
    choices?: Array<{
      delta?: {
        content?: string | null
        reasoning?: string | null
      }
    }>
    error?: {
      message: string
      code: number
    }
  }>
  model: string
  requestedModel?: string
  usedFallback: boolean
  attemptedModels: string[]
  attemptErrors: ModelAttemptError[]
}

type RankedModelsCache = {
  expiresAt: number
  fetchedAt: string
  models: RankedFreeModel[]
}

export class OpenRouterHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message)
  }
}

let rankedModelsCache: RankedModelsCache | null = null
let openRouterClient: OpenRouter | null = null

function toFiniteNumber(value: NumberLike) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function isZero(value: NumberLike) {
  return toFiniteNumber(value) === 0
}

function normalizeContextLength(input: {contextLength?: number | null; topProvider?: {contextLength?: number | null}}) {
  return input.contextLength ?? input.topProvider?.contextLength ?? 0
}

function normalizeMaxCompletionTokens(input: {topProvider?: {maxCompletionTokens?: number | null}}) {
  return input.topProvider?.maxCompletionTokens ?? 0
}

function extractParameterSizeInBillions(modelId: string, modelName: string) {
  const source = `${modelId} ${modelName}`.toLowerCase()
  const match = source.match(/(\d+(?:\.\d+)?)b/)

  if (!match?.[1]) return null

  const parsed = Number(match[1])
  if (!Number.isFinite(parsed)) return null

  return parsed
}

function computeModelScore(model: {
  id: string
  name: string
  created: number
  contextLength: number
  maxCompletionTokens: number
  inputModalities: string[]
  outputModalities: string[]
}) {
  const nowSec = Date.now() / 1000
  const modelSizeB = extractParameterSizeInBillions(model.id, model.name)
  const rawName = `${model.id} ${model.name}`.toLowerCase()
  const ageDays = model.created > 0 ? (nowSec - model.created) / 86_400 : 365

  const contextScore = Math.log2(Math.max(2_048, model.contextLength)) * 2.3
  const completionScore = Math.log2(Math.max(1_024, model.maxCompletionTokens)) * 1.6
  const sizeScore = modelSizeB ? Math.min(modelSizeB, 140) / 8 : 0
  const freshnessScore = Math.max(0, 2.5 - ageDays / 200)
  const instructScore = /instruct|chat|assistant|reasoning|thinking/.test(rawName) ? 1.4 : 0
  const visionBonus = model.inputModalities.includes('image') && model.outputModalities.includes('text') ? 0.4 : 0
  const routerPenalty = model.id === OPENROUTER_ROUTER_MODEL ? -2 : 0
  const tinyModelPenalty = modelSizeB && modelSizeB < 8 ? -3 : 0

  const score = contextScore + completionScore + sizeScore + freshnessScore + instructScore + visionBonus + routerPenalty + tinyModelPenalty

  return Number(score.toFixed(4))
}

function toAttemptError(model: string, error: unknown): ModelAttemptError {
  const status =
    typeof error === 'object' && error && 'statusCode' in error && typeof (error as {statusCode?: unknown}).statusCode === 'number'
      ? ((error as {statusCode: number}).statusCode ?? 500)
      : error instanceof OpenRouterHttpError
        ? error.status
        : 500

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown OpenRouter request error.'

  return {model, status, message}
}

function readTextContent(content: unknown) {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (typeof part === 'object' && part && 'text' in part && typeof (part as {text?: unknown}).text === 'string') {
        return (part as {text: string}).text
      }
      return ''
    })
    .join('')
    .trim()
}

function getOpenRouterClient() {
  if (openRouterClient) return openRouterClient

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new OpenRouterHttpError('OPENROUTER_API_KEY is not configured on the server.', 500)
  }

  openRouterClient = new OpenRouter({
    apiKey,
    appTitle: 'hub /api/ai',
    httpReferer: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    timeoutMs: REQUEST_TIMEOUT_MS,
  })

  return openRouterClient
}

async function fetchRankedModelsFromSdk() {
  try {
    const client = getOpenRouterClient()
    const payload = await client.models.list({outputModalities: 'text'})
    const ranked = payload.data
      .filter((model) => isZero(model.pricing.prompt) && isZero(model.pricing.completion))
      .filter((model) => model.architecture.inputModalities.includes('text') && model.architecture.outputModalities.includes('text'))
      .map((model) => {
        const contextLength = normalizeContextLength(model)
        const maxCompletionTokens = normalizeMaxCompletionTokens(model)
        const name = model.name ?? model.id
        const compactDescription = model.description?.replace(/\s+/g, ' ').trim()

        return {
          score: computeModelScore({
            id: model.id,
            name,
            created: model.created,
            contextLength,
            maxCompletionTokens,
            inputModalities: model.architecture.inputModalities ?? [],
            outputModalities: model.architecture.outputModalities ?? [],
          }),
          id: model.id,
          name,
          description: compactDescription ? compactDescription.slice(0, 280) : undefined,
          contextLength,
          maxCompletionTokens,
          createdAt: model.created ? new Date(model.created * 1000).toISOString() : undefined,
          modality: model.architecture.modality,
          modalities: {
            input: model.architecture.inputModalities ?? [],
            output: model.architecture.outputModalities ?? [],
          },
          pricing: {
            prompt: model.pricing.prompt,
            completion: model.pricing.completion,
          },
        }
      })
      .sort((a, b) => b.score - a.score || b.contextLength - a.contextLength || b.maxCompletionTokens - a.maxCompletionTokens || a.id.localeCompare(b.id))
      .map((model, index) => ({
        ...model,
        rank: index + 1,
      }))

    if (!ranked.length) {
      throw new OpenRouterHttpError('No free text models were returned by OpenRouter.', 502)
    }

    return ranked
  } catch (error) {
    if (error instanceof OpenRouterHttpError) throw error

    if (typeof error === 'object' && error && 'statusCode' in error && 'message' in error) {
      const statusCode = (error as {statusCode?: number}).statusCode ?? 500
      const message = (error as {message?: string}).message ?? 'OpenRouter SDK request failed.'
      throw new OpenRouterHttpError(message, statusCode, error)
    }

    if (error instanceof Error) {
      throw new OpenRouterHttpError(error.message, 500, error)
    }

    throw new OpenRouterHttpError('Unknown OpenRouter SDK failure.', 500, error)
  }
}

async function requestCompletionViaSdk(params: {
  model: string
  prompt: string
  system?: string
  temperature?: number
  maxTokens?: number
}) {
  try {
    const client = getOpenRouterClient()
    const completion = await client.chat.send({
      chatRequest: {
        model: params.model,
        messages: [
          ...(params.system ? [{role: 'system' as const, content: params.system}] : []),
          {role: 'user' as const, content: params.prompt},
        ],
        stream: false,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      },
    })

    const text = readTextContent(completion.choices?.[0]?.message?.content)

    if (!text) {
      throw new OpenRouterHttpError('OpenRouter returned an empty completion.', 502, completion)
    }

    return {
      text,
      model: completion.model,
      usage: completion.usage,
    }
  } catch (error) {
    if (error instanceof OpenRouterHttpError) throw error

    if (typeof error === 'object' && error && 'statusCode' in error && 'message' in error) {
      const statusCode = (error as {statusCode?: number}).statusCode ?? 500
      const message = (error as {message?: string}).message ?? 'OpenRouter SDK completion failed.'
      throw new OpenRouterHttpError(message, statusCode, error)
    }

    if (error instanceof Error) {
      throw new OpenRouterHttpError(error.message, 500, error)
    }

    throw new OpenRouterHttpError('Unknown OpenRouter completion failure.', 500, error)
  }
}

/** Non-streaming completion for a single explicit model (e.g. parallel health probes). */
export async function completionForSingleModel(params: {
  model: string
  prompt: string
  system?: string
  temperature?: number
  maxTokens?: number
}) {
  return requestCompletionViaSdk(params)
}

async function requestCompletionStreamViaSdk(params: {
  model: string
  prompt: string
  system?: string
  temperature?: number
  maxTokens?: number
}) {
  try {
    const client = getOpenRouterClient()
    const stream = await client.chat.send({
      chatRequest: {
        model: params.model,
        messages: [
          ...(params.system ? [{role: 'system' as const, content: params.system}] : []),
          {role: 'user' as const, content: params.prompt},
        ],
        stream: true,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      },
    })

    return stream
  } catch (error) {
    if (error instanceof OpenRouterHttpError) throw error

    if (typeof error === 'object' && error && 'statusCode' in error && 'message' in error) {
      const statusCode = (error as {statusCode?: number}).statusCode ?? 500
      const message = (error as {message?: string}).message ?? 'OpenRouter SDK stream request failed.'
      throw new OpenRouterHttpError(message, statusCode, error)
    }

    if (error instanceof Error) {
      throw new OpenRouterHttpError(error.message, 500, error)
    }

    throw new OpenRouterHttpError('Unknown OpenRouter stream failure.', 500, error)
  }
}

export async function getRankedFreeTextModels(options?: {forceRefresh?: boolean}) {
  const forceRefresh = options?.forceRefresh ?? false

  if (!forceRefresh && rankedModelsCache && rankedModelsCache.expiresAt > Date.now()) {
    return {
      models: rankedModelsCache.models,
      fetchedAt: rankedModelsCache.fetchedAt,
      stale: false,
    }
  }

  try {
    const ranked = await fetchRankedModelsFromSdk()

    rankedModelsCache = {
      expiresAt: Date.now() + MODELS_CACHE_TTL_MS,
      fetchedAt: new Date().toISOString(),
      models: ranked,
    }

    return {
      models: ranked,
      fetchedAt: rankedModelsCache.fetchedAt,
      stale: false,
    }
  } catch (error) {
    if (rankedModelsCache) {
      return {
        models: rankedModelsCache.models,
        fetchedAt: rankedModelsCache.fetchedAt,
        stale: true,
      }
    }

    throw error
  }
}

export async function requestFreeModelChatCompletion(params: {
  prompt: string
  requestedModel?: string
  system?: string
  temperature?: number
  maxTokens?: number
  maxAttempts?: number
}) {
  const rankedPayload = await getRankedFreeTextModels()
  const rankedModels = rankedPayload.models
  const rankedIds = rankedModels.map((model) => model.id)
  const rankedSet = new Set(rankedIds)
  const requestedModel = params.requestedModel?.trim()

  const candidates: string[] = []

  if (requestedModel && rankedSet.has(requestedModel)) {
    candidates.push(requestedModel)
  }

  for (const modelId of rankedIds) {
    if (!candidates.includes(modelId)) candidates.push(modelId)
  }

  if (rankedSet.has(OPENROUTER_ROUTER_MODEL) && !candidates.includes(OPENROUTER_ROUTER_MODEL)) {
    candidates.push(OPENROUTER_ROUTER_MODEL)
  }

  const maxAttempts = Math.min(Math.max(1, params.maxAttempts ?? 10), candidates.length)
  const attemptedModels: string[] = []
  const attemptErrors: ModelAttemptError[] = []

  for (const model of candidates.slice(0, maxAttempts)) {
    attemptedModels.push(model)

    try {
      const completion = await requestCompletionViaSdk({
        model,
        prompt: params.prompt,
        system: params.system,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      })

      return {
        text: completion.text,
        model: completion.model,
        requestedModel,
        usedFallback: (attemptedModels[0] ?? model) !== model || Boolean(requestedModel && requestedModel !== model),
        attemptedModels,
        attemptErrors,
        usage: {
          promptTokens: completion.usage?.promptTokens,
          completionTokens: completion.usage?.completionTokens,
          totalTokens: completion.usage?.totalTokens,
        },
      } satisfies FreeModelChatResult
    } catch (error) {
      attemptErrors.push(toAttemptError(model, error))
    }
  }

  throw new OpenRouterHttpError('Unable to get a completion from free OpenRouter models.', 502, {
    attemptedModels,
    attemptErrors,
  })
}

export async function requestFreeModelChatCompletionStream(params: {
  prompt: string
  requestedModel?: string
  system?: string
  temperature?: number
  maxTokens?: number
  maxAttempts?: number
}) {
  const rankedPayload = await getRankedFreeTextModels()
  const rankedModels = rankedPayload.models
  const rankedIds = rankedModels.map((model) => model.id)
  const rankedSet = new Set(rankedIds)
  const requestedModel = params.requestedModel?.trim()

  const candidates: string[] = []

  if (requestedModel && rankedSet.has(requestedModel)) {
    candidates.push(requestedModel)
  }

  for (const modelId of rankedIds) {
    if (!candidates.includes(modelId)) candidates.push(modelId)
  }

  if (rankedSet.has(OPENROUTER_ROUTER_MODEL) && !candidates.includes(OPENROUTER_ROUTER_MODEL)) {
    candidates.push(OPENROUTER_ROUTER_MODEL)
  }

  const maxAttempts = Math.min(Math.max(1, params.maxAttempts ?? 10), candidates.length)
  const attemptedModels: string[] = []
  const attemptErrors: ModelAttemptError[] = []

  for (const model of candidates.slice(0, maxAttempts)) {
    attemptedModels.push(model)

    try {
      const stream = (await requestCompletionStreamViaSdk({
        model,
        prompt: params.prompt,
        system: params.system,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      })) as FreeModelChatStreamResult['stream']

      return {
        stream,
        model,
        requestedModel,
        usedFallback: (attemptedModels[0] ?? model) !== model || Boolean(requestedModel && requestedModel !== model),
        attemptedModels,
        attemptErrors,
      } satisfies FreeModelChatStreamResult
    } catch (error) {
      attemptErrors.push(toAttemptError(model, error))
    }
  }

  throw new OpenRouterHttpError('Unable to start a stream from free OpenRouter models.', 502, {
    attemptedModels,
    attemptErrors,
  })
}
