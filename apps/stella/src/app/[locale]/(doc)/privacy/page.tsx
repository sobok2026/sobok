import { Locale } from '@sobok/domain/locale'
import type { Metadata } from 'next'

import { getLocale } from '@/i18n/server'
import LegalArticle from '../../LegalArticle'
import { LEGAL } from '../../legal'

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].privacy

  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: `/${locale}/privacy/`,
      languages: Object.fromEntries(Object.values(Locale).map((entry) => [entry, `/${entry}/privacy/`])),
    },
  }
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalArticle doc={meta.privacy} meta={meta} />
}
