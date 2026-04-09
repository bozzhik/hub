import {ACCESS_COOKIE_NAME} from '@/proxy'

import {jwtVerify} from 'jose'

function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    if (key !== name) continue
    const raw = trimmed.slice(eq + 1).trim()
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return undefined
}

/**
 * When `ACCESS_KEY` is set, AI routes require one of:
 * - Header `X-Access-Key: <ACCESS_KEY>`
 * - Header `Authorization: Bearer <ACCESS_KEY>`
 * - Valid signed `access-token` cookie (same as private `/ai` page flow in `src/proxy.ts`)
 *
 * If `ACCESS_KEY` is unset, all requests are allowed (local dev).
 */
export async function isAiAccessAllowed(request: Request): Promise<boolean> {
  const secret = process.env.ACCESS_KEY?.trim()
  if (!secret) return true

  const headerKey =
    request.headers.get('x-access-key')?.trim() ??
    request.headers
      .get('Authorization')
      ?.replace(/^Bearer\s+/i, '')
      .trim() ??
    ''
  if (headerKey === secret) return true

  const signingKey = process.env.ACCESS_TOKEN_SIGNING_KEY ?? secret
  const token = getCookie(request.headers.get('cookie'), ACCESS_COOKIE_NAME)
  if (!token) return false

  try {
    const key = new TextEncoder().encode(signingKey)
    const {payload} = await jwtVerify(token, key, {algorithms: ['HS256']})
    return payload?.v === 1
  } catch {
    return false
  }
}
