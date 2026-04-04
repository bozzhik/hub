import {Elysia, t} from 'elysia'

import {SERVICE_NAME} from '@/api/lib/constants'

import {toFormattedTimestamp} from '@/api/lib/utils'

const pingResponseSchema = t.Object({
  ok: t.Boolean(),
  service: t.Literal(SERVICE_NAME),
  status: t.String(),
  timestamp: t.String({
    description: 'Machine-readable ISO timestamp',
  }),
  timestampFormatted: t.String({
    description: 'Formatted timestamp in format HH:mm:ss DD.MM.YY',
  }),
})

export const PingEndpoint = <Prefix extends string>(app: Elysia<Prefix>) =>
  app.get(
    '/ping',
    () => {
      const now = new Date()

      return {
        ok: true,
        service: SERVICE_NAME as typeof SERVICE_NAME,
        status: 'healthy',
        timestamp: now.toISOString(),
        timestampFormatted: toFormattedTimestamp(now),
      }
    },
    {
      response: pingResponseSchema,
      detail: {
        summary: 'Ping endpoint',
        description: 'Quick health check for API availability and server time',
        operationId: 'getPing',
      },
    },
  )
