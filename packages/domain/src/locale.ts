export enum Locale {
  KO = 'ko',
  EN = 'en',
  ZH = 'zh',
  JA = 'ja',
}

export const DEFAULT_LOCALE = Locale.KO

export const LOCALE_NATIVE_NAMES = {
  [Locale.KO]: '한국어',
  [Locale.EN]: 'English',
  [Locale.JA]: '日本語',
  [Locale.ZH]: '简体中文',
}

export const LOCALE_LANGUAGE_TAGS = {
  [Locale.KO]: 'ko-KR',
  [Locale.EN]: 'en-US',
  [Locale.JA]: 'ja-JP',
  [Locale.ZH]: 'zh-CN',
}

export const LOCALE_OPEN_GRAPH_TAGS = {
  [Locale.KO]: 'ko_KR',
  [Locale.EN]: 'en_US',
  [Locale.JA]: 'ja_JP',
  [Locale.ZH]: 'zh_CN',
}

export const LOCALE_HREFLANG_TAGS = {
  [Locale.KO]: 'ko',
  [Locale.EN]: 'en',
  [Locale.JA]: 'ja',
  [Locale.ZH]: 'zh-Hans',
}

export function isLocale(value: string): value is Locale {
  return Object.values(Locale).includes(value as Locale)
}
