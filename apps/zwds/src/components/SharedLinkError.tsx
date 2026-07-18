'use client'

import { useLocale, useTranslations } from 'next-intl'

export default function SharedLinkError() {
  const locale = useLocale()
  const t = useTranslations('Zwds.shared')

  return (
    <main className="bg-night-palace flex min-h-dvh flex-col items-center justify-center px-4 pt-[calc(4.5rem+var(--safe-area-top))] pb-[max(2.5rem,var(--safe-area-bottom))] text-foreground">
      <div className="mx-auto max-w-md rounded-3xl border bg-surface-2 p-6 text-center backdrop-blur-xl">
        <p className="text-sm text-danger">{t('invalid')}</p>
        <a
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 active:scale-[0.98] motion-reduce:active:scale-100"
          href={`/${locale}`}
        >
          {t('createOwn')}
        </a>
      </div>
    </main>
  )
}
