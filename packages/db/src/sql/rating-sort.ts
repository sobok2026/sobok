import { userRatingTable } from '@sobok/db/app/activity'
import { encodeRatingCursor } from '@sobok/db/cursor'
import type { RatingSort } from '@sobok/domain/library/sort'
import { and, asc, desc, eq, gt, lt, or, type SQL } from 'drizzle-orm'

export type RatingCursor = {
  rating: number
  timestamp: number
  mangaId: number
}

export type RatingRow = {
  mangaId: number
  rating: number
  createdAt: Date
  updatedAt: Date
}

export function buildRatingWhereClause(userId: string, sort: RatingSort, cursor?: RatingCursor | null) {
  const conditions: SQL[] = [eq(userRatingTable.userId, userId)]

  if (cursor) {
    conditions.push(getRatingCursorCondition(sort, cursor))
  }

  return and(...conditions)!
}

export function getNextRatingCursor(sort: RatingSort, row: RatingRow) {
  const timestamp = getRatingCursorTimestamp(sort, row)
  return encodeRatingCursor(row.rating, timestamp, row.mangaId)
}

export function getRatingOrderByClauses(sort: RatingSort): SQL[] {
  switch (sort) {
    case 'created-desc':
      return [desc(userRatingTable.createdAt), desc(userRatingTable.mangaId)]
    case 'manga-id-asc':
      return [asc(userRatingTable.mangaId)]
    case 'manga-id-desc':
      return [desc(userRatingTable.mangaId)]
    case 'rating-asc':
      return [asc(userRatingTable.rating), desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId)]
    case 'rating-desc':
      return [desc(userRatingTable.rating), desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId)]
    case 'updated-desc':
      return [desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId)]
  }
}

function getRatingCursorCondition(sort: RatingSort, cursor: RatingCursor) {
  const cursorTime = new Date(cursor.timestamp)

  switch (sort) {
    case 'created-desc':
      return or(
        lt(userRatingTable.createdAt, cursorTime),
        and(eq(userRatingTable.createdAt, cursorTime), lt(userRatingTable.mangaId, cursor.mangaId)),
      )!
    case 'manga-id-asc':
      return gt(userRatingTable.mangaId, cursor.mangaId)
    case 'manga-id-desc':
      return lt(userRatingTable.mangaId, cursor.mangaId)
    case 'rating-asc':
      return or(
        gt(userRatingTable.rating, cursor.rating),
        and(eq(userRatingTable.rating, cursor.rating), lt(userRatingTable.updatedAt, cursorTime)),
        and(
          eq(userRatingTable.rating, cursor.rating),
          eq(userRatingTable.updatedAt, cursorTime),
          lt(userRatingTable.mangaId, cursor.mangaId),
        ),
      )!
    case 'rating-desc':
      return or(
        lt(userRatingTable.rating, cursor.rating),
        and(eq(userRatingTable.rating, cursor.rating), lt(userRatingTable.updatedAt, cursorTime)),
        and(
          eq(userRatingTable.rating, cursor.rating),
          eq(userRatingTable.updatedAt, cursorTime),
          lt(userRatingTable.mangaId, cursor.mangaId),
        ),
      )!
    case 'updated-desc':
      return or(
        lt(userRatingTable.updatedAt, cursorTime),
        and(eq(userRatingTable.updatedAt, cursorTime), lt(userRatingTable.mangaId, cursor.mangaId)),
      )!
  }
}

function getRatingCursorTimestamp(sort: RatingSort, row: RatingRow) {
  switch (sort) {
    case 'created-desc':
      return row.createdAt.getTime()
    case 'manga-id-asc':
    case 'manga-id-desc':
    case 'rating-asc':
    case 'rating-desc':
    case 'updated-desc':
      return row.updatedAt.getTime()
  }
}
