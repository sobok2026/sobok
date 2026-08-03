import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'

import GuardianReopen from './GuardianReopen'

export async function generateMetadata({ params }: PageProps<'/[locale]/guardian-report/reopen'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_REPORT_UI[locale].paid.reopen

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    robots: { index: false, follow: false },
  }
}

export default async function GuardianReopenPage({ params }: PageProps<'/[locale]/guardian-report/reopen'>) {
  const locale = await getLocale(params)

  return <GuardianReopen locale={locale} />
}
