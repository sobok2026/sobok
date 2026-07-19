import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildLocalizedMetadata } from '@/i18n/metadata'

import { DeepTypeFlow } from './_components/deep-type-flow'
import { getDeepTypeContent } from './_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/deep-type'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getDeepTypeContent(locale)

  return await buildLocalizedMetadata({
    description: content.metadata.description,
    locale,
    pathname: '/deep-type',
    title: content.metadata.title,
  })
}

export default async function DeepTypePage({ params }: PageProps<'/[locale]/deep-type'>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getDeepTypeContent(locale)

  return (
    <Suspense fallback={<DeepTypePageFallback />}>
      <DeepTypeFlow content={content} locale={locale} />
    </Suspense>
  )
}

function DeepTypePageFallback() {
  return (
    <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-16 text-page-ink">
      <div className="h-12 w-12 rounded-full border-4 border-page-accent/20 border-t-page-accent" />
    </main>
  )
}
