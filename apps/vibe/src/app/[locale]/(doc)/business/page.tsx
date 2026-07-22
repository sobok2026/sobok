import type { Metadata } from 'next'
import Link from 'next/link'

import BusinessInfo from '@/components/BusinessInfo'
import { BUSINESS_LABELS } from '@/content/business'
import { LEGAL } from '@/content/legal'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import { getLocale } from '@/i18n/server'

export async function generateMetadata({ params }: PageProps<'/[locale]/business'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const labels = BUSINESS_LABELS[locale]

  return buildLocalizedMetadata({
    description: labels.description,
    locale,
    pathname: '/business',
    title: labels.heading,
  })
}

export default async function BusinessPage({ params }: PageProps<'/[locale]/business'>) {
  const locale = await getLocale(params)
  const labels = BUSINESS_LABELS[locale]
  const nav = LEGAL[locale].nav

  return (
    <main className="min-h-dvh bg-page-bg px-4 pt-[calc(4.5rem+var(--safe-area-top))] pb-24 text-page-ink sm:px-6 sm:pt-[calc(5rem+var(--safe-area-top))]">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-bold text-3xl tracking-tight">{labels.heading}</h1>
        <p className="mt-3 text-page-ink/62">{labels.description}</p>

        <BusinessInfo className="mt-8 text-sm leading-6" locale={locale} showHeading={false} />

        <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-page-accent text-sm">
          <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${locale}/terms`}>
            {nav.terms}
          </Link>
          <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${locale}/privacy`}>
            {nav.privacy}
          </Link>
          <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${locale}/refund`}>
            {nav.refund}
          </Link>
        </nav>
      </article>
    </main>
  )
}
