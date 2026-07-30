// Tuples rather than enums: the values ARE the URL query strings, so a call site writing `'created-desc'` is
// writing the thing itself, and `z.enum(LIBRARY_ITEM_SORTS)` keeps validation on the same declaration. See
// `../censorship/model.ts` for why an enum is the wrong tool here.
export const LIBRARY_ITEM_SORTS = ['created-desc', 'created-asc', 'manga-id-desc', 'manga-id-asc'] as const

export type LibraryItemSort = (typeof LIBRARY_ITEM_SORTS)[number]

export const DEFAULT_LIBRARY_ITEM_SORT: LibraryItemSort = 'created-desc'

export const RATING_SORTS = [
  'rating-desc',
  'rating-asc',
  'updated-desc',
  'created-desc',
  'manga-id-desc',
  'manga-id-asc',
] as const

export type RatingSort = (typeof RATING_SORTS)[number]

export function isGroupedRatingSort(sort: RatingSort) {
  return sort === 'rating-desc' || sort === 'rating-asc'
}
