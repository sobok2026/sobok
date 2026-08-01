import { isLocale } from '@sobok/domain/locale'
import JsonLd from '@sobok/site-seo/json-ld'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildMetadata, webApplicationGraph } from '@/lib/seo'

import { IntroFlow } from './_components/intro-flow'
import { getGyeolContent } from './_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/couple-gyeol'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getGyeolContent(locale)

  return buildMetadata({
    description: content.metadata.description,
    locale,
    path: '/couple-gyeol',
    title: content.metadata.title,
  })
}

export default async function CoupleGyeolPage({ params }: PageProps<'/[locale]/couple-gyeol'>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getGyeolContent(locale)

  return (
    <>
      <JsonLd
        data={webApplicationGraph(locale, {
          description: content.metadata.description,
          name: content.metadata.title,
          path: 'couple-gyeol',
        })}
      />
      <Suspense fallback={<GyeolPageFallback />}>
        <IntroFlow content={content} locale={locale} />
      </Suspense>
    </>
  )
}

function GyeolPageFallback() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-safe py-16 text-foreground">
      <div className="h-12 w-12 rounded-full border-4 border-brand/20 border-t-brand" />
    </main>
  )
}
