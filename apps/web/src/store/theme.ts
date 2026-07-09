export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  NEON: 'neon',
  RETRO: 'retro',
} as const

/** Concrete, user-selectable themes (excludes the special `system` value). */
export const THEMES = [Theme.LIGHT, Theme.DARK, Theme.NEON, Theme.RETRO]

/** Special value handled by next-themes: follow the OS `prefers-color-scheme`. */
export const SYSTEM_THEME = 'system'
