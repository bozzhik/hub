import {defineSchema, defineTable} from 'convex/server'
import {v} from 'convex/values'

export default defineSchema({
  demo: defineTable({
    username: v.string(),
  }).index('by_username', ['username']),
  concepts: defineTable({
    token: v.string(),
    summary: v.string(),
    details: v.optional(v.string()),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent')),
    status: v.union(v.literal('draft'), v.literal('review'), v.literal('ready'), v.literal('in_progress'), v.literal('done'), v.literal('rejected')),
    tags: v.optional(v.array(v.string())),
  })
    .index('by_token', ['token'])
    .index('by_status', ['status'])
    .index('by_priority', ['priority'])
    .index('by_status_and_priority', ['status', 'priority']),
})
