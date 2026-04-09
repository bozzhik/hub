import {paginationOptsValidator} from 'convex/server'
import {v} from 'convex/values'

import type {Doc} from '@convex/_generated/dataModel'
import {mutation, query, type MutationCtx, type QueryCtx} from '@convex/_generated/server'

type ConceptPriority = 'low' | 'medium' | 'high' | 'urgent'
type ConceptStatus = 'draft' | 'review' | 'ready' | 'in_progress' | 'done' | 'rejected'
type ConceptDoc = Doc<'concepts'>

const priorityValidator = v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent'))
const statusValidator = v.union(v.literal('draft'), v.literal('review'), v.literal('ready'), v.literal('in_progress'), v.literal('done'), v.literal('rejected'))

const selectionArgs = {
  status: v.optional(statusValidator),
  priority: v.optional(priorityValidator),
  tag: v.optional(v.string()),
  excludeTokens: v.optional(v.array(v.string())),
  limit: v.optional(v.number()),
} as const

type SelectionInput = {
  status?: ConceptStatus
  priority?: ConceptPriority
  tag?: string
  excludeTokens?: string[]
  limit?: number
}

function normalizeLimit(limit?: number) {
  if (limit === undefined) return undefined
  if (!Number.isFinite(limit)) return undefined
  return Math.max(1, Math.floor(limit))
}

function normalizeToken(token: string) {
  const normalized = token
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  if (!normalized) throw new Error('Concept token must contain at least one letter or number.')

  return normalized
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase()
}

function normalizeExcludeTokens(tokens: string[] | undefined) {
  if (!tokens?.length) return new Set<string>()
  return new Set(tokens.map(normalizeToken))
}

async function loadConceptByToken(ctx: QueryCtx | MutationCtx, token: string) {
  return await ctx.db
    .query('concepts')
    .withIndex('by_token', (q) => q.eq('token', normalizeToken(token)))
    .unique()
}

async function getCandidatePool(ctx: QueryCtx | MutationCtx, args: SelectionInput) {
  const limit = normalizeLimit(args.limit)
  const normalizedTag = args.tag ? normalizeTag(args.tag) : undefined
  const excludedTokens = normalizeExcludeTokens(args.excludeTokens)

  let pool: ConceptDoc[]

  if (args.status !== undefined && args.priority !== undefined) {
    const status = args.status
    const priority = args.priority

    const query = ctx.db
      .query('concepts')
      .withIndex('by_status_and_priority', (q) => q.eq('status', status).eq('priority', priority))
      .order('desc')

    pool = limit === undefined ? await query.collect() : await query.take(limit)
  }
  else if (args.status !== undefined) {
    const status = args.status

    const query = ctx.db
      .query('concepts')
      .withIndex('by_status', (q) => q.eq('status', status))
      .order('desc')

    pool = limit === undefined ? await query.collect() : await query.take(limit)
  }
  else if (args.priority !== undefined) {
    const priority = args.priority

    const query = ctx.db
      .query('concepts')
      .withIndex('by_priority', (q) => q.eq('priority', priority))
      .order('desc')

    pool = limit === undefined ? await query.collect() : await query.take(limit)
  }
  else {
    const query = ctx.db.query('concepts').order('desc')
    pool = limit === undefined ? await query.collect() : await query.take(limit)
  }

  const filtered = pool.filter((concept) => {
      if (normalizedTag && !(concept.tags ?? []).includes(normalizedTag)) return false
      if (excludedTokens.has(concept.token)) return false
      return true
    })

  return limit === undefined ? filtered : filtered.slice(0, limit)
}

function pickRandomConcept(pool: ConceptDoc[]) {
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
}

// db-gen:base:start
export const length = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("concepts").take(5000)
    return {count: rows.length, isTruncated: rows.length === 5000}
  },
})

export const list = query({
  args: {paginationOpts: paginationOptsValidator},
  handler: async (ctx, args) => {
    return await ctx.db.query("concepts").order('desc').paginate(args.paginationOpts)
  },
})

export const getById = query({
  args: {id: v.id("concepts")},
  handler: async (ctx, args) => {
    return await ctx.db.get("concepts", args.id)
  },
})

export const create = mutation({
  args: {
    doc: v.object({
    "token": v.string(),
    "summary": v.string(),
    "details": v.optional(v.string()),
    "priority": v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent')),
    "status": v.union(v.literal('draft'), v.literal('review'), v.literal('ready'), v.literal('in_progress'), v.literal('done'), v.literal('rejected')),
    "tags": v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("concepts", args.doc)
  },
})

export const update = mutation({
  args: {
    id: v.id("concepts"),
    patch: v.object({
    "token": v.optional(v.string()),
    "summary": v.optional(v.string()),
    "details": v.optional(v.string()),
    "priority": v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent'))),
    "status": v.optional(v.union(v.literal('draft'), v.literal('review'), v.literal('ready'), v.literal('in_progress'), v.literal('done'), v.literal('rejected'))),
    "tags": v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("concepts", args.id, args.patch)
    return null
  },
})

export const remove = mutation({
  args: {id: v.id("concepts")},
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return null
  },
})
// db-gen:base:end

/** Custom handlers for this table (not overwritten by db:gen). */

export const getByToken = query({
  args: {token: v.string()},
  handler: async (ctx, args) => {
    return await loadConceptByToken(ctx, args.token)
  },
})

export const listFiltered = query({
  args: selectionArgs,
  handler: async (ctx, args) => {
    return await getCandidatePool(ctx, args)
  },
})

export const getRandom = query({
  args: selectionArgs,
  handler: async (ctx, args) => {
    const pool = await getCandidatePool(ctx, args)
    return pickRandomConcept(pool)
  },
})

export const claimRandom = mutation({
  args: selectionArgs,
  handler: async (ctx, args) => {
    const pool = await getCandidatePool(ctx, {
      ...args,
      status: args.status ?? 'ready',
    })
    const picked = pickRandomConcept(pool)

    if (!picked) return null

    await ctx.db.patch(picked._id, {status: 'in_progress'})
    return {
      ...picked,
      status: 'in_progress' as ConceptStatus,
    }
  },
})

export const setStatus = mutation({
  args: {
    id: v.id('concepts'),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const current = await ctx.db.get(args.id)
    if (!current) throw new Error('Concept not found.')

    await ctx.db.patch(args.id, {status: args.status})

    return {
      ...current,
      status: args.status,
    }
  },
})

export const setStatusByToken = mutation({
  args: {
    token: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const current = await loadConceptByToken(ctx, args.token)
    if (!current) throw new Error('Concept not found.')

    await ctx.db.patch(current._id, {status: args.status})

    return {
      ...current,
      status: args.status,
    }
  },
})
