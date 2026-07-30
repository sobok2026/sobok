import type { Locale } from '@sobok/domain/locale'

// Kept untranslated in en/ja/zh, matching SITE_NAME's convention in src/constants.ts.
export const DEEP_TYPE_BRAND_NAME = {
  ko: '겉속유형',
  en: 'DeepType',
  ja: 'DeepType',
  zh: 'DeepType',
} satisfies Record<Locale, string>
