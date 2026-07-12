import { Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'

import { getLocale } from '@/i18n/server'
import LegalArticle from '../../LegalArticle'
import { LEGAL } from '../../legal'

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].terms

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: `/${locale}/terms/`,
      languages: Object.fromEntries(Object.values(Locale).map((entry) => [entry, `/${entry}/terms/`])),
    },
  }
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalArticle doc={meta.terms} meta={meta} />
}
