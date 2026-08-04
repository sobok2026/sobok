import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'

import GuardianFreeResult from './GuardianFreeResult'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/guardian-report/free/result'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale]

  return {
    title: content.landing.freeResult.hero.title,
    description: content.landing.freeResult.hero.body,
    robots: { index: false, follow: true },
  }
}

export default async function GuardianFreeResultPage({ params }: PageProps<'/[locale]/guardian-report/free/result'>) {
  const locale = await getLocale(params)

  return <GuardianFreeResult locale={locale} />
}
