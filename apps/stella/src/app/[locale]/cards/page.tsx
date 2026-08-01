import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'

import GuardianCardsEntry from './GuardianCardsEntry'

export async function generateMetadata({ params }: PageProps<'/[locale]/cards'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale].paid

  return {
    title: content.meta.title,
    description: content.meta.description,
    robots: { index: false, follow: true },
  }
}

export default async function GuardianCardsPage({ params }: PageProps<'/[locale]/cards'>) {
  const locale = await getLocale(params)

  return <GuardianCardsEntry locale={locale} />
}
