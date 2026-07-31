import type { Locale } from '@sobok/domain/locale'

/**
 * The web font families every sobok app serves, and which of them each locale actually needs.
 *
 * The files themselves are vendored, unmodified, into each app's `public/fonts/<id>/<version>/`.
 * The copies are byte-identical, so git stores one blob set for all of them and a sixth app would
 * add nothing — but that also means an upgrade has to land in every app at once, or the copies
 * silently diverge. `README.md` has the ritual; the npm packages named below are dev dependencies
 * purely so the source of a copy is one `bun update` away and its version is in the lockfile.
 *
 * `version` is the URL segment that lets the files be served immutable, which is why it is written
 * here by hand rather than read from anywhere: changing it is the deliberate act of publishing new
 * files at a new URL.
 */

export type FontFamilyId = 'noto-sans-sc' | 'pretendard' | 'pretendard-jp'

type FontFamily = {
  /** npm package the vendored copy was taken from. */
  readonly package: string
  /** Version of that package; also the URL segment that makes the files immutable. */
  readonly version: string
  /** `@font-face` sheet, relative to the family's served directory. */
  readonly stylesheet: string
}

export const FONT_FAMILIES = {
  /**
   * Korean. Carries the full composed-Hangul syllable block plus Korean-form Han, so it leads
   * everywhere except Japanese and Simplified Chinese documents.
   */
  pretendard: {
    package: 'pretendard',
    version: '1.3.9',
    stylesheet: 'pretendardvariable-dynamic-subset.css',
  },
  /** Japanese. Kana and JIS kanji, which the base family does not cover. */
  'pretendard-jp': {
    package: 'pretendard-jp',
    version: '1.3.9',
    stylesheet: 'pretendardvariable-jp-dynamic-subset.css',
  },
  /** Simplified Chinese. Neither Pretendard build carries SC hanzi at all. */
  'noto-sans-sc': {
    package: '@fontsource-variable/noto-sans-sc',
    version: '5.3.0',
    stylesheet: 'wght.css',
  },
} as const satisfies Record<FontFamilyId, FontFamily>

/**
 * Which sheets a document in each locale loads, in `<link>` order.
 *
 * Every sheet is ~9–21 KB brotli of `unicode-range` declarations that block the first paint, so a
 * locale only takes the families its own text needs. Loading a sheet is not what picks a glyph —
 * `font-family` order in `styles.css` does that — it only decides which families are available to
 * be picked, and a script with no family loaded still renders from the system stack rather than
 * as tofu. So the cost of omitting one is a different face on stray foreign text, not a broken
 * page, and Korean keeps `pretendard-jp` only because rare Han genuinely falls through to it.
 */
export const LOCALE_FONT_FAMILIES = {
  ko: ['pretendard', 'pretendard-jp'],
  en: ['pretendard'],
  ja: ['pretendard-jp', 'pretendard'],
  zh: ['noto-sans-sc', 'pretendard'],
} as const satisfies Record<Locale, readonly FontFamilyId[]>

/** Public URL of a family's `@font-face` sheet, as served from an app's `public/`. */
export function fontStylesheetHref(id: FontFamilyId): string {
  const { stylesheet, version } = FONT_FAMILIES[id]
  return `/fonts/${id}/${version}/${stylesheet}`
}
