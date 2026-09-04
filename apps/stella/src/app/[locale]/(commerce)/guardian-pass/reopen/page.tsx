import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import GuardianPassReopen from './GuardianPassReopen'

export const metadata: Metadata = {
  title: '수호령 7일권 다시 열기',
  robots: { index: false, follow: false },
}

export default async function GuardianPassReopenPage({ params }: PageProps<'/[locale]/guardian-pass/reopen'>) {
  const locale = await getLocale(params)
  return <GuardianPassReopen locale={locale} />
}
