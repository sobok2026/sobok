// The comment board's pagination cursor: base64url(`<createdAt ms>.<id>`), matching the list query's
// newest-first (createdAt desc, id desc) order.
//
// It has TWO producers that must agree byte for byte — the Worker's list endpoint and the build-time bake
// that prerenders each /talk/[topic] board's first page (src/lib/board-bake.ts). A baked page hands its
// `nextCursor` straight back to the Worker on the reader's first "load more", so a format that drifts between
// them breaks pagination at runtime while both sides still compile. Hence one module, imported by both.
//
// The cursor is opaque but not authorization: it carries only a timestamp and the sequential row id, and the
// list query it feeds is already scoped to one visible thread.

export interface Cursor {
  createdAt: Date
  id: number
}

export function encodeCursor(cursor: Cursor): string {
  return btoa(`${cursor.createdAt.getTime()}.${cursor.id}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) {
    return null
  }
  try {
    const [ms, id] = atob(raw.replace(/-/g, '+').replace(/_/g, '/')).split('.')
    const createdAt = new Date(Number(ms))
    const numId = Number(id)
    if (Number.isNaN(createdAt.getTime()) || !Number.isSafeInteger(numId)) {
      return null
    }
    return { createdAt, id: numId }
  } catch {
    return null
  }
}
