'use client'

import { Copy, HeartWaves, Refresh, Share, Sparkles } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import { useShare } from '@/components/use-share'
import { cn } from '@/utils/cn'
import coupleGyeolRidgeImage from '../../../../../public/image/rarity/ridge.png'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'
import { axisOrder, serializeGyeolResult } from '../_lib/model'
import type { GyeolContent, GyeolResult } from '../_lib/types'

type ResultViewProps = {
  content: GyeolContent
  isSharedResult: boolean
  locale: Locale
  onRestart: () => void
  result: GyeolResult
}

type GyeolScoreCardProps = {
  gradeLabel: string
  indexLabel: string
  mountainLabel: string
  weaveIndex: number
}

export function ResultView({ content, isSharedResult, locale, onRestart, result }: ResultViewProps) {
  const { feedback: shareFeedback, share } = useShare({ copiedMessage: content.ui.copiedFeedback })
  const resultContent = content.results[result.code]
  const gradeContent = content.grades[result.grade]
  const keepHeadingBreakClassName = locale === 'en' ? undefined : 'break-keep'

  const shareBody = formatText(content.ui.shareFallbackBody, {
    grade: gradeContent.label,
    index: result.weaveIndex,
    nickname: resultContent.nickname,
  })

  function shareResult() {
    const url = getShareUrl(result)
    return share({ copy: url, text: shareBody, title: content.ui.shareTitle, url })
  }

  return (
    <section className="bg-page-bg px-safe py-10 text-page-ink sm:py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-4 sm:gap-6 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="rounded-[2.4rem] bg-page-ink p-6 text-white shadow-[0_36px_120px_rgba(36,22,23,0.2)] sm:p-8 lg:sticky lg:top-32 lg:-mt-px lg:self-start">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-bold text-sm text-white/78">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-page-accent-strong" stroke={1.8} />
            {content.ui.resultEyebrow}
          </p>
          <GyeolScoreCard
            gradeLabel={gradeContent.label}
            indexLabel={content.ui.indexLabel}
            mountainLabel={gradeContent.mountainLabel}
            weaveIndex={result.weaveIndex}
          />
          <h1 className={cn('mt-7 font-black text-4xl leading-tight sm:text-6xl', keepHeadingBreakClassName)}>
            {resultContent.nickname}
          </h1>
          <p className="mt-5 text-white/70 leading-8">{resultContent.summary}</p>
          {isSharedResult ? (
            <p className="mt-4 font-bold text-page-accent-strong text-sm">{content.ui.shareLead}</p>
          ) : null}
        </div>

        <div className="grid gap-5">
          <section className="rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
            <h2 className="font-black text-2xl">{content.ui.gradeTitle}</h2>
            <p className="mt-4 text-page-ink-soft leading-8">{gradeContent.description}</p>
          </section>

          <AxisScoresSection content={content} result={result} />

          <section className="rounded-3xl sm:rounded-4xl border border-page-border bg-white p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
            <h2 className="font-black text-2xl">{content.ui.reasonsTitle}</h2>
            <ul className="mt-5 grid gap-3">
              {resultContent.reasons.map((reason) => (
                <li className="flex gap-3 rounded-2xl bg-[#f4fbf7] px-4 py-3 text-page-ink-soft leading-7" key={reason}>
                  <HeartWaves aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-page-success" stroke={1.8} />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl sm:rounded-4xl bg-[#eef7ff] p-6 sm:p-8">
            <h2 className="font-black text-2xl">{content.ui.missionTitle}</h2>
            <p className="mt-4 text-page-ink-soft leading-8">{resultContent.mission}</p>
          </section>

          <section className="rounded-3xl sm:rounded-4xl bg-page-accent-strong p-6 text-white shadow-[0_24px_90px_var(--page-accent-glow)] sm:p-8">
            <h2 className="font-black text-2xl">{content.ui.resultCardTitle}</h2>
            <p className="mt-4 max-w-2xl text-white/76 leading-8">{content.ui.resultCardBody}</p>
            <div className="mt-6 rounded-3xl bg-white p-5 text-page-ink">
              <p className="font-bold text-page-ink-muted text-sm">{content.ui.shareLead}</p>
              <p className="mt-2 font-black text-2xl tracking-[-0.04em]">
                {gradeContent.label} · {resultContent.nickname}
              </p>
              <p className="mt-3 text-page-ink-soft text-sm leading-6">{shareBody}</p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className={cn(
                  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 font-black text-page-accent-strong text-sm transition-colors hover:bg-white/90',
                  FOCUS_CLASS_NAME,
                )}
                onClick={shareResult}
                type="button"
              >
                <Share aria-hidden="true" className="h-4 w-4" stroke={1.8} />
                {content.ui.shareButton}
              </button>
              <button
                className={cn(
                  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/24 bg-white/10 px-5 font-black text-sm text-white transition-colors hover:bg-white/16',
                  FOCUS_CLASS_NAME,
                )}
                onClick={shareResult}
                type="button"
              >
                <Copy aria-hidden="true" className="h-4 w-4" stroke={1.8} />
                {content.ui.copyFallbackButton}
              </button>
            </div>
            {shareFeedback ? <p className="mt-4 font-bold text-sm text-white/82">{shareFeedback}</p> : null}
          </section>

          <button
            className={cn(
              'inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full border border-page-border bg-white px-5 font-black text-page-ink-soft text-sm transition-colors hover:text-page-ink',
              FOCUS_CLASS_NAME,
            )}
            onClick={onRestart}
            type="button"
          >
            <Refresh aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {content.ui.restartButton}
          </button>
        </div>
      </div>
    </section>
  )
}

function AxisScoresSection({ content, result }: Pick<ResultViewProps, 'content' | 'result'>) {
  if (!content.axes || !content.ui.axisScoresTitle) {
    return null
  }

  return (
    <section className="rounded-3xl sm:rounded-4xl border border-page-border bg-white p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
      <h2 className="font-black text-2xl">{content.ui.axisScoresTitle}</h2>
      <div className="mt-6 grid gap-5">
        {axisOrder.map((axis) => {
          const axisContent = content.axes?.[axis]
          const axisScore = result.axisScores[axis]

          if (!axisContent) {
            return null
          }

          return (
            <div key={axis}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black text-page-ink">{axisContent.label}</p>
                  <p className="mt-1 text-page-ink-muted text-sm leading-6">{axisContent.description}</p>
                </div>
                <p className="shrink-0 font-black text-2xl text-page-accent-strong">{axisScore}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-page-soft">
                <div
                  className="h-full rounded-full bg-page-accent transition-[width] duration-300"
                  style={{ width: `${axisScore}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function GyeolScoreCard({ gradeLabel, indexLabel, mountainLabel, weaveIndex }: GyeolScoreCardProps) {
  return (
    <div className="relative mt-7 min-h-82 overflow-hidden rounded-3xl sm:rounded-4xl bg-page-ink p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:min-h-92">
      <Image
        alt=""
        className="object-cover"
        draggable={false}
        fill
        sizes="(min-width: 1280px) 560px, (min-width: 1024px) 44vw, calc(100vw - 48px)"
        src={coupleGyeolRidgeImage}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,33,29,0.68)_0%,rgba(21,33,29,0.2)_44%,rgba(21,33,29,0.78)_100%)]"
      />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-sm text-white/70">{indexLabel}</p>
          <p className="mt-1 font-black text-5xl">{weaveIndex}</p>
        </div>
        <div className="rounded-2xl bg-page-accent-strong/92 px-4 py-3 text-right text-white shadow-[0_16px_42px_var(--page-accent-glow)] backdrop-blur">
          <p className="font-black text-3xl tracking-tight">{gradeLabel}</p>
          <p className="mt-1 font-bold text-white/76 text-xs">{mountainLabel}</p>
        </div>
      </div>
    </div>
  )
}

function getShareUrl(result: GyeolResult) {
  const url = new URL(window.location.href)
  url.searchParams.set('r', serializeGyeolResult(result))
  return url.toString()
}

function formatText(template: string, values: Record<string, number | string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}
