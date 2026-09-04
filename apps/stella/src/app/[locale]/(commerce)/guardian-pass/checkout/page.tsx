import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import GuardianPassCheckout from './GuardianPassCheckout'

export const metadata: Metadata = {
  title: '수호령 내일 선공개 7일권',
  description: '내일의 수호령 카드를 7일 동안 하루 먼저 만나보세요.',
  robots: { index: false, follow: false },
}

export default async function GuardianPassCheckoutPage({ params }: PageProps<'/[locale]/guardian-pass/checkout'>) {
  const locale = await getLocale(params)
  return <GuardianPassCheckout locale={locale} />
}
