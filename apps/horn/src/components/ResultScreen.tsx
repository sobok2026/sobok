'use client'

import { useEffect, useRef, useState } from 'react'
import { KO } from '@/content/ko'
import type { RunSummary } from '@/game/types'
import { shareResult } from '@/lib/share'

const GRADE_COLOR: Record<string, string> = {
  S: 'from-accent-warm to-brand',
  A: 'from-brand to-accent-cool',
  B: 'from-accent-cool to-positive',
  C: 'from-white/70 to-white/40',
  D: 'from-white/50 to-white/30',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ResultScreen({
  summary,
  best,
  onReplay,
}: {
  summary: RunSummary
  best: number
  onReplay: () => void
}) {
  const [copied, setCopied] = useState(false)
  const grade = KO.result.grades[summary.grade]
  const replayRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    replayRef.current?.focus()
  }, [])

  async function handleShare() {
    const url = typeof window === 'undefined' ? '' : window.location.href
    const text = KO.result.shareText.replace('{score}', String(summary.score)).replace('{level}', String(summary.level))
    const outcome = await shareResult({ title: KO.result.shareTitle, text, url })
    if (outcome === 'copied') {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 overflow-y-auto bg-black/55 px-6 py-10 text-center backdrop-blur-sm">
      <p aria-live="polite" className="sr-only" role="status">
        {`${grade.title}. ${KO.result.populationLabel} ${summary.score}${KO.result.unit}.`}
      </p>
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">{KO.result.title}</div>

      <div>
        <div
          className={`bg-gradient-to-r ${GRADE_COLOR[summary.grade]} bg-clip-text text-6xl font-black text-transparent`}
        >
          {summary.grade}
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">{grade.title}</h2>
        <p className="mt-1 max-w-xs text-sm text-white/70">{grade.blurb}</p>
      </div>

      <div className="w-full max-w-xs rounded-3xl bg-white/8 p-5 ring-1 ring-white/10">
        <div className="text-xs font-semibold tracking-wide text-white/60">{KO.result.populationLabel}</div>
        <div className="flex items-baseline justify-center gap-1 tabular-nums">
          <span className="text-5xl font-black text-brand drop-shadow [text-shadow:0_0_18px_rgba(255,138,190,0.6)]">
            {summary.score}
          </span>
          <span className="text-lg font-bold text-white/70">{KO.result.unit}</span>
        </div>
        {summary.best && <div className="mt-1 text-sm font-bold text-accent-warm">{KO.result.newBest}</div>}

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-black/25 py-2">
            <div className="text-[11px] text-white/55">{KO.result.levelLabel}</div>
            <div className="text-xl font-black tabular-nums text-white">{summary.level}</div>
          </div>
          <div className="rounded-xl bg-black/25 py-2">
            <div className="text-[11px] text-white/55">{KO.result.survivedLabel}</div>
            <div className="text-xl font-black tabular-nums text-white">{formatTime(summary.survived)}</div>
          </div>
          <div className="rounded-xl bg-black/25 py-2">
            <div className="text-[11px] text-white/55">{KO.result.bestComboLabel}</div>
            <div className="text-xl font-black tabular-nums text-white">{summary.bestCombo}</div>
          </div>
        </div>
        {best > 0 && (
          <div className="mt-3 text-xs font-medium text-white/60">
            {KO.bestPrefix} {best}
            {KO.result.unit}
          </div>
        )}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          className="rounded-full bg-gradient-to-r from-brand to-accent-warm px-8 py-3.5 text-base font-black text-[#2a0a1e] shadow-lg transition-transform active:scale-95"
          onClick={onReplay}
          ref={replayRef}
          type="button"
        >
          {KO.result.replayButton}
        </button>
        <button
          className="rounded-full bg-white/12 px-8 py-3 text-sm font-bold text-white ring-1 ring-white/15 transition-transform active:scale-95"
          onClick={handleShare}
          type="button"
        >
          {copied ? KO.result.copied : KO.result.shareButton}
        </button>
      </div>
    </div>
  )
}
