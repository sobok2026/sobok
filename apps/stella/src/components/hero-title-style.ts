const FONT_SIZE_REM = 1.875
const GRADIENT_WIDTH_REM = 24

/** Visual contract shared by the page H1 and its Canvas representation. */
export const HERO_TITLE_STYLE = {
  fontSizeRem: FONT_SIZE_REM,
  fontWeight: 800,
  gradientWidthEm: GRADIENT_WIDTH_REM / FONT_SIZE_REM,
  gradientWidthRem: GRADIENT_WIDTH_REM,
  lineHeight: 1.2,
} as const
