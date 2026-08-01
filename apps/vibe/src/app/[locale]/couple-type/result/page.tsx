import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'

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
    ...buildMetadata({
      description: content.metadata.description,
      locale,
      path: '/couple-type/result',
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
    <main className="flex flex-1 flex-col bg-background text-foreground" id="main-content">
      <Suspense fallback={<CoupleTypeResultFallback />}>
        <ResultFlow content={content} locale={locale} />
      </Suspense>
    </main>
  )
}

function CoupleTypeResultFallback() {
  return (
    <div className="flex flex-1 items-center justify-center px-safe py-16">
      <div className="h-12 w-12 rounded-full border-4 border-brand/20 border-t-brand" />
    </div>
  )
}
