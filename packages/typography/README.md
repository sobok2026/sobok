# @sobok/typography

Every typographic decision that is a property of the **language**, not of an app: which font families
exist, which of them each locale loads, which face wins for a given script, and how each language
breaks lines. Apps own their color, scale, and weight; none of them own any of this.

## Using it

Two lines per app, and nothing else.

```css
/* src/app/globals.css */
@import 'tailwindcss' source(none);
@import '@sobok/typography/styles.css';
```

```tsx
/* src/app/[locale]/layout.tsx */
import FontStylesheets from '@sobok/typography/stylesheets'
;<html lang={LOCALE_LANGUAGE_TAGS[locale]}>
  <FontStylesheets locale={locale} />
  <body>…</body>
</html>
```

An app must not restate a `font-family`, and must not branch on locale to pick one. Canvas code that
needs the stack reads `getComputedStyle(document.body).fontFamily` rather than repeating it.

`@sobok/typography` also has to be in the app's `transpilePackages`, because the package ships raw
`.tsx`.

## Where the bytes come from

Each app carries its own committed copy under `public/fonts/<family>/<version>/`, taken unmodified
from the npm package named in `src/fonts.ts`. The copies are byte-identical, so git stores one blob
set for all of them and a sixth app would add nothing to the history — the duplication is on disk,
not in the repo.

Serving from `public/` rather than importing the sheets through the bundler is what buys the two
things that matter here: a versioned, immutable URL per family, and the ability to load only the
families a locale needs. Bundling them would fold ~49 KB (brotli) of `@font-face` into a CSS bundle
that is otherwise 5.5 KB and changes on every design tweak, and would hand every locale all three
families.

## The fallback faces

The vendored sheets ship `font-display: swap`, and their `woff2` files cannot be fetched until the
sheet has been parsed and a first layout has run — so the first paint is _always_ drawn in a device
font, and the web font replaces it a moment later. If the device font sets type at a different width
or line height, that replacement reflows the page. That is the layout shift.

So `styles.css` does not name device fonts in the stacks. It declares `local()`-only `@font-face`
faces that pin a device font to the metrics of the web family it stands in for, and puts _those_ in
the stacks. They cost nothing — no request, and a face whose `local()` finds nothing is skipped.

Four rules keep them honest:

- **A fallback face mirrors exactly one web family's coverage.** Pretendard carries no unified Han,
  so Han on a Korean page is drawn by Pretendard JP — and therefore belongs to the JP fallback, not
  the Korean one. Giving it to the wrong face reintroduces the shift it was meant to remove.
- **`local()` matches full name and PostScript name, never the family name.** `local('PingFang SC')`
  silently finds nothing; `local('PingFang SC Regular')` works. A missed name is invisible: the face
  just reports `error` and the whole correction quietly stops applying.
- **`size-adjust` multiplies the `*-override` values**, so each override is the target percentage
  divided by that face's `size-adjust`.
- **Every constant is measured, and the comment says how.** Vertical metrics are read from the
  fonts' own `head`/`hhea`; widths come from rendering the apps' message catalogs and summing the
  results, because summing per-character advances misses kerning and drifts by over a percentage
  point on Latin.

Latin needs finer splitting than CJK. CJK advances do not move with weight, but Arial Bold sets
about 4% wider than Pretendard SemiBold, so the Latin faces are banded by weight — which also stops
the browser synthesising bold. Latin is split again by `unicode-range`, because Pretendard's space is
9% narrower than Arial's while its letters are 2% wider: English prose cancels the two errors out, a
Korean sentence (whose Latin range is nearly all spaces) does not, and one coefficient cannot serve
both. Split, the coefficients stop depending on the locale.

Re-measure after any font upgrade. `size-adjust` values were measured on macOS device fonts; the
Windows and Android candidates carry the vertical overrides — exact, and platform-independent — but
no width correction, since a wrong `size-adjust` is worse than none.

## Upgrading a family

The three font packages are dev dependencies of this package for exactly this — they are never
imported, they just put the source of a copy one `bun update` away and keep its version in the
lockfile.

1. `bun update <package>` and bump the matching `version` in `src/fonts.ts`.
2. Copy the new files into **every** app, at the new version directory. For Pretendard and
   Pretendard JP that is `dist/web/variable/` plus `dist/LICENSE.txt`; for Noto Sans SC it is
   `wght.css`, `files/`, and `LICENSE`.
3. Delete the old version directories.
4. Re-measure the fallback constants in `styles.css` against the new files.

Nothing enforces step 2, which is the price of having no build step: a half-finished upgrade leaves
the apps disagreeing, and it will not fail a build — the served URL still resolves in the apps that
were updated. `git diff --stat` on the font directories after step 3 is the check, and
`diff -rq apps/stella/public/fonts apps/web/public/fonts` settles any doubt. A divergence also shows
up as unexpected repo growth, since only identical copies deduplicate.

The `<link>` URLs come from `fontStylesheetHref()`, so a version bumped in `src/fonts.ts` but not
copied to disk produces a 404 rather than a stale font.

## Adding a locale

`LOCALE_FONT_FAMILIES` in `src/fonts.ts` is `satisfies Record<Locale, …>`, so adding a locale to
`@sobok/domain` fails the build here until its font families are declared. A locale only takes the
families its own text needs; a script whose family it does not load still renders from the platform
stack that every `font-family` here ends with, so the cost of leaving one out is a different face on
stray foreign text, never tofu.
