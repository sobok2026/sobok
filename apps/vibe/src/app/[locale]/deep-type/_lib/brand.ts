import { Locale } from '@sobok/domain/locale'

// Kept untranslated in en/ja/zh, matching SITE_NAME's convention in src/constants.ts.
export const DEEP_TYPE_BRAND_NAME = {
  [Locale.KO]: '겉속유형',
  [Locale.EN]: 'DeepType',
  [Locale.JA]: 'DeepType',
  [Locale.ZH]: 'DeepType',
} satisfies Record<Locale, string>
