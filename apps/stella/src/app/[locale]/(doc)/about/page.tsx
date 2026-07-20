import type { Metadata } from 'next'

import { PAGES } from '@/content/pages'
import { getLocale } from '@/i18n/server'
import { buildMetadata } from '@/lib/metadata'
import InfoArticle from '../InfoArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].about

  return buildMetadata({ locale, path: '/about', title: doc.title, description: doc.description })
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const locale = await getLocale(params)

  return <InfoArticle page={PAGES[locale].about} />
}
