'use client'

import { ArrowLeft } from '@mynaui/icons-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'

import type { ChoiceItemContent, ItemAnswer, ItemContent, ScaleItemContent } from '../_lib/types'

// QuizView renders from `content` (labels/hi/lo) and only needs the item's id + kind — it never reads the
// scoring signs. So a lightweight item works for both the free banks (full Item) and the precision specs.
type QuizItem = { id: string; kind: 'choice' | 'scale' }

type QuizViewProps = {
  content: Record<string, ItemContent>
  item: QuizItem
  onAnswer: (answer: ItemAnswer) => void
  onBack?: () => void
  progressLabel: string
  progressPercent: number
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function QuizView({ content, item, onAnswer, onBack, progressLabel, progressPercent }: QuizViewProps) {
  const itemContent = content[item.id]

  if (!itemContent) {
    return null
  }

  return (
    <section className="flex flex-1 flex-col justify-center px-safe py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6">
          <p className="text-page-ink/48 text-xs">{progressLabel}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-page-soft">
            <div
              className="h-full rounded-full bg-page-accent transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-4xl border border-page-border bg-page-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
          {itemContent.scene ? <p className="font-bold text-page-accent text-sm">{itemContent.scene}</p> : null}
          <h1 className="mt-2 break-keep font-black text-2xl leading-snug">{itemContent.text}</h1>

          {item.kind === 'scale' ? (
            <ScaleAnswer
              content={itemContent as ScaleItemContent}
              onSubmit={(value) => onAnswer({ itemId: item.id, kind: 'scale', value })}
            />
          ) : (
            <ChoiceAnswer
              content={itemContent as ChoiceItemContent}
              onSelect={(optionIndex) => onAnswer({ itemId: item.id, kind: 'choice', optionIndex })}
            />
          )}
        </div>

        {onBack ? (
          <button
            className={cn(
              'mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold text-page-ink/58 text-sm transition-colors hover:text-page-ink',
              focusClassName,
            )}
            onClick={onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            이전
          </button>
        ) : null}
      </div>
    </section>
  )
}

function ChoiceAnswer({ content, onSelect }: { content: ChoiceItemContent; onSelect: (optionIndex: number) => void }) {
  return (
    <div className="mt-6 grid gap-3">
      {content.options.map((label, index) => (
        <button
          className={cn(
            'rounded-3xl border border-page-border bg-white p-4 text-left font-bold leading-6 transition hover:border-page-accent/50 hover:bg-page-soft/50',
            focusClassName,
          )}
          key={label}
          onClick={() => onSelect(index)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ScaleAnswer({ content, onSubmit }: { content: ScaleItemContent; onSubmit: (value: number) => void }) {
  const [value, setValue] = useState(50)

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between text-page-ink/58 text-sm">
        <span>{content.lo}</span>
        <span>{content.hi}</span>
      </div>
      <input
        className="mt-3 h-9 w-full accent-page-accent"
        max={100}
        min={0}
        onChange={(event) => setValue(Number(event.target.value))}
        type="range"
        value={value}
      />
      <p className="mt-1 text-center font-black text-2xl text-page-accent">{value}</p>
      <button
        className={cn(
          'mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-page-ink font-black text-sm text-white transition-colors hover:bg-page-ink/92',
          focusClassName,
        )}
        onClick={() => onSubmit(value)}
        type="button"
      >
        다음
      </button>
    </div>
  )
}
