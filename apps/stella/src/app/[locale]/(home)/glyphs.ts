/** Append the text-style variation selector (U+FE0E) so inline glyphs render as text, not emoji. */
export const glyphText = (glyph: string) => `${glyph}︎`
