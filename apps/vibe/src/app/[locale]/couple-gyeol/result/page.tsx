import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildLocalizedMetadata } from '@/i18n/metadata'

import { ResultFlow } from '../_components/result-flow'
import { getGyeolContent } from '../_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/couple-gyeol/result'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getGyeolContent(locale)

  return {
    // The result of a process. What it says depends on a query parameter the crawler has no reason to hold, so
    // there is nothing here to index that the landing does not say better.
    ...buildLocalizedMetadata({
      description: content.metadata.description,
      locale,
      pathname: '/couple-gyeol/result',
      title: `${content.metadata.title} - Result`,
    }),
    robots: { follow: false, index: false },
  }
}

export default async function CoupleGyeolResultPage({ params }: PageProps<'/[locale]/couple-gyeol/result'>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getGyeolContent(locale)

  return (
    <main className="flex flex-1 flex-col bg-page-bg text-page-ink" id="main-content">
      <Suspense fallback={<GyeolResultFallback />}>
        <ResultFlow content={content} locale={locale} />
      </Suspense>
    </main>
  )
}

function GyeolResultFallback() {
  return (
    <div className="flex flex-1 items-center justify-center px-safe py-16">
      <div className="h-12 w-12 rounded-full border-4 border-page-accent/20 border-t-page-accent" />
    </div>
  )
}
