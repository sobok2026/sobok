'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { fetchCounts } from '@/lib/comments'

// The compact board entry point shown under a detail panel. It replaces the old inline board: keeps the
// panel light (others' stories no longer get pushed down) and links to the dedicated /talk/[topic] board
// where reading + writing happen together. The label is a constant invitation across every state; the live
// count rides alongside as a numeric badge (social proof) rather than rewriting the label.
export default function CommentEntry({ locale, topicKey }: { locale: string; topicKey: string }) {
  const t = useTranslations('Comments')

  const { data: count = 0 } = useQuery({
    queryKey: ['comment-count', locale, topicKey],
    queryFn: () => fetchCounts(locale, [topicKey]).then((counts) => counts[topicKey] ?? 0),
  })

  return (
    <Link
      className="mt-3 flex items-center justify-between rounded-2xl border bg-surface px-4 py-3 text-sm transition hover:border-white/30"
      href={`/${locale}/talk/${topicKey}`}
    >
      <span className="font-semibold text-foreground">{t('entry')}</span>
      <span className="flex items-center gap-2.5">
        {count > 0 && (
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground-muted">
            <span className="sr-only">{t('count', { n: count })}</span>
            <span aria-hidden>{new Intl.NumberFormat(locale).format(count)}</span>
          </span>
        )}
        <span aria-hidden className="text-foreground-subtle">
          →
        </span>
      </span>
    </Link>
  )
}
