// The integers are the wire and DB values, so the names have to stay reachable — hence an `as const` object
// rather than a tuple. Not an enum: an enum is the one type-level declaration that emits runtime JS, which is
// what `erasableSyntaxOnly` forbids and what stops a type-stripping runtime from loading the module at all.
export const CENSORSHIP_KEY = {
  ARTIST: 1,
  GROUP: 2,
  SERIES: 3,
  CHARACTER: 4,
  TAG: 5,
  TAG_CATEGORY_FEMALE: 6,
  TAG_CATEGORY_MALE: 7,
  TAG_CATEGORY_MIXED: 8,
  TAG_CATEGORY_OTHER: 9,
  LANGUAGE: 10,
  UPLOADER: 11,
  TYPE: 12,
} as const

export type CensorshipKey = (typeof CENSORSHIP_KEY)[keyof typeof CENSORSHIP_KEY]

export const CENSORSHIP_LEVEL = {
  NONE: 0,
  LIGHT: 1,
  HEAVY: 2,
} as const

export type CensorshipLevel = (typeof CENSORSHIP_LEVEL)[keyof typeof CENSORSHIP_LEVEL]
