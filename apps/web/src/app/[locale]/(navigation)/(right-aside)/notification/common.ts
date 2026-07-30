// Named `NOTIFICATION_PARAM` rather than `SearchParams`: every consumer also calls `useSearchParams`, and two
// spellings of the same word meaning different things is how the wrong one gets imported. See
// `@sobok/domain/censorship/model` for why this is not an enum.
export const NOTIFICATION_PARAM = {
  FILTER: 'filter',
} as const
