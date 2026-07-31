import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildMetadata } from '@/lib/metadata'
import TomorrowFlow from './TomorrowFlow'

export async function generateMetadata({ params }: PageProps<'/[locale]/tomorrow'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const t = await getTranslations({ locale, namespace: 'Tomorrow.meta' })

  // Ephemeral, derived from /today — kept crawlable but out of the index.
  return buildMetadata({
    locale,
    path: '/tomorrow',
    title: t('title'),
    description: t('description'),
    image: '/og-today.webp',
    noindex: true,
  })
}

export default function TomorrowPage() {
  return <TomorrowFlow />
}
