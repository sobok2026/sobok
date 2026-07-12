import { LOCALE_NATIVE_NAMES, Locale } from '@sobok/domain/locale'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

import DmcaCounterFormClient from './DmcaCounterFormClient'

const searchParamsSchema = z.object({
  error: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional()),
})

const DMCA_EMAIL = 'sobok2026@gmail.com'

export default async function Page({ params, searchParams }: PageProps<'/[locale]/doc/dmca/counter'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Doc.dmca.counter.page' })
  const parsed = searchParamsSchema.parse(await searchParams)

  const errorMessage =
    parsed.error === 'no-target'
      ? t('errors.noTarget')
      : parsed.error === 'server'
        ? t('errors.server')
        : parsed.error
          ? t('errors.invalid')
          : null

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
          <span className="text-foreground-subtle">{t('languageLabel')}</span>
          {Object.values(Locale).map((code) => (
            <Link
              aria-current={locale === code ? 'page' : undefined}
              className="rounded-full border border-border px-2 py-1 hover:bg-surface"
              href="/doc/dmca/counter"
              key={code}
              locale={code}
              prefetch={false}
            >
              {LOCALE_NATIVE_NAMES[code]}
            </Link>
          ))}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-sm text-foreground-muted">{t('subtitle')}</p>
          </div>
        </div>

        <div className="mt-6">
          <Link
            className="text-sm underline underline-offset-4 text-foreground-secondary hover:text-foreground"
            href="/doc/dmca"
            prefetch={false}
          >
            {t('backToNotice')}
          </Link>
        </div>

        <p className="mt-3 text-sm text-foreground-muted">{t('hint', { dmcaEmail: DMCA_EMAIL })}</p>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="mt-6">
          <DmcaCounterFormClient dmcaEmail={DMCA_EMAIL} />
        </div>
      </div>
    </div>
  )
}
