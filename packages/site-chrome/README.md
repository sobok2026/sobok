# @sobok/site-chrome

The page furniture every sobok static site puts around its own content: the legal/info document shell, the
footer, the locale switcher, the FAQ accordion.

## The token contract

These components may only use the design tokens **all** sites define:

```
accent · background · border · brand · danger
foreground · foreground-muted · foreground-secondary
positive · surface · surface-2
```

That is the intersection of `apps/{stella,vibe,zwds}/src/app/globals.css`. A component reaching for anything
outside it — `foreground-faint`, `primary`, `ring`, `surface-3` — compiles fine and then renders unstyled on
whichever site lacks the token, because Tailwind simply does not emit a utility for a colour that is not in
that site's theme. There is no build error for this; the contract is the check.

Anything a site wants that the contract cannot express is passed in: `className` for the page background
(each site's is a bespoke gradient utility), and `ReactNode` slots for blocks only one site has.

## Tailwind must be told to scan this package

Every consuming app's `globals.css` starts with `@import 'tailwindcss' source(none)`, which turns off
automatic source detection. Each one therefore carries an explicit

```css
@source '../../../../packages/site-chrome/src';
```

Without it the classes below are never generated and the components render unstyled.
