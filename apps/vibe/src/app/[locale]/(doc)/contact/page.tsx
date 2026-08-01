import ContactChannels from '@sobok/site-chrome/contact-channels'
import DocArticle from '@sobok/site-chrome/doc-article'
import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'

import { PAGES } from '@/content/pages'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return buildMetadata({
    description: doc.description,
    locale,
    path: '/contact',
    title: doc.title,
  })
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return (
    <DocArticle
      className="bg-background"
      description={doc.description}
      footer={<ContactChannels channels={doc.channels} heading={doc.channelsHeading} />}
      metaLines={[`${doc.updatedLabel}: ${doc.updatedDate}`]}
      sections={doc.sections}
      title={doc.title}
    />
  )
}
