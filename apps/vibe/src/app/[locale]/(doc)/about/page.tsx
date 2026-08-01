import DocArticle from '@sobok/site-chrome/doc-article'
import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { PAGES } from '@/content/pages'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].about

  return buildMetadata({
    description: doc.description,
    locale,
    path: '/about',
    title: doc.title,
  })
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const locale = await getLocale(params)
  const doc = PAGES[locale].about

  return (
    <DocArticle
      className="bg-background"
      description={doc.description}
      metaLines={[`${doc.updatedLabel}: ${doc.updatedDate}`]}
      sections={doc.sections}
      title={doc.title}
    />
  )
}
