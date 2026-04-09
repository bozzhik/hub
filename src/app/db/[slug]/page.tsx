'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import {useParams} from 'next/navigation'

import {useMutation, usePaginatedQuery} from 'convex/react'
import {PencilIcon, TrashIcon} from 'lucide-react'

import {dbMeta, type FieldMeta} from '@/lib/db/meta.generated'
import {assertDbTable, dbAdminApi, isDbTable} from '@/lib/db/registry.generated'
import {coerceDbAdminFieldInput, defaultValueForField, formatConvexCreationTime, formatDbAdminCellValue, humanizeTableSlug, shortConvexDocumentId} from '@/lib/utils-db'
import {cn} from '@/lib/utils'

import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '~/primitives/alert-dialog'
import {Badge} from '~/primitives/badge'
import {Button} from '~/primitives/button'
import {ButtonGroup} from '~/primitives/button-group'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '~/primitives/card'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '~/primitives/dialog'
import {Empty, EmptyDescription, EmptyHeader, EmptyTitle} from '~/primitives/empty'
import {Field, FieldContent, FieldGroup, FieldTitle} from '~/primitives/field'
import {Input} from '~/primitives/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '~/primitives/select'
import {Spinner} from '~/primitives/spinner'
import {Switch} from '~/primitives/switch'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '~/primitives/table'
import {Textarea} from '~/primitives/textarea'
import {Tooltip, TooltipContent, TooltipTrigger} from '~/primitives/tooltip'

export type DatabaseDocument = {
  _id: string
  _creationTime: number
  [key: string]: unknown
}

/** Lucide: fixed glyph box + uniform stroke (optical match). */
const tableRowActionIconClass = '[&_svg]:!size-3.5 [&_svg]:!min-h-3.5 [&_svg]:!min-w-3.5 [&_svg]:!max-h-3.5 [&_svg]:!max-w-3.5 [&_svg]:shrink-0 [&_svg]:![stroke-width:1.75]'

/** Same 28×28; inner borders off so outline/destructive match; ButtonGroup draws outer pill + segment joins. */
const tableRowActionBtnClass = 'box-border !inline-flex !size-7 !items-center !justify-center !gap-0 shrink-0 !border-0 !p-0 shadow-none focus-visible:relative focus-visible:z-10 in-data-[slot=button-group]:shadow-none'

function DatabaseTablePageInner({slug}: {slug: string}) {
  const PAGE_SIZE = 50

  const table = assertDbTable(slug)
  const meta = dbMeta[table] as {fields: Record<string, FieldMeta>}

  const apiMod = dbAdminApi[table]
  type UsePaginatedQueryFn = Parameters<typeof usePaginatedQuery>[0]
  type UseMutationFn = Parameters<typeof useMutation>[0]

  const {results, status, loadMore, isLoading} = usePaginatedQuery(apiMod.list as unknown as UsePaginatedQueryFn, {paginationOpts: {cursor: null, numItems: PAGE_SIZE}}, {initialNumItems: PAGE_SIZE})

  const createMut = useMutation(apiMod.create as unknown as UseMutationFn)
  const updateMut = useMutation(apiMod.update as unknown as UseMutationFn)
  const removeMut = useMutation(apiMod.remove as unknown as UseMutationFn)

  const fields = useMemo(() => Object.entries(meta.fields), [meta.fields])
  const columnNames = useMemo(() => ['_id', '_creationTime', ...Object.keys(meta.fields).slice(0, 6)], [meta.fields])
  const tableTitle = humanizeTableSlug(table)

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<DatabaseDocument | null>(null)

  const [createDraft, setCreateDraft] = useState<Record<string, unknown>>({})
  const [editDraft, setEditDraft] = useState<Record<string, unknown>>({})

  function parseCsvTags(input: string): string[] {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  function formatCsvTags(value: unknown): string {
    if (typeof value === 'string') return value
    if (!Array.isArray(value)) return ''
    return value.map(String).join(', ')
  }

  function resetCreate() {
    setCreateDraft({})
    setCreateOpen(false)
  }

  function openEdit(row: DatabaseDocument) {
    setEditRow(row)
    setEditDraft({})
  }

  async function onCreate() {
    const doc: Record<string, unknown> = {}
    for (const [name, m] of fields) {
      if (createDraft[name] !== undefined) {
        if (name === 'tags' && typeof createDraft[name] === 'string') {
          const parsed = parseCsvTags(createDraft[name] as string)
          if (parsed.length) doc[name] = parsed
        } else {
          doc[name] = createDraft[name]
        }
      }
      else if (!m.optional) doc[name] = defaultValueForField(m)
    }
    await createMut({doc} as never)
    resetCreate()
  }

  async function onUpdate() {
    if (!editRow) return
    const patch: Record<string, unknown> = {...editDraft}
    if (typeof patch.tags === 'string') {
      const parsed = parseCsvTags(patch.tags)
      patch.tags = parsed
    }
    await updateMut({id: editRow._id, patch} as never)
    setEditRow(null)
    setEditDraft({})
  }

  async function onRemove(docId: string) {
    await removeMut({id: docId} as never)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/db" className="text-sm text-muted-foreground hover:text-foreground">
            DB
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">{table}</span>
        </div>

        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button>Create</Button>} />
            <DialogContent showCloseButton>
              <DialogHeader>
                <DialogTitle>Create</DialogTitle>
                <DialogDescription>{table}</DialogDescription>
              </DialogHeader>

              <FieldGroup>
                {fields.map(([name, m]) => {
                  const label = `${name}${m.optional ? '' : ' *'}`
                  const kind = m.kind

                  if (kind === 'boolean') {
                    return (
                      <Field key={name} orientation="horizontal">
                        <FieldTitle>{label}</FieldTitle>
                        <FieldContent>
                          <Switch checked={Boolean(createDraft[name] ?? false)} onCheckedChange={(checked) => setCreateDraft((d) => ({...d, [name]: coerceDbAdminFieldInput(kind, '', checked)}))} />
                        </FieldContent>
                      </Field>
                    )
                  }

                  if (kind === 'unknown' || kind === 'object' || kind === 'array' || kind === 'record' || kind === 'union') {
                    if (name === 'tags' && kind === 'array' && 'of' in m && m.of.kind === 'string') {
                      const current = createDraft[name]
                      return (
                        <Field key={name}>
                          <FieldTitle>{label}</FieldTitle>
                          <FieldContent>
                            <Input
                              value={formatCsvTags(current)}
                              onChange={(e) => {
                                const raw = e.target.value
                                setCreateDraft((d) => ({...d, [name]: raw}))
                              }}
                              placeholder="comma-separated tags (e.g. nextjs, convex, cli)"
                            />
                          </FieldContent>
                        </Field>
                      )
                    }
                    return (
                      <Field key={name}>
                        <FieldTitle>{label}</FieldTitle>
                        <FieldContent>
                          <Textarea value={typeof createDraft[name] === 'string' ? (createDraft[name] as string) : formatDbAdminCellValue(createDraft[name] ?? '')} onChange={(e) => setCreateDraft((d) => ({...d, [name]: e.target.value}))} placeholder="JSON / text" />
                        </FieldContent>
                      </Field>
                    )
                  }

                  if (kind === 'enum' && 'values' in m) {
                    const selected = typeof createDraft[name] === 'string' ? (createDraft[name] as string) : null
                    return (
                      <Field key={name}>
                        <FieldTitle>{label}</FieldTitle>
                        <FieldContent>
                          <Select value={selected} onValueChange={(val) => setCreateDraft((d) => ({...d, [name]: val ?? undefined}))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={`Select ${name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {m.values.map((val) => (
                                <SelectItem key={String(val)} value={String(val)}>
                                  {String(val)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldContent>
                      </Field>
                    )
                  }

                  return (
                    <Field key={name}>
                      <FieldTitle>{label}</FieldTitle>
                      <FieldContent>
                        <Input type={kind === 'number' ? 'number' : 'text'} value={typeof createDraft[name] === 'string' ? (createDraft[name] as string) : String(createDraft[name] ?? '')} onChange={(e) => setCreateDraft((d) => ({...d, [name]: coerceDbAdminFieldInput(kind, e.target.value)}))} />
                      </FieldContent>
                    </Field>
                  )
                })}
              </FieldGroup>

              <DialogFooter>
                <Button onClick={onCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex flex-wrap items-baseline gap-x-1.25 text-xl font-semibold tracking-tight">
              <span>{tableTitle}</span>
              <span className="text-muted-foreground">Data</span>
            </CardTitle>

            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline">{Object.keys(meta.fields).length} fields</Badge>
              <Badge variant="secondary">{results.length} items</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {status === 'LoadingFirstPage' ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : results.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No rows yet</EmptyTitle>
                <EmptyDescription>Create the first document for `{table}`.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table className="text-sm">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    {columnNames.map((c) => (
                      <TableHead key={c}>{c}</TableHead>
                    ))}
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(results as DatabaseDocument[]).map((row) => (
                    <TableRow key={row._id}>
                      {columnNames.map((c) => {
                        if (c === '_id') {
                          const full = row._id
                          return (
                            <TableCell key={c} className="max-w-40">
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <button type="button" className="inline-flex min-w-0 max-w-full cursor-default border-0 bg-transparent p-0 text-left" data-id={full}>
                                      <Badge variant="outline" className="min-w-0 max-w-full justify-start truncate font-mono text-xs font-normal pointer-events-none">
                                        {shortConvexDocumentId(full)}
                                      </Badge>
                                    </button>
                                  }
                                />
                                <TooltipContent side="top" className="max-w-sm break-all font-mono text-xs">
                                  {full}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          )
                        }
                        if (c === '_creationTime') {
                          return (
                            <TableCell key={c} className="text-muted-foreground tabular-nums">
                              {formatConvexCreationTime(row._creationTime)}
                            </TableCell>
                          )
                        }
                        return <TableCell key={c}>{formatDbAdminCellValue((row as Record<string, unknown>)[c])}</TableCell>
                      })}
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <ButtonGroup className="overflow-hidden rounded-lg border border-border bg-background">
                            <Dialog open={editRow?._id === row._id} onOpenChange={(open) => (open ? openEdit(row) : setEditRow(null))}>
                              <DialogTrigger
                                render={
                                  <Button variant="outline" size="icon-sm" className={cn(tableRowActionBtnClass, tableRowActionIconClass, 'bg-background hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50')} aria-label="Edit">
                                    <PencilIcon aria-hidden />
                                  </Button>
                                }
                              />
                              <DialogContent showCloseButton>
                                <DialogHeader>
                                  <DialogTitle>Edit</DialogTitle>
                                  <DialogDescription>{row._id}</DialogDescription>
                                </DialogHeader>

                                {!editRow ? null : (
                                  <FieldGroup>
                                    {fields.map(([name, m]) => {
                                      const label = `${name}${m.optional ? '' : ' *'}`
                                      const kind = m.kind
                                      const current = editRow[name]
                                      const draft = editDraft[name]
                                      const value = draft !== undefined ? draft : current

                                      if (kind === 'boolean') {
                                        return (
                                          <Field key={name} orientation="horizontal">
                                            <FieldTitle>{label}</FieldTitle>
                                            <FieldContent>
                                              <Switch checked={Boolean(value ?? false)} onCheckedChange={(checked) => setEditDraft((d) => ({...d, [name]: coerceDbAdminFieldInput(kind, '', checked)}))} />
                                            </FieldContent>
                                          </Field>
                                        )
                                      }

                                      if (kind === 'unknown' || kind === 'object' || kind === 'array' || kind === 'record' || kind === 'union') {
                                        if (name === 'tags' && kind === 'array' && 'of' in m && m.of.kind === 'string') {
                                          return (
                                            <Field key={name}>
                                              <FieldTitle>{label}</FieldTitle>
                                              <FieldContent>
                                                <Input
                                                  value={formatCsvTags(value)}
                                                  onChange={(e) => {
                                                    const raw = e.target.value
                                                    setEditDraft((d) => ({...d, [name]: raw}))
                                                  }}
                                                  placeholder="comma-separated tags (e.g. nextjs, convex, cli)"
                                                />
                                              </FieldContent>
                                            </Field>
                                          )
                                        }
                                        return (
                                          <Field key={name}>
                                            <FieldTitle>{label}</FieldTitle>
                                            <FieldContent>
                                              <Textarea value={typeof value === 'string' ? value : formatDbAdminCellValue(value ?? '')} onChange={(e) => setEditDraft((d) => ({...d, [name]: e.target.value}))} placeholder="JSON / text" />
                                            </FieldContent>
                                          </Field>
                                        )
                                      }

                                      if (kind === 'enum' && 'values' in m) {
                                        const selected = typeof value === 'string' ? value : null
                                        return (
                                          <Field key={name}>
                                            <FieldTitle>{label}</FieldTitle>
                                            <FieldContent>
                                              <Select value={selected} onValueChange={(val) => setEditDraft((d) => ({...d, [name]: val ?? undefined}))}>
                                                <SelectTrigger className="w-full">
                                                  <SelectValue placeholder={`Select ${name}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {m.values.map((val) => (
                                                    <SelectItem key={String(val)} value={String(val)}>
                                                      {String(val)}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </FieldContent>
                                          </Field>
                                        )
                                      }

                                      return (
                                        <Field key={name}>
                                          <FieldTitle>{label}</FieldTitle>
                                          <FieldContent>
                                            <Input type={kind === 'number' ? 'number' : 'text'} value={typeof value === 'string' ? value : String(value ?? '')} onChange={(e) => setEditDraft((d) => ({...d, [name]: coerceDbAdminFieldInput(kind, e.target.value)}))} />
                                          </FieldContent>
                                        </Field>
                                      )
                                    })}
                                  </FieldGroup>
                                )}

                                <DialogFooter>
                                  <Button onClick={onUpdate}>Save</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button variant="destructive" size="icon-sm" className={cn(tableRowActionBtnClass, tableRowActionIconClass)} aria-label="Delete">
                                    <TrashIcon aria-hidden />
                                  </Button>
                                }
                              />
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete row?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onRemove(row._id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </ButtonGroup>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {status === 'CanLoadMore' && (
            <div className="flex items-center justify-center pt-4">
              <Button variant="outline" disabled={isLoading} onClick={() => loadMore(PAGE_SIZE)}>
                {isLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

function UnknownTablePage({slug}: {slug: string}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Unknown table</CardTitle>
          <CardDescription>Table `{slug}` is not present in generated meta.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Link href="/db">
            <Button variant="outline">Back to /db</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

export default function DatabaseItemPage() {
  const params = useParams<{slug: string}>()
  return isDbTable(params.slug) ? <DatabaseTablePageInner slug={params.slug} /> : <UnknownTablePage slug={params.slug} />
}
