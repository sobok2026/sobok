import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import StellaAccount from './StellaAccount'

export const metadata: Metadata = {
  title: '내 카드 보관함',
  robots: { index: false, follow: false },
}

export default async function StellaAccountPage({ params }: PageProps<'/[locale]/account'>) {
  const locale = await getLocale(params)
  return <StellaAccount locale={locale} />
}
