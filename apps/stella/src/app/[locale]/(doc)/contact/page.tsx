import ContactChannels from '@sobok/site-chrome/contact-channels'
import DocArticle from '@sobok/site-chrome/doc-article'
import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import { PAGES } from '@/content/pages'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = PAGES[locale].contact

  return buildMetadata({ locale, path: '/contact', title: doc.title, description: doc.description })
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = await getLocale(params)
  const page = PAGES[locale].contact

  return (
    <DocArticle
      className="bg-night-sky"
      description={page.description}
      footer={<ContactChannels channels={page.channels} heading={page.channelsHeading} />}
      metaLines={[`${page.updatedLabel}: ${page.updatedDate}`]}
      sections={page.sections}
      title={page.title}
    />
  )
}
