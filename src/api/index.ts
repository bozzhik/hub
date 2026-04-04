import {Elysia} from 'elysia'

import {pingEndpoint} from '@/api/endpoints/ping'

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

export type Api = typeof api
