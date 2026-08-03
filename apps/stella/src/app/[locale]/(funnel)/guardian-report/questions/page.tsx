import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import GuardianPaidQuestions from '../_components/GuardianPaidQuestions'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/guardian-report/questions'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale].paid

  return {
    title: content.meta.title,
    description: content.meta.description,
    robots: { index: false, follow: true },
  }
}

export default async function GuardianPaidQuestionsPage({ params }: PageProps<'/[locale]/guardian-report/questions'>) {
  const locale = await getLocale(params)

  return <GuardianPaidQuestions locale={locale} />
}
