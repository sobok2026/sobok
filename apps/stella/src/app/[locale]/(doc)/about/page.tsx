import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { PAGES } from '@/content/pages'
import { buildMetadata } from '@/lib/metadata'
import DocArticle from '../DocArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].about

  return buildMetadata({ locale, path: '/about', title: doc.title, description: doc.description })
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const locale = await getLocale(params)
  const page = PAGES[locale].about

  return (
    <DocArticle
      description={page.description}
      sections={page.sections}
      title={page.title}
      updatedDate={page.updatedDate}
      updatedLabel={page.updatedLabel}
    />
  )
}
