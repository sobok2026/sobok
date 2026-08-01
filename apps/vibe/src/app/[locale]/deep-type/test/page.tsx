import { isLocale } from '@sobok/domain/locale'
import JsonLd from '@sobok/site-seo/json-ld'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildMetadata, webApplicationGraph } from '@/lib/seo'

import { TestFlow } from '../_components/test-flow'
import { getDeepTypeContent } from '../_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/deep-type/test'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getDeepTypeContent(locale)

  return {
    // A step in a process, so it stays out of search: the landing is what ads point at and what should rank, and
    // a question screen with the same title one path deeper is a thin duplicate of it.
    ...buildMetadata({
      description: content.metadata.description,
      locale,
      path: '/deep-type/test',
      title: `${content.metadata.title} - Test`,
    }),
    robots: { follow: false, index: false },
  }
}

export default async function DeepTypeTestPage({ params }: PageProps<'/[locale]/deep-type/test'>) {
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
          path: 'deep-type/test',
        })}
      />
      <Suspense fallback={<DeepTypePageFallback />}>
        <TestFlow content={content} locale={locale} />
      </Suspense>
    </>
  )
}

function DeepTypePageFallback() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-safe py-16 text-foreground">
      <div className="h-12 w-12 rounded-full border-4 border-brand/20 border-t-brand" />
    </main>
  )
}
