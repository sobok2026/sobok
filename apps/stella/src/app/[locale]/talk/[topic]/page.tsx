import { LOCALES } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import CommentThread from '@/components/CommentThread'
import { getLocale } from '@/i18n/server'
import { loadBakedBoards } from '@/lib/board-bake'
import { allTopicKeys, type Labeler, topicLabel } from '@/lib/comment-topics'

// Static export: every valid topic is prerendered; an unknown /talk/<x> 404s instead of being attempted at
// runtime (there is no server).
export const dynamicParams = false

export function generateStaticParams() {
  const topics = allTopicKeys()
  return LOCALES.flatMap((locale) => topics.map((topic) => ({ locale, topic })))
}

export async function generateMetadata({ params }: PageProps<'/[locale]/talk/[topic]'>): Promise<Metadata> {
  const locale = await getLocale(params)
  const { topic } = await params

  const [boards, t, tc] = await Promise.all([
    loadBakedBoards(),
    getTranslations({ locale, namespace: 'Constellation' }),
    getTranslations({ locale, namespace: 'Comments' }),
  ])

  const label = topicLabel(topic, t as unknown as Labeler)
  const hasContent = (boards.get(`${locale}:${topic}`)?.count ?? 0) > 0

  return {
    title: label,
    description: tc('metaDescription', { label }),
    alternates: { canonical: `/${locale}/talk/${topic}` },
    // Empty boards are NOT indexed — no thin-content pages. Once a board has comments (from the last build's
    // bake) it becomes indexable, with its baked comments already in the HTML.
    robots: hasContent ? undefined : { index: false, follow: true },
  }
}

export default async function TalkPage({ params }: PageProps<'/[locale]/talk/[topic]'>) {
  const locale = await getLocale(params)
  const { topic } = await params

  const [boards, t, tc] = await Promise.all([
    loadBakedBoards(),
    getTranslations({ locale, namespace: 'Constellation' }),
    getTranslations({ locale, namespace: 'Comments' }),
  ])

  const label = topicLabel(topic, t as unknown as Labeler)
  const initial = boards.get(`${locale}:${topic}`)?.page
  const isCardTopic = topic.startsWith('card-')

  return (
    <main className="relative min-h-dvh bg-night-sky px-4 pb-24 pt-[calc(4.5rem+var(--safe-area-top))] text-foreground">
      <div className="mx-auto w-full max-w-xl">
        <Link
          className="inline-flex items-center gap-1 text-xs text-foreground-subtle underline-offset-2 hover:text-foreground-secondary hover:underline"
          href={isCardTopic ? `/${locale}/cards` : `/${locale}`}
        >
          ← {tc(isCardTopic ? 'backToCardReport' : 'backToChart')}
        </Link>
        <h1 className="mt-3 text-xl font-bold text-foreground">{label}</h1>
        <p className="mt-1 text-sm text-foreground-subtle">{tc(isCardTopic ? 'cardSubtitle' : 'subtitle')}</p>

        <div className="mt-6">
          <CommentThread
            bodyPlaceholder={tc(isCardTopic ? 'cardBodyPlaceholder' : 'bodyPlaceholder')}
            initial={initial}
            locale={locale}
            topicKey={topic}
          />
        </div>
      </div>
    </main>
  )
}
