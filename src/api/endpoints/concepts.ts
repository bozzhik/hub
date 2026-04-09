import {Elysia, t} from 'elysia'

import {fetchMutation, fetchQuery} from 'convex/nextjs'

import {api} from '@/lib/convex'

const conceptStatusValues = ['draft', 'review', 'ready', 'in_progress', 'done', 'rejected'] as const
const conceptPriorityValues = ['low', 'medium', 'high', 'urgent'] as const

const statusSchema = t.Union(conceptStatusValues.map((value) => t.Literal(value)))
const prioritySchema = t.Union(conceptPriorityValues.map((value) => t.Literal(value)))

const getQuerySchema = t.Object({
  cmd: t.Optional(t.String()),
  token: t.Optional(t.String()),
  status: t.Optional(statusSchema),
  priority: t.Optional(prioritySchema),
  tag: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  excludeTokens: t.Optional(t.String()),
})

const claimBodySchema = t.Object({
  cmd: t.Literal('claim'),
  status: t.Optional(statusSchema),
  priority: t.Optional(prioritySchema),
  tag: t.Optional(t.String()),
  limit: t.Optional(t.Number()),
  excludeTokens: t.Optional(t.Array(t.String())),
})

const setStatusBodySchema = t.Object({
  cmd: t.Literal('setStatus'),
  token: t.String(),
  status: statusSchema,
})

const randomCommandLastTokenByKey = new Map<string, string>()
const readCommands = new Set(['random', 'item', 'list'] as const)

function toJsonError(status: number, message: string, meta?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({
      ok: false,
      message,
      meta,
    }),
    {
      status,
      headers: {'content-type': 'application/json; charset=utf-8'},
    },
  )
}

function parseLimit(raw: string | undefined) {
  if (!raw) return undefined

  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) return undefined

  return Math.max(1, Math.floor(parsed))
}

function parseCsvList(raw: string | undefined) {
  if (!raw) return undefined

  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  return values.length ? values : undefined
}

function buildRandomSelectionKey(params: {status?: string; priority?: string; tag?: string; excludeTokens?: string[]}) {
  const parts = [`status=${params.status ?? '*'}`, `priority=${params.priority ?? '*'}`, `tag=${params.tag ?? '*'}`, `exclude=${(params.excludeTokens ?? []).slice().sort().join(',')}`]

  return parts.join('|')
}

function buildGuide(origin: string) {
  const resolve = (path: string) => `${origin}${path}`

  return {
    endpoint: 'concepts' as const,
    version: 1,
    url: resolve('/api/concepts'),
    dataSource: '/db/concepts',
    agent: {
      role: 'Expert implementation agent',
      prompt:
        'You are a senior engineer working on one concept at a time. Start by understanding the selected concept and extracting the actual product requirement, user flow, and success criteria. Prefer existing libraries, existing project patterns, and the smallest reliable implementation path. Avoid overengineering, unnecessary abstractions, and polishing side details before the main flow works. Deliver a complete pragmatic MVP: the core behavior should be implemented end-to-end, not just sketched. Make reasonable decisions yourself instead of stopping on minor uncertainties. While implementing, watch for runtime errors, broken states, and missing integrations. Before finishing, run the relevant checks available in the project such as lint, typecheck, tests, and build when they make sense, fix reasonable issues, and make sure the result is in a shippable MVP state. Use random or list only for discovery; when you are actually starting work, use claim so the concept is reserved and moved to in_progress. When the iteration is complete, set status to done only if the MVP works and checks pass at a reasonable level; otherwise set it to rejected or leave clear evidence of what blocked completion.',
      objective: 'Deliver a working, validated MVP for one concept in one iteration.',
    },
    defaults: {claimStatus: 'ready', nextStatus: 'in_progress'},
    enums: {status: conceptStatusValues, priority: conceptPriorityValues},
    commands: {
      random: {
        method: 'GET',
        url: resolve('/api/concepts?cmd=random'),
        signature: '?cmd=random[&status][&priority][&tag][&excludeTokens][&limit]',
      },
      item: {
        method: 'GET',
        url: resolve('/api/concepts?cmd=item&token=test'),
        signature: '?cmd=item&token=<token>',
      },
      list: {
        method: 'GET',
        url: resolve('/api/concepts?cmd=list'),
        signature: '?cmd=list[&status][&priority][&tag][&excludeTokens][&limit]',
      },
      claim: {
        method: 'POST',
        url: resolve('/api/concepts'),
        signature: '{"cmd":"claim","status?":"ready","priority?":"...","tag?":"...","excludeTokens?":[...],"limit?":number}',
      },
      setStatus: {
        method: 'POST',
        url: resolve('/api/concepts'),
        signature: '{"cmd":"setStatus","token":"...","status":"draft|review|ready|in_progress|done|rejected"}',
      },
    },
  }
}

/**
 * Concepts endpoint for agent discovery and execution.
 *
 * Read workflow:
 * - GET `/api/concepts` returns the machine-readable guide
 * - GET `/api/concepts?cmd=item|list|random` executes read-only commands
 *
 * Write workflow:
 * - POST `/api/concepts` with `{cmd:"claim"}` reserves a concept for work
 * - POST `/api/concepts` with `{cmd:"setStatus"}` transitions a concept by token
 */
export const ConceptsEndpoint = <Prefix extends string>(app: Elysia<Prefix>) =>
  app
    .get(
      '/concepts',
      async ({query, request, set}) => {
        set.headers['cache-control'] = 'no-store, no-cache, max-age=0, must-revalidate'
        set.headers.pragma = 'no-cache'

        const origin = new URL(request.url).origin
        const cmd = query.cmd

        if (!cmd) return buildGuide(origin)
        if (!readCommands.has(cmd as 'random' | 'item' | 'list')) {
          return toJsonError(400, 'Unknown cmd.', {
            cmd,
            allowed: ['random', 'item', 'list'],
          })
        }

        if (cmd === 'item') {
          if (!query.token) return toJsonError(400, 'Missing query param: token', {cmd})

          const item = await fetchQuery(api.tables.concepts.getByToken, {token: query.token})

          if (!item) return toJsonError(404, 'Concept not found for this token.', {cmd, token: query.token})

          return {
            ok: true,
            item,
            meta: {cmd, token: query.token},
          }
        }

        const limit = parseLimit(query.limit)
        const excludeTokens = parseCsvList(query.excludeTokens)

        if (cmd === 'random') {
          const items = await fetchQuery(api.tables.concepts.listFiltered, {
            status: query.status,
            priority: query.priority,
            tag: query.tag,
            excludeTokens,
            limit,
          })

          if (!items.length) {
            return toJsonError(404, 'No concepts matched the requested filters.', {
              cmd,
              status: query.status,
              priority: query.priority,
              tag: query.tag,
              limit,
            })
          }

          const selectionKey = buildRandomSelectionKey({
            status: query.status,
            priority: query.priority,
            tag: query.tag,
            excludeTokens,
          })
          const lastToken = randomCommandLastTokenByKey.get(selectionKey)
          const candidatePool = items.length > 1 && lastToken ? items.filter((item) => item.token !== lastToken) : items
          const pool = candidatePool.length ? candidatePool : items
          const item = pool[Math.floor(Math.random() * pool.length)]!
          randomCommandLastTokenByKey.set(selectionKey, item.token)

          return {
            ok: true,
            item,
            meta: {
              cmd,
              status: query.status,
              priority: query.priority,
              tag: query.tag,
              limit,
            },
          }
        }

        if (cmd === 'list') {
          const items = await fetchQuery(api.tables.concepts.listFiltered, {
            status: query.status,
            priority: query.priority,
            tag: query.tag,
            excludeTokens,
            limit,
          })

          return {
            ok: true,
            items,
            meta: {
              cmd,
              status: query.status,
              priority: query.priority,
              tag: query.tag,
              limit,
              count: items.length,
            },
          }
        }

        return toJsonError(400, 'Unknown cmd.', {cmd})
      },
      {
        query: getQuerySchema,
        response: t.Any(),
        detail: {
          summary: 'Concepts guide and read commands',
          description: 'Returns the guide by default, or executes item/list/random in read-only mode.',
          operationId: 'getConcepts',
        },
      },
    )
    .post(
      '/concepts',
      async ({body, set}) => {
        set.headers['cache-control'] = 'no-store, no-cache, max-age=0, must-revalidate'
        set.headers.pragma = 'no-cache'

        if (body.cmd === 'claim') {
          const item = await fetchMutation(api.tables.concepts.claimRandom, {
            status: body.status ?? 'ready',
            priority: body.priority,
            tag: body.tag,
            excludeTokens: body.excludeTokens,
            limit: body.limit,
          })

          if (!item) {
            return toJsonError(404, 'No claimable concepts matched the requested filters.', {
              cmd: body.cmd,
              status: body.status ?? 'ready',
              priority: body.priority,
              tag: body.tag,
            })
          }

          return {
            ok: true,
            item,
            meta: {
              cmd: body.cmd,
              status: body.status ?? 'ready',
              priority: body.priority,
              tag: body.tag,
            },
          }
        }

        const item = await fetchMutation(api.tables.concepts.setStatusByToken, {
          token: body.token,
          status: body.status,
        })

        return {
          ok: true,
          item,
          meta: {
            cmd: body.cmd,
            token: body.token,
            status: body.status,
          },
        }
      },
      {
        body: t.Union([claimBodySchema, setStatusBodySchema]),
        response: t.Any(),
        detail: {
          summary: 'Concepts write commands',
          description: 'Claim a concept for work or update a concept status by token.',
          operationId: 'postConceptsCommand',
        },
      },
    )
