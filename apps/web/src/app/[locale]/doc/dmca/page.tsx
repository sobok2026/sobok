import { LOCALE_NATIVE_NAMES, Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import DmcaNoticeFormClient from './DmcaNoticeFormClient'

export async function generateMetadata({ params }: PageProps<'/[locale]/doc/dmca'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.doc.dmca' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/doc/dmca',
    }),
  }
}

const searchParamsSchema = z.object({
  error: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional()),
})

const DMCA_EMAIL = 'sobok2026@gmail.com'
const DMCA_AGENT_NAME = 'sobok'
const DMCA_AGENT_REGISTRATION_NUMBER = 'DMCA-1069403'
const DMCA_AGENT_LAST_UPDATED = '2026-01-01'

export default async function Page({ params, searchParams }: PageProps<'/[locale]/doc/dmca'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Doc.dmca.notice.page' })
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="inline-flex text-xs text-foreground-muted hover:text-foreground underline underline-offset-4"
            href="/new"
            prefetch={false}
          >
            {t('backHome')}
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
            <span className="text-foreground-subtle">{t('languageLabel')}</span>
            {Object.values(Locale).map((code) => (
              <Link
                aria-current={locale === code ? 'page' : undefined}
                className="rounded-full border border-border px-2 py-1 hover:bg-surface"
                href="/doc/dmca"
                key={code}
                locale={code}
                prefetch={false}
              >
                {LOCALE_NATIVE_NAMES[code]}
              </Link>
            ))}
          </div>
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
            href="/doc/dmca/counter"
            prefetch={false}
          >
            {t('counterLink')}
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-overlay/30 p-4">
          <h2 className="text-base font-semibold mb-2">{t('agentHeading')}</h2>
          <p className="text-xs text-foreground-muted">
            {t('agentBody', {
              agentName: DMCA_AGENT_NAME,
              registrationNumber: DMCA_AGENT_REGISTRATION_NUMBER,
              lastUpdated: DMCA_AGENT_LAST_UPDATED,
            })}
          </p>
          <p className="mt-2 text-sm text-foreground-secondary">{t('slaBody')}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">{t('noticeHeading')}</h2>
          <p className="text-sm text-foreground-muted">{t('formHint')}</p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="mt-6">
          <DmcaNoticeFormClient dmcaEmail={DMCA_EMAIL} />
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-border bg-overlay/30 p-4">
            <h2 className="text-base font-semibold mb-2">{t('fallbackHeading')}</h2>
            <p className="text-sm text-foreground-secondary">
              {t('fallbackBody')}{' '}
              <a className="underline underline-offset-2 text-foreground" href={`mailto:${DMCA_EMAIL}`}>
                {DMCA_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
