// The integers are the DB values, so the names stay reachable through an `as const` object. See
// `censorship/model.ts` for why this is not an enum.
export const NOTIFICATION_CONDITION_TYPE = {
  SERIES: 1,
  CHARACTER: 2,
  TAG: 3,
  ARTIST: 4,
  GROUP: 5,
  LANGUAGE: 6,
  UPLOADER: 7,
} as const

export type NotificationConditionType = (typeof NOTIFICATION_CONDITION_TYPE)[keyof typeof NOTIFICATION_CONDITION_TYPE]

const NOTIFICATION_CONDITION_TYPES: readonly number[] = Object.values(NOTIFICATION_CONDITION_TYPE)

/**
 * Guards a number that came from outside — a `<select>` value parsed back out of FormData, a column read.
 * Needed because the shape this narrows to used to be a numeric enum, and TypeScript lets any `number` be
 * assigned to one of those, so every such boundary type-checked without anyone deciding what an unrecognised
 * value should do.
 */
export function isNotificationConditionType(value: number): value is NotificationConditionType {
  return NOTIFICATION_CONDITION_TYPES.includes(value)
}

export const NOTIFICATION_TYPE = {
  NEW_MANGA: 0,
  BOOKMARK_UPDATE: 1,
  CRAWL_HISTORY: 2,
  TEST: 3,
} as const

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

// `satisfies` rather than a bare `as const`: the table is keyed by every condition type, and a type added above
// without a name here is the kind of gap that only shows up as an undefined label on someone's screen.
export const NotificationConditionTypeNames = {
  [NOTIFICATION_CONDITION_TYPE.SERIES]: '시리즈',
  [NOTIFICATION_CONDITION_TYPE.CHARACTER]: '캐릭터',
  [NOTIFICATION_CONDITION_TYPE.TAG]: '태그',
  [NOTIFICATION_CONDITION_TYPE.ARTIST]: '작가',
  [NOTIFICATION_CONDITION_TYPE.GROUP]: '그룹',
  [NOTIFICATION_CONDITION_TYPE.LANGUAGE]: '언어',
  [NOTIFICATION_CONDITION_TYPE.UPLOADER]: '업로더',
} as const satisfies Record<NotificationConditionType, string>

export type NotificationData = {
  url?: string
  artists?: string[]
  previewImageURL?: string
  mangaId?: number
}
