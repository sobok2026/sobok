// An `as const` object and not a tuple: the values are opaque numeric strings, so `POST_FILTER.FOLLOWING` is
// the only readable way to name one. See `../censorship/model.ts` for why this is not an enum.
export const POST_FILTER = {
  FOLLOWING: '0',
  MANGA: '1',
  RECOMMEND: '2',
  USER: '3',
  USER_REPLY: '4',
} as const

export type PostFilter = (typeof POST_FILTER)[keyof typeof POST_FILTER]
