import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AgeGate from '@/components/AgeGate'
import { DEEP_TYPE_REOPEN } from '@/content/deep-type-reopen'
import { buildLocalizedMetadata } from '@/i18n/metadata'

import { getDeepTypeContent } from '../_lib/content'
import { ReopenView } from './_components/reopen-view'

export async function generateMetadata({ params }: PageProps<'/[locale]/deep-type/reopen'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) {
    return {}
  }

  const copy = DEEP_TYPE_REOPEN[locale]
  return {
    ...buildLocalizedMetadata({
      description: copy.metadata.description,
      locale,
      pathname: '/deep-type/reopen',
      title: copy.metadata.title,
    }),
    robots: { follow: false, index: false },
  }
}

export default async function DeepTypeReopenPage({ params }: PageProps<'/[locale]/deep-type/reopen'>) {
  const { locale } = await params
  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getDeepTypeContent(locale)

  return (
    <AgeGate locale={locale}>
      <ReopenView content={content} copy={DEEP_TYPE_REOPEN[locale]} locale={locale} />
    </AgeGate>
  )
}
