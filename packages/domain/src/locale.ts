// A tuple and not an enum, so the four locales are one declaration every layer can reach. A string enum is
// nominal — `'ko'` is not assignable to it — so a table keyed by locale had to import the enum as a VALUE just
// to write `[Locale.KO]:`, and any module that could not take a runtime import (the Workers bundles, whose
// tsconfigs map no `@sobok/*` path) re-declared the union instead. That happened nine times. The tuple also
// feeds `z.enum(LOCALES)` directly, so a wire schema cannot drift from the type.
export const LOCALES = ['ko', 'en', 'ja', 'zh'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ko'

export const LOCALE_NATIVE_NAMES = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '简体中文',
} as const satisfies Record<Locale, string>

export const LOCALE_LANGUAGE_TAGS = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
} as const satisfies Record<Locale, string>

export const LOCALE_OPEN_GRAPH_TAGS = {
  ko: 'ko_KR',
  en: 'en_US',
  ja: 'ja_JP',
  zh: 'zh_CN',
} as const satisfies Record<Locale, string>

export const LOCALE_HREFLANG_TAGS = {
  ko: 'ko',
  en: 'en',
  ja: 'ja',
  zh: 'zh-Hans',
} as const satisfies Record<Locale, string>

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}
