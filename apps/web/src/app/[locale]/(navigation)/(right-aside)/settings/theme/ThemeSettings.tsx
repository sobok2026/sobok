'use client'

import { Check, Monitor, Moon, Palette, Sparkles, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { SYSTEM_THEME, Theme } from '@/store/theme'

const THEME_OPTIONS = [
  {
    value: SYSTEM_THEME,
    messageKey: 'system',
    Icon: Monitor,
  },
  {
    value: Theme.LIGHT,
    messageKey: 'light',
    Icon: Sun,
  },
  {
    value: Theme.DARK,
    messageKey: 'dark',
    Icon: Moon,
  },
  {
    value: Theme.NEON,
    messageKey: 'neon',
    Icon: Sparkles,
  },
  {
    value: Theme.RETRO,
    messageKey: 'retro',
    Icon: Palette,
  },
] as const

export default function ThemeSettings() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const t = useTranslations('Settings.theme')

  // The CDN-cached HTML is theme-neutral, so the selected theme is only known
  // after mount. Gate the selected state to avoid a hydration mismatch.
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="grid gap-2">
      {THEME_OPTIONS.map(({ value, messageKey, Icon }) => {
        const isSelected = mounted && theme === value

        return (
          <button
            aria-pressed={isSelected}
            className={twMerge(
              'flex items-center gap-4 p-4 rounded-lg border-2 transition text-left border-border-2 hover:border-border-strong hover:bg-surface-2/30',
              'aria-pressed:border-brand aria-pressed:bg-surface-2/50',
            )}
            key={value}
            onClick={() => setTheme(value)}
            type="button"
          >
            <div
              className="size-10 rounded-lg shrink-0 flex items-center justify-center border border-border-2 bg-background"
              data-theme={value === SYSTEM_THEME ? undefined : value}
            >
              <Icon className="size-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{t(`options.${messageKey}.label`)}</div>
              <div className="text-sm text-foreground-muted">{t(`options.${messageKey}.description`)}</div>
            </div>
            {isSelected && <Check className="size-5 text-brand shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
