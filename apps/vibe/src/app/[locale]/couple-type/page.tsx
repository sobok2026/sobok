import { isLocale } from '@sobok/domain/locale'
import JsonLd from '@sobok/site-seo/json-ld'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildMetadata, webApplicationGraph } from '@/lib/seo'

import { IntroView } from './_components/intro-view'
import { getCoupleTypeContent } from './_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/couple-type'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getCoupleTypeContent(locale)

  return buildMetadata({
    description: content.metadata.description,
    locale,
    path: '/couple-type',
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
    <>
      <JsonLd
        data={webApplicationGraph(locale, {
          description: content.metadata.description,
          name: content.metadata.title,
          path: 'couple-type',
        })}
      />
      <main className="flex flex-1 flex-col bg-background text-foreground" id="main-content">
        <IntroView content={content} locale={locale} />
      </main>
    </>
  )
}
