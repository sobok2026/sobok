import { BUSINESS_LABELS } from '@sobok/brand/business'
import BusinessInfo from '@sobok/site-chrome/business-info'
import DocArticle from '@sobok/site-chrome/doc-article'
import { getLocale } from '@sobok/site-i18n/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LEGAL } from '@/content/legal'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[locale]/business'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const labels = BUSINESS_LABELS[locale]

  return buildMetadata({ locale, path: '/business', title: labels.heading, description: labels.description })
}

// The registration details are a table rather than prose, so this page has no `sections` — it is the shell
// plus one block. It still goes through DocArticle so the page frame stays defined in exactly one place.
export default async function BusinessPage({ params }: PageProps<'/[locale]/business'>) {
  const locale = await getLocale(params)
  const labels = BUSINESS_LABELS[locale]
  const { nav } = LEGAL[locale]

  return (
    <DocArticle
      className="bg-night-sky"
      description={labels.description}
      footer={
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-accent">
          {(['terms', 'refund', 'privacy'] as const).map((doc) => (
            <Link className="underline underline-offset-2 hover:text-foreground" href={`/${locale}/${doc}`} key={doc}>
              {nav[doc]}
            </Link>
          ))}
        </nav>
      }
      intro={<BusinessInfo className="mt-8 text-sm leading-6" locale={locale} showHeading={false} />}
      sections={[]}
      title={labels.heading}
    />
  )
}
