// An `as const` object and not a tuple: `__Secure-pt` carries a cookie prefix the name explains and the bare
// string does not. See `@sobok/domain/censorship/model` for why this is not an enum.
export const COOKIE_KEY = {
  LOCALE: 'locale',
  POINTS_TURNSTILE: '__Secure-pt',
} as const

export type CookieKey = (typeof COOKIE_KEY)[keyof typeof COOKIE_KEY]
