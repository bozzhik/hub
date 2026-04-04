import {openapi} from '@elysiajs/openapi'

export const docsEndpoint = (baseUrl: string) =>
  openapi({
    path: '/docs',
    specPath: '/docs/json',
    provider: 'scalar',
    documentation: {
      info: {
        title: 'Hub API',
        version: '0.1.0',
        description: 'Elysia API running inside Next.js route handlers',
      },
      servers: [{url: baseUrl}],
    },
  })
