'use client'

import {Activity, ArrowLeftRight, ArrowRight, Brain, Check, CheckCircle2, ChevronDown, RefreshCwIcon, SendIcon, Shield, Sparkles, UserRound, XCircle} from 'lucide-react'

import {cn} from '@/lib/utils'

import {KeyboardEvent, SyntheticEvent, useEffect, useMemo, useState} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import Container from '~/globals/container'
import {Badge} from '~/primitives/badge'
import {Button} from '~/primitives/button'
import {Card, CardContent, CardHeader, CardTitle} from '~/primitives/card'
import {Empty, EmptyDescription, EmptyHeader, EmptyTitle} from '~/primitives/empty'
import {Item, ItemContent, ItemGroup, ItemHeader, ItemTitle} from '~/primitives/item'
import {ScrollArea} from '~/primitives/scroll-area'
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '~/primitives/select'
import {Spinner} from '~/primitives/spinner'
import {Switch} from '~/primitives/switch'
import {Textarea} from '~/primitives/textarea'
import {Separator} from '~/primitives/separator'
import {Input} from '@/components/primitives/input'

type AiModel = {
  rank: number
  id: string
  name: string
  contextLength: number
  maxOutputTokens: number
}

type AiModelsResponse = {
  ok: boolean
  defaults?: {
    model?: string
  }
  models: AiModel[]
  meta?: {
    fetchedAt?: string
    total?: number
  }
  message?: string
}

type AiCompletionResponse = {
  ok?: boolean
  output?: string
  reasoning?: string
  model?: string
  requestedModel?: string
  usedFallback?: boolean
  warning?: string
  message?: string
}

type AiStreamMeta = {
  model?: string
  requestedModel?: string
  usedFallback?: boolean
  warning?: string
}

type AiStreamDone = {
  output?: string
  reasoning?: string
  model?: string
  requestedModel?: string
  usedFallback?: boolean
  warning?: string
}

const DEFAULT_PROBE_PROMPT = 'why is tailwindcss better than css? reply in five words'

type ProbeResultRow = {
  model: string
  name: string
  rank: number
  ok: boolean
  output?: string
  error?: string
  status?: number
  latencyMs: number
}

type AiProbeAllResponse = {
  ok: boolean
  prompt?: string
  total?: number
  maxConcurrency?: number
  results?: ProbeResultRow[]
  meta?: {fetchedAt?: string; stale?: boolean}
  message?: string
}

type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  text: string
  reasoning?: string
  model?: string
  requestedModel?: string
  usedFallback?: boolean
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === 'object' && payload && 'message' in payload && typeof (payload as {message?: unknown}).message === 'string') {
    return (payload as {message: string}).message
  }

  return 'Unknown AI request error.'
}

/** Pulls common "thinking" wrappers out of assistant text so we can show them separately. */
function extractEmbeddedReasoning(text: string): {content: string; embedded: string} {
  let content = text
  const chunks: string[] = []

  const tick = '`'
  const fence = tick.repeat(3)
  const patterns = [new RegExp(`${fence}redacted_reasoning\\s*\\n?([\\s\\S]*?)\\n?${fence}`, 'gi'), new RegExp(`${fence}think\\s*\\n?([\\s\\S]*?)\\n?${fence}`, 'gi')]

  for (const re of patterns) {
    content = content.replace(re, (_, inner: string) => {
      const t = inner.trim()
      if (t) chunks.push(t)
      return ''
    })
  }

  const embedded = chunks.join('\n\n').trim()
  return {content: content.trim(), embedded}
}

function assistantBodyParts(message: ChatMessage): {content: string; reasoning: string} {
  if (message.role !== 'assistant') {
    return {content: message.text, reasoning: ''}
  }
  const fromStream = message.reasoning?.trim() ?? ''
  const {content, embedded} = extractEmbeddedReasoning(message.text)
  const reasoning = [fromStream, embedded].filter(Boolean).join('\n\n').trim()
  return {content, reasoning}
}

/** Normalizes OpenRouter-style ids so dated variants (e.g. …-20260211…) match the catalog id. */
function normalizeModelIdForCompare(id: string): string {
  return id.trim().replace(/-\d{8}(?=[/:]|$)/g, '')
}

function modelsMatchForUi(requested: string | undefined, actual: string | undefined): boolean {
  if (!requested || !actual) return false
  return normalizeModelIdForCompare(requested) === normalizeModelIdForCompare(actual)
}

function ReasoningCollapsible({text}: {text: string}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-border/40 bg-muted/20">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50" aria-expanded={open}>
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Brain className="size-3.5 shrink-0 opacity-90" aria-hidden />
          Reasoning
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none', open && 'rotate-180')} aria-hidden />
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border/30 px-3 pb-3 pt-2 text-sm leading-relaxed text-muted-foreground">
            <div className="whitespace-pre-wrap wrap-break-word">{text}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AiPage() {
  const [modelsPayload, setModelsPayload] = useState<AiModelsResponse | null>(null)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [requestError, setRequestError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [useStreaming, setUseStreaming] = useState(true)

  const [probeOpen, setProbeOpen] = useState(false)
  const [probePrompt, setProbePrompt] = useState(DEFAULT_PROBE_PROMPT)
  const [probeLoading, setProbeLoading] = useState(false)
  const [probeError, setProbeError] = useState<string | null>(null)
  const [probeResults, setProbeResults] = useState<ProbeResultRow[] | null>(null)

  const modelOptions = useMemo(() => modelsPayload?.models ?? [], [modelsPayload])
  const probeOkCount = useMemo(() => (probeResults ? probeResults.filter((r) => r.ok).length : 0), [probeResults])
  const nextMessageId = useMemo(() => messages.length + 1, [messages.length])

  async function loadModels(forceRefresh = false) {
    setIsLoadingModels(true)
    setModelsError(null)

    try {
      const response = await fetch(`/api/ai/models?limit=20${forceRefresh ? '&refresh=1' : ''}`, {cache: 'no-store'})
      const data = await readJson<AiModelsResponse>(response)

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? `Failed to load AI models (${response.status}).`)
      }

      setModelsPayload(data)
      setSelectedModel((current) => current || data.defaults?.model || data.models[0]?.id || '')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown model loading error.'
      setModelsError(message)
    } finally {
      setIsLoadingModels(false)
    }
  }

  useEffect(() => {
    void loadModels()
  }, [])

  async function runProbeAll() {
    const trimmed = probePrompt.trim()
    if (!trimmed || probeLoading) return

    setProbeError(null)
    setProbeLoading(true)
    setProbeOpen(true)

    try {
      const response = await fetch('/api/ai/probe-all', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({prompt: trimmed}),
      })
      const data = await readJson<AiProbeAllResponse>(response)

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? extractErrorMessage(data) ?? `Probe failed (${response.status}).`)
      }

      setProbeResults(data.results ?? [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Probe failed.'
      setProbeError(message)
      setProbeResults(null)
    } finally {
      setProbeLoading(false)
    }
  }

  async function streamChat(params: {prompt: string; model?: string; assistantId: number}) {
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        prompt: params.prompt,
        model: params.model,
      }),
    })

    if (!response.ok) {
      const payload = await readJson<unknown>(response)
      throw new Error(extractErrorMessage(payload))
    }

    if (!response.body) {
      throw new Error('SSE stream was not returned by /api/ai/stream.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const applyDelta = (delta: string) => {
      if (!delta) return
      setMessages((prev) => prev.map((message) => (message.id === params.assistantId ? {...message, text: message.text + delta} : message)))
    }

    const applyReasoningDelta = (delta: string) => {
      if (!delta) return
      setMessages((prev) => prev.map((message) => (message.id === params.assistantId ? {...message, reasoning: (message.reasoning ?? '') + delta} : message)))
    }

    const applyMeta = (meta: AiStreamMeta) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === params.assistantId
            ? {
                ...message,
                ...(meta.model ? {model: meta.model} : {}),
                ...(meta.requestedModel !== undefined ? {requestedModel: meta.requestedModel} : {}),
                ...(typeof meta.usedFallback === 'boolean' ? {usedFallback: meta.usedFallback} : {}),
              }
            : message,
        ),
      )
      if (meta.warning) setWarning(meta.warning)
    }

    const applyDone = (done: AiStreamDone) => {
      const output = done.output?.trim() ?? ''
      const reasoningDone = typeof done.reasoning === 'string' ? done.reasoning.trim() : ''
      if (!output && !reasoningDone) return

      setMessages((prev) =>
        prev.map((message) =>
          message.id === params.assistantId
            ? {
                ...message,
                text: output,
                reasoning: reasoningDone || message.reasoning?.trim() || undefined,
                model: done.model ?? message.model,
                ...(done.requestedModel !== undefined ? {requestedModel: done.requestedModel} : {}),
                ...(typeof done.usedFallback === 'boolean' ? {usedFallback: done.usedFallback} : {}),
              }
            : message,
        ),
      )

      if (done.warning) setWarning(done.warning)
    }

    const handleEvent = (rawEvent: string) => {
      if (!rawEvent.trim()) return

      const lines = rawEvent.split('\n')
      const eventName =
        lines
          .find((line) => line.startsWith('event:'))
          ?.slice(6)
          .trim() ?? 'message'
      const dataRaw = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n')

      if (!dataRaw) return

      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(dataRaw) as Record<string, unknown>
      } catch {
        return
      }

      if (eventName === 'token') {
        const text = typeof parsed.text === 'string' ? parsed.text : ''
        applyDelta(text)
        return
      }

      if (eventName === 'reasoning') {
        const text = typeof parsed.text === 'string' ? parsed.text : ''
        applyReasoningDelta(text)
        return
      }

      if (eventName === 'meta') {
        applyMeta(parsed as AiStreamMeta)
        return
      }

      if (eventName === 'done') {
        applyDone(parsed as AiStreamDone)
        return
      }

      if (eventName === 'error') {
        throw new Error(typeof parsed.message === 'string' ? parsed.message : 'Streaming error.')
      }
    }

    while (true) {
      const {done, value} = await reader.read()
      if (done) break

      buffer += decoder.decode(value, {stream: true})
      buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

      while (true) {
        const boundaryIndex = buffer.indexOf('\n\n')
        if (boundaryIndex === -1) break

        const rawEvent = buffer.slice(0, boundaryIndex)
        buffer = buffer.slice(boundaryIndex + 2)
        handleEvent(rawEvent)
      }
    }
  }

  async function requestChatOnce(params: {prompt: string; model?: string; assistantId: number}) {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        prompt: params.prompt,
        model: params.model,
      }),
    })

    const data = await readJson<AiCompletionResponse>(response)
    const output = data.output?.trim()

    if (!response.ok || !data.ok || !output) {
      throw new Error(data.message ?? 'AI endpoint returned an empty response.')
    }

    setMessages((prev) =>
      prev.map((message) =>
        message.id === params.assistantId
          ? {
              ...message,
              text: output,
              ...(typeof data.reasoning === 'string' && data.reasoning.trim() ? {reasoning: data.reasoning.trim()} : {}),
              model: data.model,
              ...(data.requestedModel !== undefined ? {requestedModel: data.requestedModel} : {}),
              ...(typeof data.usedFallback === 'boolean' ? {usedFallback: data.usedFallback} : {}),
            }
          : message,
      ),
    )

    setWarning(data.warning ?? null)
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter') return
    if (event.shiftKey) return
    if (event.nativeEvent.isComposing) return
    event.preventDefault()
    if (isSubmitting || !prompt.trim() || !selectedModel) return
    event.currentTarget.form?.requestSubmit()
  }

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError(null)
    setWarning(null)

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isSubmitting) return

    const userMessage: ChatMessage = {
      id: nextMessageId,
      role: 'user',
      text: trimmedPrompt,
    }

    const assistantMessage: ChatMessage = {
      id: nextMessageId + 1,
      role: 'assistant',
      text: '',
      reasoning: '',
      model: selectedModel || undefined,
      requestedModel: selectedModel || undefined,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setPrompt('')
    setIsSubmitting(true)

    try {
      if (useStreaming) {
        await streamChat({
          prompt: trimmedPrompt,
          model: selectedModel || undefined,
          assistantId: assistantMessage.id,
        })
      } else {
        await requestChatOnce({
          prompt: trimmedPrompt,
          model: selectedModel || undefined,
          assistantId: assistantMessage.id,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request error.'
      setRequestError(message)

      setMessages((prev) => prev.filter((messageItem) => messageItem.id !== assistantMessage.id))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container>
      <div className="flex flex-col gap-3">
        <Card className="gap-0 py-0">
          <CardContent className="space-y-2.5 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <CardTitle className="text-xl leading-tight">AI Chat Playground</CardTitle>
                  <Badge variant="secondary" className="gap-1 px-2 py-0 text-xs font-normal" title="Rate limit, minimum interval between requests, and prompt length limits apply on the server.">
                    <Shield className="size-3.5 opacity-90" />
                    Guard
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Free models, streaming.</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <Switch checked={useStreaming} onCheckedChange={setUseStreaming} size="sm" id="ai-stream-toggle" />
                  <span className="text-sm text-muted-foreground">Stream</span>
                </label>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => void loadModels(true)} disabled={isLoadingModels}>
                  <RefreshCwIcon className="size-4" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="min-w-0">
              <Select value={selectedModel || null} onValueChange={(value) => setSelectedModel(value ?? '')} disabled={isLoadingModels || !modelOptions.length}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {modelOptions.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {`#${model.rank} ${model.name} · ${Math.round(model.contextLength / 1024)}k`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              {modelOptions.length ? `${modelOptions.length} models` : 'No models'}
              {modelsPayload?.meta?.total != null ? ` · ${modelsPayload.meta.total} free` : null}
              {modelsPayload?.meta?.fetchedAt ? ` · ${new Date(modelsPayload.meta.fetchedAt).toLocaleString('en-US', {dateStyle: 'short', timeStyle: 'short'})}` : null}
            </p>

            <div className="space-y-1.5">
              {modelsError ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-sm leading-snug text-destructive">{modelsError}</p> : null}
              {warning ? (
                <p className="line-clamp-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1.5 text-sm leading-snug text-muted-foreground" title={warning}>
                  {warning}
                </p>
              ) : null}
              {requestError ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-sm leading-snug text-destructive">{requestError}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-lg">Chat</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-0 p-0 pt-0">
            <ScrollArea className="h-[min(50vh,520px)]">
              <div className="flex min-h-full flex-col gap-3 p-4">
                {!messages.length ? (
                  <Empty className="border-dashed border-muted-foreground/15 py-10">
                    <EmptyHeader>
                      <div className="mb-1 flex justify-center p-2">
                        <Sparkles className="size-10 stroke-[1.35] text-muted-foreground/75" aria-hidden />
                      </div>
                      <EmptyTitle className="text-base">No messages</EmptyTitle>
                      <EmptyDescription className="text-sm">Select a model and send.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ItemGroup className="gap-3">
                    {messages.map((message) => {
                      const isUser = message.role === 'user'
                      const isLast = message.id === messages[messages.length - 1]?.id
                      const streamingThis = !isUser && isSubmitting && isLast
                      const parts = streamingThis ? {content: message.text, reasoning: message.reasoning?.trim() ?? ''} : assistantBodyParts(message)
                      const awaitingAny = streamingThis && !parts.content.trim() && !parts.reasoning
                      const awaitingReplyOnly = streamingThis && !!parts.reasoning && !parts.content.trim()

                      return (
                        <Item key={message.id} variant={isUser ? 'muted' : 'outline'} size="sm" className={cn('max-w-[min(92%,36rem)] gap-0 border py-3 pl-4 pr-3 shadow-sm', isUser ? 'self-end rounded-2xl rounded-br-md bg-muted/70' : 'self-start rounded-2xl rounded-bl-md')}>
                          <ItemContent className="gap-2">
                            <ItemHeader className="min-h-0 items-start gap-2">
                              <ItemTitle className="flex min-w-0 flex-1 items-center gap-1 text-[10px] font-light uppercase tracking-wide text-muted-foreground">
                                {isUser ? (
                                  <>
                                    <UserRound className="size-3 shrink-0 opacity-80" aria-hidden />
                                    You
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="size-3 shrink-0 opacity-80" aria-hidden />
                                    Assistant
                                  </>
                                )}
                              </ItemTitle>
                              {!isUser && message.model ? (
                                <div className="ml-auto flex max-w-[min(100%,18rem)] shrink-0 flex-wrap items-center justify-end gap-1">
                                  {message.requestedModel && !modelsMatchForUi(message.requestedModel, message.model) ? (
                                    <>
                                      <span className="inline-flex min-w-0 max-w-full items-center gap-0.5 rounded-md border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] leading-tight text-muted-foreground" title={message.requestedModel}>
                                        <ArrowRight className="size-2.5 shrink-0 stroke-[2.25] opacity-90" aria-hidden />
                                        <span className="min-w-0 truncate">{message.requestedModel}</span>
                                      </span>
                                      <span className="inline-flex min-w-0 max-w-full items-center gap-0.5 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium leading-tight" title={message.model}>
                                        <Check className="size-2.5 shrink-0 stroke-[2.5]" aria-hidden />
                                        <span className="min-w-0 truncate">{message.model}</span>
                                      </span>
                                      {message.usedFallback ? (
                                        <span className="inline-flex items-center gap-0.5 rounded-md bg-destructive/12 px-1.5 py-0.5 text-[10px] font-medium text-destructive" title="Another free model answered after the first choice failed">
                                          <ArrowLeftRight className="size-3 shrink-0" />
                                          Fallback
                                        </span>
                                      ) : null}
                                    </>
                                  ) : (
                                    <span className="max-w-full truncate rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium leading-tight" title={message.model}>
                                      {message.model}
                                    </span>
                                  )}
                                </div>
                              ) : null}
                            </ItemHeader>
                            <div data-slot="item-description" className="w-full text-left text-base leading-relaxed text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary">
                              {isUser ? (
                                <div className="whitespace-pre-wrap">{message.text}</div>
                              ) : awaitingAny ? (
                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                  <Spinner />
                                  Thinking…
                                </span>
                              ) : (
                                <div className="w-full">
                                  {parts.reasoning ? <ReasoningCollapsible text={parts.reasoning} /> : null}
                                  {awaitingReplyOnly ? (
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Spinner />
                                      Generating reply…
                                    </p>
                                  ) : parts.content.trim() ? (
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        p: ({children}) => <div className="mb-2 whitespace-pre-wrap last:mb-0">{children}</div>,
                                        ul: ({children}) => <ul className="ml-5 list-disc text-base">{children}</ul>,
                                        ol: ({children}) => <ol className="ml-5 list-decimal text-base">{children}</ol>,
                                        li: ({children}) => <li className="mb-1">{children}</li>,
                                        code: ({children}) => <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">{children}</code>,
                                        pre: ({children}) => <pre className="mb-2 overflow-x-auto rounded-lg border bg-card p-3 text-sm">{children}</pre>,
                                        a: ({children, href}) => (
                                          <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-primary">
                                            {children}
                                          </a>
                                        ),
                                      }}
                                    >
                                      {parts.content}
                                    </ReactMarkdown>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </ItemContent>
                        </Item>
                      )
                    })}
                  </ItemGroup>
                )}
              </div>
            </ScrollArea>

            <form className="flex flex-col border-t p-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Message</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">Enter to send · Shift+Enter new line</span>
                </div>
                <div className="relative">
                  <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={handlePromptKeyDown} placeholder="Write a message…" disabled={isSubmitting} rows={3} className="field-sizing-fixed min-h-20 max-h-64 resize-y rounded-xl border-muted-foreground/15 bg-background py-2.5 pr-29 pb-12 pl-3 text-base" />
                  <Button type="submit" size="default" className="absolute bottom-2.5 right-2.5 z-10 h-8 px-2.5 gap-1.5 rounded-lg text-sm font-medium shadow-sm" disabled={isSubmitting || !prompt.trim() || !selectedModel} aria-label="Send message">
                    {isSubmitting ? (
                      <>
                        <Spinner className="size-4 shrink-0" />
                        Send
                      </>
                    ) : (
                      <>
                        <SendIcon className="size-4 shrink-0 stroke-2" aria-hidden />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground sm:hidden">Enter to send · Shift+Enter new line</p>
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40 shadow-sm">
          <button type="button" onClick={() => setProbeOpen((open) => !open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/50" aria-expanded={probeOpen}>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                Quick model check
              </span>
              <span className="text-xs text-muted-foreground">{probeResults?.length ? `${probeOkCount}/${probeResults.length} models responded · one prompt, batched parallel requests` : 'Smoke-test every free model with a tiny completion — collapsed by default'}</span>
            </span>
            <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none', probeOpen && 'rotate-180')} aria-hidden />
          </button>

          <div className={cn('grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none', probeOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="min-h-0 overflow-hidden">
              <div className="space-y-3 border-t border-border/40 px-4 pb-4 pt-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Input id="ai-probe-prompt" value={probePrompt} onChange={(event) => setProbePrompt(event.target.value)} disabled={probeLoading} className="rounded-lg border-muted-foreground/15 bg-background text-sm" placeholder={DEFAULT_PROBE_PROMPT} />
                  </div>

                  <Button type="button" className="h-10 shrink-0 gap-2 sm:w-auto" onClick={() => void runProbeAll()} disabled={probeLoading || !probePrompt.trim()}>
                    {probeLoading ? (
                      <>
                        <Spinner className="size-4" />
                        Running…
                      </>
                    ) : (
                      <>
                        <Activity className="size-4" aria-hidden />
                        Run
                      </>
                    )}
                  </Button>
                </div>

                {probeError ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-sm text-destructive">{probeError}</p> : null}

                {probeResults?.length ? (
                  <div className="max-h-72 overflow-auto rounded-lg border border-border/40">
                    {probeResults.map((row) => (
                      <div key={row.model} className="grid grid-cols-[2.25rem_minmax(0,1fr)_3.5rem] gap-x-2 gap-y-0.5 border-b border-border/30 px-2 py-2 text-xs last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)_4rem]">
                        <span className="pt-0.5 text-[11px] tabular-nums text-muted-foreground">#{row.rank}</span>
                        <div className="min-w-0">
                          <div className="flex items-start gap-1.5">
                            {row.ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden /> : <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />}
                            <div className="min-w-0">
                              <p className="truncate font-mono text-[11px] leading-tight text-foreground" title={row.model}>
                                {row.name}
                              </p>
                              {row.ok ? (
                                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{row.output}</p>
                              ) : (
                                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-destructive/90" title={row.error}>
                                  {row.error}
                                  {row.status != null ? ` · ${row.status}` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="pt-0.5 text-right text-[11px] tabular-nums text-muted-foreground">{row.latencyMs}ms</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
