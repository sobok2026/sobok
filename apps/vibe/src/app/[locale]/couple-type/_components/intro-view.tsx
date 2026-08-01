import { ArrowRight, HeartWaves } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'

import type { CoupleTypeContent } from '../_lib/types'
import { MiniStat } from './mini-stat'

/**
 * The landing this test did not have.
 *
 * `/couple-type` used to be question one on first paint, which made the tab in the primary navigation a screen
 * that hides the navigation as soon as it is tapped, and made the page search indexes rank a bare form. The copy
 * here is the hero the quiz has always carried in its `lg` side panel — the same three strings, now on the screen
 * where a visitor decides whether to start.
 */
export function IntroView({ content, locale }: { content: CoupleTypeContent; locale: Locale }) {
  const { questions, ui } = content

  return (
    <section className="flex flex-1 flex-col justify-center px-safe py-10 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 font-bold text-sm text-white">
          <HeartWaves aria-hidden="true" className="h-4 w-4 text-accent" stroke={1.8} />
          {ui.heroEyebrow}
        </p>
        <h1 className="mt-6 text-balance font-black text-4xl leading-tight tracking-tight sm:text-5xl">
          {ui.heroTitle}
        </h1>
        <p className="mt-5 text-lg text-foreground-secondary leading-8">{ui.heroDescription}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <MiniStat
            label={ui.questionCountLabel}
            value={formatText(ui.questionCountValue, { count: questions.length })}
          />
          <MiniStat label={ui.resultCountLabel} value={ui.resultCountValue} />
        </div>

        <Link
          className={cn(
            'mt-9 inline-flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-accent px-6 font-black text-base text-white shadow-[0_24px_80px_var(--accent-glow)] transition-colors hover:bg-accent/92',
            FOCUS_CLASS_NAME,
          )}
          href={`/${locale}/couple-type/quiz`}
        >
          {ui.introCta}
          <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
        </Link>
        <p className="mt-5 text-foreground-muted text-sm leading-7">{ui.introNote}</p>
      </div>
    </section>
  )
}

function formatText(template: string, values: Record<string, number | string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}
