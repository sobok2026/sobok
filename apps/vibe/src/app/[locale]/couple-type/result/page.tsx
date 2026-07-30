import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildLocalizedMetadata } from '@/i18n/metadata'

import { ResultFlow } from '../_components/result-flow'
import { getCoupleTypeContent } from '../_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/couple-type/result'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getCoupleTypeContent(locale)

  return {
    // The result of a process. Which of the sixteen types it shows depends on a query parameter the crawler has
    // no reason to hold, so there is nothing here to index that the landing does not say better.
    ...buildLocalizedMetadata({
      description: content.metadata.description,
      locale,
      pathname: '/couple-type/result',
      title: `${content.metadata.title} - Result`,
    }),
    robots: { follow: false, index: false },
  }
}

export default async function CoupleTypeResultPage({ params }: PageProps<'/[locale]/couple-type/result'>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getCoupleTypeContent(locale)

  return (
    <main className="flex flex-1 flex-col bg-page-bg text-page-ink" id="main-content">
      <Suspense fallback={<CoupleTypeResultFallback />}>
        <ResultFlow content={content} locale={locale} />
      </Suspense>
    </main>
  )
}

function CoupleTypeResultFallback() {
  return (
    <div className="flex flex-1 items-center justify-center px-safe py-16">
      <div className="h-12 w-12 rounded-full border-4 border-page-accent/20 border-t-page-accent" />
    </div>
  )
}
