'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { fetchCounts } from '@/lib/comments'

// The compact board entry point shown under a detail panel. It replaces the old inline board: keeps the
// panel light (others' stories no longer get pushed down), shows the live count, and links to the dedicated
// /talk/[topic] board where reading + writing happen together.
export default function CommentEntry({ locale, topicKey }: { locale: string; topicKey: string }) {
  const t = useTranslations('Comments')

  const { data: count } = useQuery({
    queryKey: ['comment-count', locale, topicKey],
    queryFn: () => fetchCounts(locale, [topicKey]).then((counts) => counts[topicKey] ?? 0),
  })

  return (
    <Link
      className="mt-3 flex items-center justify-between rounded-2xl border bg-surface px-4 py-3 text-sm transition hover:border-white/30"
      href={`/${locale}/talk/${topicKey}`}
    >
      <span className="font-semibold text-foreground">
        💬 {count && count > 0 ? t('count', { n: count }) : t('entryEmpty')}
      </span>
      <span aria-hidden className="text-foreground-subtle">
        →
      </span>
    </Link>
  )
}
