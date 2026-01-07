import {Elysia, t} from 'elysia'

export default new Elysia()
  .get('/', () => 'hey mom')
  .post('/', ({body}) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })
