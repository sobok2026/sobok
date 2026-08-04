import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { GUARDIAN_LOVE_REDRAW_UI } from '@/content/guardian-love-redraw-ui'

import GuardianLoveRedraw from './GuardianLoveRedraw'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/guardian-report/love-redraw'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const content = GUARDIAN_LOVE_REDRAW_UI[locale]
  return {
    title: content.meta.title,
    description: content.meta.description,
    robots: { index: false, follow: true },
  }
}

export default async function GuardianLoveRedrawPage({ params }: PageProps<'/[locale]/guardian-report/love-redraw'>) {
  const locale = await getLocale(params)
  return <GuardianLoveRedraw locale={locale} />
}
