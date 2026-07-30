// The integers are the DB values, so the names stay reachable through an `as const` object. See
// `censorship/model.ts` for why this is not an enum.
export const POST_TYPE = {
  TEXT: 0,
  POLL: 1,
  REPLY: 2,
  REPOST: 3,
} as const

export type PostType = (typeof POST_TYPE)[keyof typeof POST_TYPE]
