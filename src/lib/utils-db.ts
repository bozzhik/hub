import {format} from 'date-fns'

import type {FieldMeta} from '@/lib/db/meta.generated'

export function defaultValueForField(m: FieldMeta) {
  if (m.kind === 'boolean') return false
  if (m.kind === 'number' || m.kind === 'int64') return 0
  return ''
}

export function formatDbAdminCellValue(v: unknown) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return JSON.stringify(v)
}

export function humanizeTableSlug(slug: string) {
  if (!slug) return slug
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

/** Convex `_creationTime` is a Unix time in milliseconds (may include decimal noise). */
export function formatConvexCreationTime(ts: unknown) {
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return '—'
  const ms = Math.trunc(ts)
  return format(new Date(ms), 'yyyy-MM-dd HH:mm:ss')
}

const SHORT_ID_HEAD = 7
const SHORT_ID_TAIL = 6

export function shortConvexDocumentId(id: string) {
  if (id.length <= SHORT_ID_HEAD + SHORT_ID_TAIL + 1) return id
  return `${id.slice(0, SHORT_ID_HEAD)}…${id.slice(-SHORT_ID_TAIL)}`
}

export function coerceDbAdminFieldInput(kind: string, raw: string, checked?: boolean): unknown {
  if (kind === 'number') {
    if (raw.trim() === '') return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  if (kind === 'boolean') return !!checked
  return raw
}
