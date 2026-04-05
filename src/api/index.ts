import {BASE_URL} from '@/api/lib/constants'

import {Elysia} from 'elysia'

import {PingEndpoint} from '@/api/endpoints/ping'
import {DocsEndpoint} from '@/api/endpoints/docs'
import {DemoStaticEndpoint} from '@/api/endpoints/demo-static'
import {DemoHtmlEndpoint} from '@/api/endpoints/demo-html'
import {StyleEndpoint} from '@/api/endpoints/style'

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

const app = new Elysia({prefix: '/api'})

// ping endpoint (health check) – [/api/ping]
PingEndpoint(app)
// docs endpoint (openapi) – [/api/docs]
DocsEndpoint(app, BASE_URL)
// demo static endpoint (static file) – [/api/demo/static]
DemoStaticEndpoint(app)
// demo html endpoint (json/html) – [/api/demo/html]
DemoHtmlEndpoint(app)
// style endpoint (json/html) – [/api/style]
StyleEndpoint(app)

export const api = app

export type Api = typeof api
