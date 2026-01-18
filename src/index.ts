import {hubRoute} from '@/routes/hub'

const someRoute = new Elysia().get('/some', () => 'hey, some route')

import {Elysia} from 'elysia'

export default new Elysia()
  .use(hubRoute) // endpoint: (/)
  .use(someRoute)
