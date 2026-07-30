import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildLocalizedMetadata } from '@/i18n/metadata'

import { QuizFlow } from '../_components/quiz-flow'
import { getGyeolContent } from '../_lib/content'

export async function generateMetadata({ params }: PageProps<'/[locale]/couple-gyeol/quiz'>): Promise<Metadata> {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const content = await getGyeolContent(locale)

  return {
    // A step in a process, so it stays out of search: the copy that should rank is the landing's, and a question
    // screen with the same title one path deeper is a thin duplicate of it. The sitemap lists the landing only.
    ...buildLocalizedMetadata({
      description: content.metadata.description,
      locale,
      pathname: '/couple-gyeol/quiz',
      title: `${content.metadata.title} - Quiz`,
    }),
    robots: { follow: false, index: false },
  }
}

export default async function CoupleGyeolQuizPage({ params }: PageProps<'/[locale]/couple-gyeol/quiz'>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getGyeolContent(locale)

  return (
    <main className="flex flex-1 flex-col bg-page-bg text-page-ink" id="main-content">
      <QuizFlow content={content} locale={locale} />
    </main>
  )
}
