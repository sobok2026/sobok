'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

import { THEMES } from '@/store/theme'

type Props = {
  children: ReactNode
}

/**
 * Client theme provider. Resolves the theme entirely on the client (localStorage
 * + `prefers-color-scheme`) and applies `data-theme` before first paint, so the
 * server HTML stays theme-neutral and can be cached publicly on the CDN.
 */
export default function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      themes={THEMES}
    >
      {children}
    </NextThemesProvider>
  )
}
