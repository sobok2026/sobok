import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import JsonLd, { webApplicationGraph } from '@/lib/JsonLd'

import { CoupleTypeFlow } from './_components/couple-type-screen'
import { getCoupleTypeContent } from './_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/couple-type'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getCoupleTypeContent(locale)

  return buildLocalizedMetadata({
    description: content.metadata.description,
    locale,
    pathname: '/couple-type',
    title: content.metadata.title,
  })
}

export default async function CoupleTypePage({ params }: PageProps<'/[locale]/couple-type'>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getCoupleTypeContent(locale)

  return (
    <main className="flex flex-1 flex-col bg-page-bg text-page-ink">
      <JsonLd
        data={webApplicationGraph(locale, {
          description: content.metadata.description,
          name: content.metadata.title,
          path: 'couple-type',
        })}
      />
      <CoupleTypeFlow content={content} locale={locale} />
    </main>
  )
}
