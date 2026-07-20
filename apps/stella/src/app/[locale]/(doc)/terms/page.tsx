import type { Metadata } from 'next'

import { LEGAL } from '@/content/legal'
import { getLocale } from '@/i18n/server'
import { buildMetadata } from '@/lib/metadata'
import LegalArticle from '../LegalArticle'

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const doc = LEGAL[locale].terms

  return buildMetadata({ locale, path: '/terms', title: doc.title, description: doc.description })
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  const locale = await getLocale(params)
  const meta = LEGAL[locale]

  return <LegalArticle doc={meta.terms} meta={meta} />
}
