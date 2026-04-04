import {BASE_URL} from '@/api/lib/constants'

import {join} from 'node:path'
import {Elysia, t} from 'elysia'
import {staticPlugin} from '@elysiajs/static'

const staticRoot = join(process.cwd(), 'src/api/static')
const markdownFilePath = '/api/demo/static/files/example.md'

const demoStaticResponseSchema = t.Object({
  endpoint: t.String(),
  message: t.String(),
  file: t.Object({
    downloadUrl: t.String(),
  }),
})

export const DemoStaticEndpoint = <Prefix extends string>(app: Elysia<Prefix>) =>
  app
    .use(
      staticPlugin({
        assets: staticRoot,
        prefix: '/demo/static/files',
        indexHTML: false,
      }),
    )
    .get(
      '/demo/static',
      () => ({
        endpoint: '/api/demo/static',
        message: 'This is a static storage demo. You can download a sample file from the URL below.',
        file: {
          downloadUrl: new URL(markdownFilePath, BASE_URL).toString(),
        },
      }),
      {
        response: demoStaticResponseSchema,
        detail: {
          summary: 'Static storage demo endpoint',
          description: 'Returns JSON with links to static downloadable files.',
          operationId: 'getDemoStatic',
        },
      },
    )
