import 'server-only'

import { and, desc, eq, gt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import type { CommentPage } from '@/lib/comments'
// The Worker owns the DB, so it owns the schema. This build-time reader imports that same (pure drizzle)
// schema — one source of truth, so a column rename is a compile error here, not a silent bake failure.
import { commentTable, commentThreadTable } from '../../worker/db/schema'

// Build-time bake of comment boards into the static export. Each /talk/[topic] page is prerendered with its
// first page of comments already in the HTML (fresh SEO snapshot + no first-paint flash); the client then
// re-fetches live on mount. Reads the DB DIRECTLY (not Hyperdrive — that is a runtime Worker binding), via
// STELLA_POSTGRES_URL_DIRECT. When that env var is absent (local/offline build) the bake is skipped and every
// board renders empty — the build never depends on DB reachability to succeed.
//
// Must match the Worker's list endpoint: newest-first, PAGE per page, opaque cursor = base64url(`ms.id`).
const PAGE = 20

export interface BakedBoard {
  page: CommentPage
  count: number
}

interface Row {
  locale: string
  topicKey: string
  id: number
  publicId: string
  nickname: string | null
  body: string
  createdAt: Date
}

function encodeCursor(createdAt: Date, id: number): string {
  return btoa(`${createdAt.getTime()}.${id}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

let cache: Promise<Map<string, BakedBoard>> | null = null

// Memoized so generateStaticParams / generateMetadata / the page component share a single DB read per build.
export function loadBakedBoards(): Promise<Map<string, BakedBoard>> {
  cache ??= load()
  return cache
}

async function load(): Promise<Map<string, BakedBoard>> {
  const url = process.env.STELLA_POSTGRES_URL_DIRECT
  if (!url) {
    return new Map()
  }

  const client = postgres(url, { max: 1, prepare: false })
  const db = drizzle({ client })

  try {
    // Every visible comment of every non-empty thread, newest-first. Grouping + top-PAGE happens in JS below;
    // at build the total comment volume is small and this is a single query. Global desc order means each
    // group is already sorted as we bucket it.
    const rows: Row[] = await db
      .select({
        locale: commentThreadTable.locale,
        topicKey: commentThreadTable.topicKey,
        id: commentTable.id,
        publicId: commentTable.publicId,
        nickname: commentTable.nickname,
        body: commentTable.body,
        createdAt: commentTable.createdAt,
      })
      .from(commentTable)
      .innerJoin(commentThreadTable, eq(commentTable.threadId, commentThreadTable.id))
      .where(and(eq(commentTable.status, 'visible'), gt(commentThreadTable.commentCount, 0)))
      .orderBy(desc(commentTable.createdAt), desc(commentTable.id))

    const grouped = new Map<string, Row[]>()

    for (const row of rows) {
      const key = `${row.locale}:${row.topicKey}`
      const list = grouped.get(key)
      if (list) {
        list.push(row)
      } else {
        grouped.set(key, [row])
      }
    }

    const boards = new Map<string, BakedBoard>()

    for (const [key, list] of grouped) {
      const hasMore = list.length > PAGE
      const shown = hasMore ? list.slice(0, PAGE) : list
      const last = shown[shown.length - 1]

      boards.set(key, {
        count: shown.length,
        page: {
          comments: shown.map((r) => ({
            publicId: r.publicId,
            nickname: r.nickname,
            body: r.body,
            createdAt: r.createdAt.toISOString(),
          })),
          nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
        },
      })
    }

    return boards
  } catch (error) {
    // A DB hiccup at build must not fail the whole static export — degrade to empty boards.
    console.warn('board-bake: skipped (DB read failed)', error)
    return new Map()
  } finally {
    await client.end({ timeout: 5 })
  }
}
