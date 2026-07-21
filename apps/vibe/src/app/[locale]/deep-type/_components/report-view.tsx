'use client'

import { Refresh, Share } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import { useState } from 'react'
import { cn } from '@/utils/cn'

import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import type { DeepReport, DeepTypeContent } from '../_lib/types'
import { ConfidenceBars } from './confidence-bars'
import { GemBadge } from './gem-badge'

type ReportViewProps = {
  content: DeepTypeContent
  locale: Locale
  onRestart: () => void
  // When present, the report is the FREE teaser and this opens the paywall for the deep 감정서.
  onUnlock?: () => void
  report: DeepReport
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function ReportView({ content, locale, onRestart, onUnlock, report }: ReportViewProps) {
  const [shareFeedback, setShareFeedback] = useState('')
  const { code, confidence, mismatches, sections } = report
  const gem = content.gem[code.gem]
  const section = content.reportSections

  const shareText = content.ui.reportShareText
    .replace('{outer}', code.outer)
    .replace('{inner}', code.inner)
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

    await navigator.clipboard?.writeText(`${shareText} ${DEEP_TYPE_BRAND_NAME[locale]}`)
    setShareFeedback('복사됐어요')
  }

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-14">
      <div className="mx-auto grid w-full max-w-xl gap-4">
        {/* Header — the three layers at a glance */}
        <header className="rounded-4xl border border-page-border bg-page-surface p-6 text-center shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
          <GemBadge gemCode={code.gem} size={104} />
          <p className="mt-5 font-black text-3xl">
            {gem.modifier} {gem.gemName}
          </p>
          <p className="mt-1 font-bold text-page-accent text-sm">{gem.gemWhy}</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <CodeChip label={content.ui.layerPersona} value={code.outer} />
            <CodeChip label={content.ui.layerInner} value={code.inner} />
            <CodeChip gold label={content.ui.layerGemShort} value={gem.gemName} />
          </div>

          <p className="mt-6 text-left text-page-ink/72 leading-8">
            {content.ui.summaryTemplate
              .replace('{outerNoun}', sections.summary.outerNoun)
              .replace('{innerNoun}', sections.summary.innerNoun)
              .replace('{gemName}', sections.summary.gemName)
              .replace('{narrative}', gem.narrative)}
          </p>
          <p className="mt-3 text-left text-page-ink/60 text-sm leading-7">{content.gemDescription[code.gem]}</p>
        </header>

        {/* Paywall upsell — the free report is the teaser; this opens the deep 감정서 */}
        {onUnlock ? (
          <section className="rounded-4xl border border-page-accent/40 bg-page-accent/8 p-6 text-center sm:p-7">
            <p className="break-keep font-black text-lg text-page-accent">{content.paywall.title}</p>
            <p className="mx-auto mt-2 max-w-md text-page-ink/68 text-sm leading-7">{content.paywall.body}</p>
            <button
              className={cn(
                'mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92',
                focusClassName,
              )}
              onClick={onUnlock}
              type="button"
            >
              {content.paywall.unlockCta}
            </button>
          </section>
        ) : null}

        {/* Measurement confidence — honest per-axis reads */}
        <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7">
          <h2 className="font-black text-lg">{content.ui.confidenceTitle}</h2>
          <p className="mt-2 text-page-ink/60 text-sm leading-6">{content.ui.confidenceIntro}</p>

          <ConfidenceBars
            bars={confidence.persona}
            borderlineLabel={content.ui.confidenceBorderlineLabel}
            title={content.ui.layerPersona}
          />
          <ConfidenceBars
            bars={confidence.inner}
            borderlineLabel={content.ui.confidenceBorderlineLabel}
            title={content.ui.layerInner}
          />
          <ConfidenceBars
            bars={confidence.gem}
            borderlineLabel={content.ui.confidenceBorderlineLabel}
            title={content.ui.layerGemFull}
          />
        </section>

        {/* Self-claim mismatch — a premium "you said X, you answer like Y" moment */}
        {mismatches.length > 0 ? (
          <section className="rounded-4xl border border-page-accent/35 bg-page-accent/6 p-6 sm:p-7">
            <h2 className="font-black text-lg text-page-accent">{content.ui.mismatchTitle}</h2>
            <ul className="mt-3 grid gap-2">
              {mismatches.map((mismatch) => (
                <li className="text-page-ink/78 leading-7" key={mismatch.axisId}>
                  <b className="font-bold">{mismatch.axisName}</b> ·{' '}
                  {content.ui.mismatchNote
                    .replace('{claimed}', mismatch.claimedLabel)
                    .replace('{measured}', mismatch.measuredLabel)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Inner (혼자일 때) narrative */}
        <SectionCard title={content.ui.selfAloneTitle}>
          <p className="text-page-ink/72 leading-8">{content.hiddenDescription[code.inner]}</p>
        </SectionCard>

        {/* Gap 겉↔속 */}
        <SectionCard title={section.gap.title}>
          {sections.gap.transparent ? (
            <p className="text-page-ink/72 leading-8">{content.ui.transparentTypeNote}</p>
          ) : (
            <div className="grid gap-4">
              {sections.gap.syncRate !== null ? (
                <p className="font-bold text-page-accent text-sm">
                  {content.ui.syncRateLabel.replace('{rate}', String(sections.gap.syncRate))}
                </p>
              ) : null}
              {sections.gap.lines.map((line) => (
                <div className="rounded-3xl border border-page-border bg-white p-4" key={line.gap}>
                  <p className="text-page-ink/78 leading-7">{line.gap}</p>
                  <p className="mt-2 text-page-ink/56 text-sm leading-6">→ {line.prediction}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Social */}
        <SectionCard title={section.social.title}>
          <p className="text-page-ink/72 leading-8">{sections.social.text}</p>
          {sections.social.note ? (
            <p className="mt-3 rounded-2xl bg-page-soft/60 p-3 text-page-ink/64 text-sm leading-6">
              {sections.social.note}
            </p>
          ) : null}
        </SectionCard>

        {/* Recharge */}
        <SectionCard title={section.recharge.title}>
          <p className="text-page-ink/72 leading-8">{sections.recharge}</p>
        </SectionCard>

        {/* Weak spot */}
        <SectionCard title={section.weakSpot.title}>
          <p className="text-page-ink/72 leading-8">{sections.weakSpot}</p>
        </SectionCard>

        {/* Stress */}
        <SectionCard title={section.stress.title}>
          <p className="text-page-ink/72 leading-8">{sections.stress.base}</p>
          <dl className="mt-4 grid gap-3">
            <StressRow label={content.ui.stressSignLabel} value={sections.stress.sign} />
            <StressRow label={content.ui.stressAidLabel} value={sections.stress.aid} />
            <StressRow label={content.ui.stressDontLabel} value={sections.stress.dont} />
          </dl>
        </SectionCard>

        {/* Love */}
        <SectionCard title={section.love.title}>
          <p className="text-page-ink/72 leading-8">{sections.love.text}</p>
          <p className="mt-3 rounded-2xl bg-page-soft/60 p-3 text-page-ink/64 text-sm leading-6">
            {sections.love.note}
          </p>
        </SectionCard>

        {/* Life attitude */}
        <SectionCard title={section.lifeAttitude.title}>
          <p className="font-black text-page-accent text-xl">{sections.lifeAttitude.name}</p>
          <p className="mt-2 text-page-ink/72 leading-8">{sections.lifeAttitude.desc}</p>
          <p className="mt-3 text-page-ink/60 text-sm leading-7">💡 {sections.lifeAttitude.tip}</p>
        </SectionCard>

        {/* Goals */}
        <SectionCard title={section.goals.title}>
          <p className="text-page-ink/72 leading-8">{sections.goals}</p>
        </SectionCard>

        {/* Match */}
        <SectionCard title={section.match.title}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-page-border bg-white p-4 text-center">
              <p className="text-page-ink/48 text-xs">{content.ui.matchFitLabel}</p>
              <p className="mt-1 font-black text-page-accent">{sections.match.matchGem}</p>
            </div>
            <div className="rounded-3xl border border-page-border bg-white p-4 text-center">
              <p className="text-page-ink/48 text-xs">{content.ui.matchClashLabel}</p>
              <p className="mt-1 font-black text-page-ink">{sections.match.clashGem}</p>
            </div>
          </div>
        </SectionCard>

        {/* Avoid */}
        <SectionCard title={section.avoid.title}>
          <ul className="grid gap-2">
            {sections.avoid.map((item) => (
              <li className="flex gap-2 text-page-ink/72 leading-7" key={item}>
                <span aria-hidden="true" className="text-page-accent">
                  ×
                </span>
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* This week */}
        <SectionCard title={section.thisWeek.title}>
          <ul className="grid gap-2">
            {sections.thisWeek.map((item, index) => (
              <li className="flex gap-2 text-page-ink/72 leading-7" key={item}>
                <span aria-hidden="true" className="font-black text-page-accent">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Actions */}
        <div className="mt-2 grid gap-3">
          <button
            className={cn(
              'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92',
              focusClassName,
            )}
            onClick={share}
            type="button"
          >
            <Share aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {content.ui.reportShareCta}
          </button>
          {shareFeedback ? <p className="text-center text-page-ink/56 text-sm">{shareFeedback}</p> : null}
          <button
            className={cn(
              'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-page-border bg-white px-6 font-bold text-page-ink/70 text-sm transition-colors hover:text-page-ink',
              focusClassName,
            )}
            onClick={onRestart}
            type="button"
          >
            <Refresh aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {content.ui.reportRestartCta}
          </button>
        </div>

        <p className="mt-4 text-center text-page-ink/40 text-xs leading-6">{content.ui.reportDisclaimer}</p>
      </div>
    </main>
  )
}

function SectionCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7">
      <h2 className="font-black text-lg">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function CodeChip({ gold, label, value }: { gold?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-page-border bg-white p-3 text-center">
      <p className="text-page-ink/48 text-xs">{label}</p>
      <p className={cn('mt-1 font-black text-sm', gold ? 'text-page-accent' : 'text-page-ink')}>{value}</p>
    </div>
  )
}

function StressRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 font-bold text-page-ink/48 text-sm">{label}</dt>
      <dd className="text-page-ink/74 text-sm leading-6">{value}</dd>
    </div>
  )
}
