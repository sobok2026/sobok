import type { Locale } from '@sobok/domain/locale'

/**
 * The web font families every sobok app serves, and which of them each locale actually needs.
 *
 * The bytes are not committed anywhere. They come from the pinned npm packages below and
 * `scripts/syncFonts.ts` copies them into each consuming app's `public/fonts/` on `bun install`, so
 * a family exists in exactly one place in the repo (the lockfile) no matter how many apps serve it.
 *
 * `version` is part of the public URL so the files can be served immutable, which means it is a
 * reviewed constant rather than something read at runtime — the sync script refuses to run when it
 * disagrees with the installed package, so the two cannot drift silently.
 */

export type FontFamilyId = 'noto-sans-sc' | 'pretendard' | 'pretendard-jp'

type FontFamily = {
  /** npm package the files come from. */
  readonly package: string
  /** Pinned version of that package; also the URL segment that makes the files immutable. */
  readonly version: string
  /** `@font-face` sheet, relative to the family's served directory. */
  readonly stylesheet: string
  /**
   * Paths inside the npm package to publish, copied in by basename — a file lands next to the
   * stylesheet, a directory keeps its name so the sheet's relative `url()`s still resolve.
   */
  readonly sources: readonly string[]
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
    sources: [
      'dist/LICENSE.txt',
      'dist/web/variable/pretendardvariable-dynamic-subset.css',
      'dist/web/variable/woff2-dynamic-subset',
    ],
  },
  /** Japanese. Kana and JIS kanji, which the base family does not cover. */
  'pretendard-jp': {
    package: 'pretendard-jp',
    version: '1.3.9',
    stylesheet: 'pretendardvariable-jp-dynamic-subset.css',
    sources: [
      'dist/LICENSE.txt',
      'dist/web/variable/pretendardvariable-jp-dynamic-subset.css',
      'dist/web/variable/woff2-dynamic-subset',
    ],
  },
  /** Simplified Chinese. Neither Pretendard build carries SC hanzi at all. */
  'noto-sans-sc': {
    package: '@fontsource-variable/noto-sans-sc',
    version: '5.3.0',
    stylesheet: 'wght.css',
    sources: ['LICENSE', 'wght.css', 'files'],
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
