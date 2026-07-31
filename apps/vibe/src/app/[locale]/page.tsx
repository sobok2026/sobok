import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import Footer from '@/components/Footer'
import { SITE_NAME } from '@/constants'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import { getLocale } from '@/i18n/server'
import { FOCUS_CLASS_NAME } from '../../components/focus'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Common.meta' })

  return buildLocalizedMetadata({
    description: t('description'),
    locale,
    pathname: '/',
    title: t('title'),
  })
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Common.home' })
  const home = `/${locale}`

  return (
    <>
      <main className="flex flex-1 flex-col bg-page-bg px-safe py-14 text-page-ink sm:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <p className="font-bold text-page-accent-strong text-sm">{SITE_NAME[locale]}</p>
          <h1 className="mt-3 text-balance font-black text-4xl tracking-[-0.04em] sm:text-5xl">{t('heroTitle')}</h1>
          <p className="mt-4 max-w-xl text-page-ink-soft leading-8">{t('heroSubtitle')}</p>

          <div className="mt-10 grid gap-5">
            <Link
              className={`group rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-7 shadow-[0_20px_70px_rgba(36,22,23,0.07)] transition-colors hover:bg-white ${FOCUS_CLASS_NAME}`}
              href={`${home}/couple-gyeol`}
            >
              <h2 className="font-black text-2xl tracking-[-0.03em]">{t('gyeolCard.title')}</h2>
              <p className="mt-3 text-page-ink-soft leading-7">{t('gyeolCard.description')}</p>
              <span className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-page-ink px-5 font-bold text-sm text-white transition-colors group-hover:bg-page-ink/92">
                {t('gyeolCard.cta')}
              </span>
            </Link>

            <Link
              className={`group rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-7 shadow-[0_20px_70px_rgba(36,22,23,0.07)] transition-colors hover:bg-white ${FOCUS_CLASS_NAME}`}
              href={`${home}/couple-type`}
            >
              <h2 className="font-black text-2xl tracking-[-0.03em]">{t('typeCard.title')}</h2>
              <p className="mt-3 text-page-ink-soft leading-7">{t('typeCard.description')}</p>
              <span className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-page-ink px-5 font-bold text-sm text-white transition-colors group-hover:bg-page-ink/92">
                {t('typeCard.cta')}
              </span>
            </Link>

            <Link
              className={`group rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-7 shadow-[0_20px_70px_rgba(36,22,23,0.07)] transition-colors hover:bg-white ${FOCUS_CLASS_NAME}`}
              href={`${home}/deep-type`}
            >
              <h2 className="font-black text-2xl tracking-[-0.03em]">{t('deepTypeCard.title')}</h2>
              <p className="mt-3 text-page-ink-soft leading-7">{t('deepTypeCard.description')}</p>
              <span className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-page-ink px-5 font-bold text-sm text-white transition-colors group-hover:bg-page-ink/92">
                {t('deepTypeCard.cta')}
              </span>
            </Link>
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
