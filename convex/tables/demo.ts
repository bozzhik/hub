import {query} from '@convex/_generated/server'

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('demo').collect()
  },
})

export const getRandom = query({
  args: {},
  handler: async (ctx) => {
    const demo = await ctx.db.query('demo').collect()
    return demo[Math.floor(Math.random() * demo.length)] ?? null
  },
})
