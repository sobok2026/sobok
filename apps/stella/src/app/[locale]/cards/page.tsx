import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import CardReportPrototype from './CardReportPrototype'
import { CARD_REPORT_CONTENT } from './content'

export async function generateMetadata({ params }: PageProps<'/[locale]/cards'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = CARD_REPORT_CONTENT[locale]

  return {
    title: content.meta.title,
    description: content.meta.description,
    robots: { index: false, follow: true },
  }
}

export default async function GuardianCardsPage({ params }: PageProps<'/[locale]/cards'>) {
  const locale = await getLocale(params)

  return <CardReportPrototype content={CARD_REPORT_CONTENT[locale]} locale={locale} />
}
