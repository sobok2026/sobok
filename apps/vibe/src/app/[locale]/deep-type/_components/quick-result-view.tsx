'use client'

import { Lock, Share } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import { useState } from 'react'
import { cn } from '@/utils/cn'

import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import type { DeepTypeContent, GemCode, InnerCode, PersonaCode } from '../_lib/types'
import { GemBadge } from './gem-badge'

type QuickResultViewProps = {
  content: DeepTypeContent
  gemCode: GemCode
  locale: Locale
  onOpenPaywall: () => void
  onRestart: () => void
  outer: PersonaCode
  qHidden: InnerCode
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function QuickResultView({
  content,
  gemCode,
  locale,
  onOpenPaywall,
  onRestart,
  outer,
  qHidden,
}: QuickResultViewProps) {
  const [shareFeedback, setShareFeedback] = useState('')
  const gem = content.gem[gemCode]

  const shareText = content.ui.quickShareTextTemplate
    .replace('{brand}', DEEP_TYPE_BRAND_NAME[locale])
    .replace('{inner}', qHidden)
    .replace('{gem}', gem.gemName)

  async function share() {
    const shareData = { text: shareText, title: content.metadata.title, url: window.location.href }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // Fall back to copying when native share is canceled or unavailable.
      }
    }

    await navigator.clipboard?.writeText(shareText)
    setShareFeedback('복사됐어요')
  }

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-center text-page-ink/56 text-sm">기본 분석 결과, 당신의 보석은</p>

        <div className="mt-4">
          <GemBadge gemCode={gemCode} size={100} />
        </div>
        <p className="mt-4 text-center font-black text-3xl">{gem.gemName}</p>
        <p className="mx-auto mt-2 w-fit rounded-full bg-page-soft px-3 py-1 text-page-ink/56 text-xs">
          기본 분석 · 12문항 약식 측정
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <TriStat label="Persona" value={outer} />
          <TriStat label="Inner (약식)" value={qHidden} />
          <TriStat gold label="보석 (약식)" value={gem.gemName} />
        </div>

        <p className="mt-6 text-center text-page-ink/66 leading-7">{gem.narrative}. 12문항으로는 여기까지 보여요.</p>

        <div className="relative mt-6 overflow-hidden rounded-4xl border border-page-border bg-page-surface p-6">
          <div className="pointer-events-none blur-[5px] opacity-55">
            <h3 className="font-black text-lg text-page-accent">
              {outer !== qHidden ? `왜 ${qHidden}을 숨기고 ${outer}로 살게 됐을까` : '겉과 속의 간극'}
            </h3>
            <p className="mt-2 text-page-ink/70 leading-7">{gem.lack}. 그리고 그 간극이 시작된 시점은</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-page-surface/60">
            <Lock aria-hidden="true" className="h-5 w-5 text-page-ink/70" stroke={1.8} />
            <span className="font-bold text-page-ink text-sm">정밀 분석에서 확정돼요</span>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-page-border bg-white p-5">
          <p className="text-page-ink/66 text-sm leading-6">
            <b className="text-page-accent">정밀 분석</b>은 40문항이에요. 전 문항이 당신의 Persona와 Inner 기준으로
            나와요. Inner를 확정하고 심층 리포트 12섹션까지 드려요.
          </p>
        </div>

        <button
          className={cn(
            'mt-6 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92',
            focusClassName,
          )}
          onClick={onOpenPaywall}
          type="button"
        >
          정밀 분석 + 심층 리포트
        </button>
        <button
          className={cn(
            'mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-page-border bg-white px-6 font-bold text-page-ink/70 text-sm transition-colors hover:text-page-ink',
            focusClassName,
          )}
          onClick={share}
          type="button"
        >
          <Share aria-hidden="true" className="h-4 w-4" stroke={1.8} />
          기본 결과 공유하기
        </button>
        {shareFeedback ? <p className="mt-2 text-center text-page-ink/56 text-sm">{shareFeedback}</p> : null}

        <button
          className={cn(
            'mt-6 block w-full text-center text-page-ink/48 text-sm underline-offset-4 hover:underline',
            focusClassName,
          )}
          onClick={onRestart}
          type="button"
        >
          처음부터 다시
        </button>

        <p className="mt-8 text-center text-page-ink/40 text-xs leading-6">
          본 콘텐츠는 심리학적 진단 도구가 아닌 엔터테인먼트/자기이해 콘텐츠입니다.
        </p>
      </div>
    </main>
  )
}

function TriStat({ gold, label, value }: { gold?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-page-border bg-white p-3 text-center">
      <p className="text-page-ink/48 text-xs">{label}</p>
      <p className={cn('mt-1 font-black', gold ? 'text-page-accent' : 'text-page-ink')}>{value}</p>
    </div>
  )
}
