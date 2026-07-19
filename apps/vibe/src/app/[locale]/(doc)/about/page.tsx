import type { Metadata } from 'next'

import { PAGES } from '@/content/pages'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import { getLocale } from '@/i18n/server'
import InfoArticle from '../InfoArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].about

  return buildLocalizedMetadata({
    description: doc.description,
    locale,
    pathname: '/about',
    title: doc.title,
  })
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const locale = await getLocale(params)

  return <InfoArticle page={PAGES[locale].about} />
}
