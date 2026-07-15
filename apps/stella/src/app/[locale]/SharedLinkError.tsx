'use client'

import { useLocale, useTranslations } from 'next-intl'

import Starfield from './Starfield'

export default function SharedLinkError() {
  const locale = useLocale()
  const t = useTranslations('Shared')

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night-sky px-4 pb-16 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:pt-[calc(6rem+var(--safe-area-top))]">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative z-10 mx-auto max-w-md rounded-3xl border bg-surface-2 p-6 text-center backdrop-blur-xl">
        <p className="text-sm text-danger">{t('invalid')}</p>
        <a
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
          href={`/${locale}`}
        >
          {t('createOwn')}
        </a>
      </div>
    </main>
  )
}
