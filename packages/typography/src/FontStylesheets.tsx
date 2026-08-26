import type { Locale } from '@sobok/domain/locale'

import { fontStylesheetHref, LOCALE_FONT_FAMILIES } from './fonts'

const KOREAN_WITHOUT_HAN_WEBFONT = ['pretendard'] as const

type FontStylesheetsProps = {
  locale: Locale
  /**
   * Keep this enabled unless a closed Korean copy surface is checked at build time and contains no
   * unified Han or kana. User-authored or remote content must always keep the default.
   */
  includeKoreanHanWebfont?: boolean
}

/**
 * The `@font-face` sheets a document needs, as plain stylesheet links.
 *
 * They stay out of the app's own CSS bundle on purpose: together they are the largest stylesheet
 * on the page and they only change when a font version does, so folding them into the bundle would
 * throw them away on every design tweak. `precedence` lets React hoist and dedupe them, and the
 * versioned URLs let the CDN hold them forever.
 */
export default function FontStylesheets({ locale, includeKoreanHanWebfont = true }: FontStylesheetsProps) {
  if (locale !== 'ko' && !includeKoreanHanWebfont) {
    throw new Error('includeKoreanHanWebfont can only be disabled for the Korean locale.')
  }

  const families =
    locale === 'ko' && !includeKoreanHanWebfont ? KOREAN_WITHOUT_HAN_WEBFONT : LOCALE_FONT_FAMILIES[locale]

  return families.map((id) => <link href={fontStylesheetHref(id)} key={id} precedence="font" rel="stylesheet" />)
}
