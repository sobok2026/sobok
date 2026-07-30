// The values are the URL query strings. See `../censorship/model.ts` for why this is not an enum.
export const NOTIFICATION_FILTERS = ['new', 'unread'] as const

export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number]
