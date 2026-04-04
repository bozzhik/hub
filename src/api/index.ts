import {BASE_URL} from '@/api/lib/constants'

import {Elysia} from 'elysia'

import {pingEndpoint} from '@/api/endpoints/ping'
import {docsEndpoint} from '@/api/endpoints/docs'
import {demoStaticEndpoint} from '@/api/endpoints/demo-static'
import {demoHtmlEndpoint} from '@/api/endpoints/demo-html'

/**
 * API Composition Root
 *
 * Current structure:
 * - src/server/api/index.ts                  -> single place to configure Elysia app

 * - src/server/api/endpoints                 -> Elysia app endpoints
 * - src/server/api/modules/                  -> domain modules (auth, billing, projects...)
 * - src/server/api/lib/validators/           -> shared schemas/validators
 * - src/server/api/lib/http/                 -> response helpers / error formatters
 */

export const api = new Elysia({prefix: '/api'})
  // ping endpoint (health check) – [/api/ping]
  .use(pingEndpoint)
  // docs endpoint (openapi) – [/api/docs]
  .use(docsEndpoint(BASE_URL))
  // demo static endpoint (static file) – [/api/demo/static]
  .use(demoStaticEndpoint)
  // demo html endpoint (json/html) – [/api/demo/html]
  .use(demoHtmlEndpoint)

export type Api = typeof api
