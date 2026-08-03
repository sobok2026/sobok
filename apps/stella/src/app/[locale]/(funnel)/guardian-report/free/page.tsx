import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'

import GuardianFreeAssessment from './GuardianFreeAssessment'

export async function generateMetadata({ params }: PageProps<'/[locale]/guardian-report/free'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale]

  return {
    title: content.landing.quiz.title,
    description: content.landing.quiz.body,
    robots: { index: false, follow: true },
  }
}

export default async function GuardianFreeAssessmentPage({ params }: PageProps<'/[locale]/guardian-report/free'>) {
  const locale = await getLocale(params)

  return <GuardianFreeAssessment locale={locale} />
}
