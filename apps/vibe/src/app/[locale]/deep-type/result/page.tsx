import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { buildLocalizedMetadata } from '@/i18n/metadata'
import JsonLd, { webApplicationGraph } from '@/lib/JsonLd'

import { ResultFlow } from '../_components/result-flow'
import { getDeepTypeContent } from '../_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/deep-type/result'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getDeepTypeContent(locale)

  return buildLocalizedMetadata({
    description: content.metadata.description,
    locale,
    pathname: '/deep-type/result',
    title: `${content.metadata.title} - Result`,
  })
}

export default async function DeepTypeResultPage({ params }: PageProps<'/[locale]/deep-type/result'>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getDeepTypeContent(locale)

  return (
    <>
      <JsonLd
        data={webApplicationGraph(locale, {
          description: content.metadata.description,
          name: content.metadata.title,
          path: 'deep-type/result',
        })}
      />
      <Suspense fallback={<DeepTypePageFallback />}>
        <ResultFlow content={content} locale={locale} />
      </Suspense>
    </>
  )
}

function DeepTypePageFallback() {
  return (
    <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-16 text-page-ink">
      <div className="h-12 w-12 rounded-full border-4 border-page-accent/20 border-t-page-accent" />
    </main>
  )
}
