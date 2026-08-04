import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'

import GuardianPaidResult from '../_components/GuardianPaidResult'

export async function generateMetadata({ params }: PageProps<'/[locale]/guardian-report/result'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale].paid

  return {
    title: content.meta.title,
    description: content.meta.description,
    robots: { index: false, follow: true },
  }
}

export default async function GuardianPaidResultPage({ params }: PageProps<'/[locale]/guardian-report/result'>) {
  const locale = await getLocale(params)

  return <GuardianPaidResult locale={locale} />
}
