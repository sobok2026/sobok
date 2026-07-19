'use client'

import { ArrowRight } from '@mynaui/icons-react'
import { cn } from '@/utils/cn'

import { syncRate } from '../_lib/codes'
import { buildConfidenceBars } from '../_lib/report'
import type { AxesResult, DeepTypeContent, DichoAxisId, InnerCode, PersonaCode } from '../_lib/types'
import { DICHO_AXES } from '../_lib/types'
import { ConfidenceBars } from './confidence-bars'

type GapRevealProps = {
  content: DeepTypeContent
  inner: AxesResult<DichoAxisId>
  onNext: () => void
  outer: PersonaCode
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

// The midpoint reward (after the Inner chapter, ~28 items in), ported in spirit from the prototype's
// scrRevealHidden: the Inner layer is complete, so we reveal it in full — code + noun/ident + description
// + honest per-axis bars + the 겉↔속 gap — then dangle the last layer (보석) as the pull. This is the
// product's strongest hook and the main lever against drop-off. It replaces the plain gem-intro screen;
// no share/done affordance, only "계속", framed as "3층 중 마지막 한 겹".
export function GapReveal({ content, inner, onNext, outer }: GapRevealProps) {
  const ui = content.ui
  const innerCode = inner.code as InnerCode
  const innerBase = content.base[innerCode]
  const transparent = outer === innerCode
  const rate = syncRate(outer, innerCode)
  const bars = buildConfidenceBars(content, inner.axes, DICHO_AXES)

  return (
    <main className="flex flex-1 flex-col justify-center bg-page-bg px-safe py-10 text-page-ink sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-center font-bold text-page-accent text-sm">{ui.gapRevealEyebrow}</p>

        <div className="mt-3 text-center">
          <p className="text-page-ink/56 text-sm">{ui.gapRevealInnerLead}</p>
          <p className="mt-1 font-black text-4xl tracking-wide">{innerCode}</p>
          <p className="mt-2 text-page-ink/60 text-sm">
            {innerBase.noun} · {innerBase.ident}
          </p>
        </div>

        <div className="mt-5 rounded-4xl border border-page-border bg-page-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-7">
          <p className="text-page-ink/72 leading-8">{content.hiddenDescription[innerCode]}</p>
          <ConfidenceBars bars={bars} borderlineLabel={ui.confidenceBorderlineLabel} title={ui.layerInner} />
        </div>

        <div className="mt-4 rounded-3xl border border-page-accent/30 bg-page-accent/6 p-5 text-center">
          {transparent ? (
            <p className="text-page-ink/76 leading-8">{ui.transparentTypeNote}</p>
          ) : (
            <>
              <p className="font-black text-2xl text-page-accent">{ui.syncRateLabel.replace('{rate}', String(rate))}</p>
              <p className="mt-2 text-page-ink/72 leading-7">
                {ui.gapRevealGapLine.replace('{outer}', outer).replace('{inner}', innerCode)}
              </p>
            </>
          )}
        </div>

        <p className="mx-auto mt-6 max-w-md text-center text-page-ink/68 leading-8">{ui.gapRevealPull}</p>

        <div className="mt-6 flex justify-center">
          <button
            className={cn(
              'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92 sm:w-auto',
              focusClassName,
            )}
            onClick={onNext}
            type="button"
          >
            {ui.gapRevealCta}
            <ArrowRight aria-hidden="true" className="h-4 w-4" stroke={1.8} />
          </button>
        </div>
      </div>
    </main>
  )
}
