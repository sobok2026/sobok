import type { Locale } from '@sobok/domain/locale'

import { fontStylesheetHref, LOCALE_FONT_FAMILIES } from './fonts'

/**
 * The `@font-face` sheets a document needs, as plain stylesheet links.
 *
 * They stay out of the app's own CSS bundle on purpose: together they are the largest stylesheet
 * on the page and they only change when a font version does, so folding them into the bundle would
 * throw them away on every design tweak. `precedence` lets React hoist and dedupe them, and the
 * versioned URLs let the CDN hold them forever.
 */
export default function FontStylesheets({ locale }: { locale: Locale }) {
  return LOCALE_FONT_FAMILIES[locale].map((id) => (
    <link href={fontStylesheetHref(id)} key={id} precedence="font" rel="stylesheet" />
  ))
}
