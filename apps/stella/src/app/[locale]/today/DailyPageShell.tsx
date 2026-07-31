'use client'

import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { HeroTitle } from '@/components/HeroTitle'
import SharedLinkError from '@/components/SharedLinkError'
import Starfield from '@/components/Starfield'

import { DAILY_NAMESPACE, type DailySurface, formatDateKey } from './daily'
import type { DailyReading } from './useDailyReading'

type DailyPageShellProps = {
  /** The surface's own body — rendered only once its reading has landed. */
  children: ReactNode
  failed: boolean
  invalid: boolean
  reading: DailyReading | null
  shared: boolean
  surface: DailySurface
}

/**
 * The frame both daily pages wear: night sky, hero, the day being read, and the three states before the
 * reading arrives. Only the body inside differs — /today tells the whole day while /tomorrow previews its
 * lucky pick — so the states around it are described once and stay in step.
 */
export default function DailyPageShell({ children, failed, invalid, reading, shared, surface }: DailyPageShellProps) {
  const locale = useLocale()
  const t = useTranslations(DAILY_NAMESPACE[surface])
  const ts = useTranslations('Shared')
  const tc = useTranslations('Constellation')

  if (invalid) {
    return <SharedLinkError />
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-3 pb-16 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
        <header className="mb-6 w-full text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{t('hero.eyebrow')}</p>
          <HeroTitle>{t('hero.title')}</HeroTitle>
          {reading && (
            <p className="mt-3 text-sm text-foreground-muted/90">
              {formatDateKey(LOCALE_LANGUAGE_TAGS[locale], reading.dateKey)}
            </p>
          )}
          {shared && (
            <p className="mx-auto mt-3 w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
              {ts('viewing')}
            </p>
          )}
        </header>

        {!reading && !failed && (
          <p className="mt-10 animate-pulse text-sm text-foreground-subtle motion-reduce:animate-none">
            {t('computing')}
          </p>
        )}
        {failed && <p className="mt-10 text-sm text-danger">{tc('form.error')}</p>}

        {children}
      </div>
    </main>
  )
}
