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

The font files are not in the repo. They are pinned npm dependencies of this package, and
`scripts/syncFonts.ts` publishes them into the `public/fonts/` of every app that depends on
`@sobok/typography`. The root `postinstall` runs it, so `bun install` is the only step — a fresh
clone, a new app, and a font upgrade all need nothing more. Those directories are git-ignored.

Serving from `public/` rather than importing the sheets through the bundler is what buys the two
things that matter here: a versioned, immutable URL per family, and the ability to load only the
families a locale needs. Bundling them would fold ~50 KB (brotli) of `@font-face` into a CSS file
that changes on every design tweak, and would hand every locale all three families.

## Upgrading a family

1. Bump the version in this package's `dependencies`.
2. Bump the matching `version` in `src/fonts.ts` — it is a URL segment, so it is a reviewed value.
3. `bun install`.

The sync script refuses to run when those two disagree, so they cannot drift apart silently. Old
version directories are removed on the next install.

## Adding a locale

`LOCALE_FONT_FAMILIES` in `src/fonts.ts` is `satisfies Record<Locale, …>`, so adding a locale to
`@sobok/domain` fails the build here until its font families are declared. A locale only takes the
families its own text needs; a script whose family it does not load still renders from the platform
stack that every `font-family` here ends with, so the cost of leaving one out is a different face on
stray foreign text, never tofu.
