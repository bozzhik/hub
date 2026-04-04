import {Elysia, t} from 'elysia'

export const api = new Elysia({prefix: '/api'})
  .get('/', 'hello from hub') // GET
  .post('/', ({body}) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })

export type Api = typeof api
