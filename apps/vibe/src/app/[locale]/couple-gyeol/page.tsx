import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { buildLocalizedMetadata } from '@/i18n/metadata'
import JsonLd, { webApplicationGraph } from '@/lib/JsonLd'

import { CoupleGyeolFlow } from './_components/couple-rarity-screen'
import { getGyeolContent } from './_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/couple-gyeol'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getGyeolContent(locale)

  return buildLocalizedMetadata({
    description: content.metadata.description,
    locale,
    pathname: '/couple-gyeol',
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
        <CoupleGyeolFlow content={content} locale={locale} />
      </Suspense>
    </>
  )
}

function GyeolPageFallback() {
  return (
    <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-16 text-page-ink">
      <div className="h-12 w-12 rounded-full border-4 border-page-accent/20 border-t-page-accent" />
    </main>
  )
}
