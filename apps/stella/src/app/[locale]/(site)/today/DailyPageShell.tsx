'use client'

import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { HeroTitle } from '@/components/HeroTitle'
import SharedLinkError from '@/components/SharedLinkError'
import Starfield from '@/components/Starfield'

import { formatDateKey } from './daily'

type DailyPageShellProps = {
  /** The surface's own body — rendered only once its reading has landed. */
  children: ReactNode
  /** The pinned day line under the title (daily surfaces only). */
  dateKey?: string | null
  failed: boolean
  /** Love's rose-gold hero gradient; the daily pages wear the brand default. */
  heroTone?: 'love'
  invalid: boolean
  /** Whether the reading is still computing (drives the pulse line). */
  loading: boolean
  /** next-intl namespace for the hero and computing copy. */
  namespace: 'Today' | 'Tomorrow' | 'Love'
  shared: boolean
  /** Love's localized hero subtitle, under the title. */
  subtitle?: ReactNode
}

/**
 * The frame every reading page wears: night sky, hero, the day being read, and the three states before the
 * reading arrives. Only the body inside differs — /today tells the whole day, /tomorrow previews its lucky
 * pick, /love reads the year ahead — so the states around it are described once and stay in step.
 */
export default function DailyPageShell({
  children,
  dateKey,
  failed,
  heroTone,
  invalid,
  loading,
  namespace,
  shared,
  subtitle,
}: DailyPageShellProps) {
  const locale = useLocale()
  const t = useTranslations(namespace)
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
          <HeroTitle tone={heroTone}>{t('hero.title')}</HeroTitle>
          {subtitle && <p className="mt-3 text-sm leading-relaxed text-foreground-muted/90">{subtitle}</p>}
          {dateKey && (
            <p className="mt-3 text-sm text-foreground-muted/90">
              {formatDateKey(LOCALE_LANGUAGE_TAGS[locale], dateKey)}
            </p>
          )}
          {shared && (
            <p className="mx-auto mt-3 w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">
              {ts('viewing')}
            </p>
          )}
        </header>

        {loading && !failed && (
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
