'use client'

import { type AssessmentProfile, AXIS_POLES, CONTEXT_AXES, GEM_AXES } from '@deep-type/model'
import { DEEP_TYPE_REPORT_OFFER } from '@deep-type/offer'
import { Refresh, Share } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics/browser'
import { cn } from '@/utils/cn'
import type { ReportSection } from '../_lib/api'
import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import { formatKrw } from '../_lib/price'
import { REPORT_OFFER_ITEMS, REPORT_PROMOTION } from '../_lib/report-offer-analytics'
import type { DeepTypeContent } from '../_lib/types'
import { AxisProfile } from './axis-profile'
import { ContextComparison } from './context-comparison'
import { ResultHero } from './result-hero'

type ReportViewProps = {
  content: DeepTypeContent
  locale: Locale
  onRestart: () => void
  onUnlock?: () => void
  paidSections?: readonly ReportSection[]
  profile: AssessmentProfile
  refined?: boolean
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function ReportView({
  content,
  locale,
  onRestart,
  onUnlock,
  paidSections,
  profile,
  refined = false,
}: ReportViewProps) {
  const promotionRef = useRef<HTMLElement>(null)
  const [shareFeedback, setShareFeedback] = useState('')
  const gemName = content.gemNames[profile.gem.code]
  const discountLabel = content.paywall.discountTemplate.replace(
    '{discount}',
    String(DEEP_TYPE_REPORT_OFFER.discountPercent),
  )
  const listPrice = formatKrw(locale, DEEP_TYPE_REPORT_OFFER.listAmount)
  const price = formatKrw(locale, DEEP_TYPE_REPORT_OFFER.amount)
  const shareText = content.ui.reportShareText
    .replace('{persona}', profile.persona.code)
    .replace('{inner}', profile.inner.code)
    .replace('{gem}', `${gemName} (${profile.gem.code})`)

  useEffect(() => {
    const promotion = promotionRef.current
    if (!onUnlock || !promotion) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }
        track('view_promotion', {
          creative_slot: 'free_result_offer',
          items: REPORT_OFFER_ITEMS,
          locale,
          ...REPORT_PROMOTION,
        })
        observer.disconnect()
      },
      { threshold: 0.5 },
    )
    observer.observe(promotion)

    return () => {
      observer.disconnect()
    }
  }, [locale, onUnlock])

  function unlock() {
    if (!onUnlock) {
      return
    }
    track('select_promotion', {
      creative_slot: 'free_result_offer',
      items: REPORT_OFFER_ITEMS,
      locale,
      ...REPORT_PROMOTION,
    })
    onUnlock()
  }

  async function share() {
    const shareData = { text: shareText, title: content.metadata.title, url: window.location.href }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${DEEP_TYPE_BRAND_NAME[locale]}`)
      setShareFeedback(content.ui.reportShareCopied)
    } catch {
      // Older/in-app browsers may expose neither a share sheet nor clipboard access.
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-14" id="main-content">
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <ResultHero content={content} profile={profile} refined={refined} />

        <ContextComparison content={content} profile={profile} />

        {onUnlock ? (
          <section
            className="rounded-4xl border border-page-accent/40 bg-page-accent/8 p-6 text-center sm:p-7"
            ref={promotionRef}
          >
            <p className="break-keep font-black text-lg text-page-accent">{content.paywall.title}</p>
            <p className="mx-auto mt-2 max-w-md text-page-ink/68 text-sm leading-7">{content.paywall.body}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-page-ink/38 text-sm line-through">{listPrice}</span>
              <span className="font-black text-page-accent text-xl">{price}</span>
              <span className="rounded-full bg-page-accent/12 px-2.5 py-1 font-black text-page-accent text-xs">
                {discountLabel}
              </span>
            </div>
            <button
              className={cn(
                'mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92',
                focusClassName,
              )}
              onClick={unlock}
              type="button"
            >
              {content.paywall.unlockCta}
            </button>
          </section>
        ) : null}

        <div className="rounded-3xl border border-page-border bg-page-soft/60 p-4">
          <p className="text-page-ink/60 text-xs leading-6">{content.ui.clarityNote}</p>
        </div>

        <AxisProfile
          axisIds={CONTEXT_AXES}
          content={content}
          scores={profile.persona.axes}
          title={`${content.ui.profileTitle} · ${content.ui.layerPersona}`}
        />
        <AxisProfile
          axisIds={CONTEXT_AXES}
          content={content}
          scores={profile.inner.axes}
          title={`${content.ui.profileTitle} · ${content.ui.layerInner}`}
        />
        <AxisProfile axisIds={GEM_AXES} content={content} scores={profile.gem.axes} title={content.ui.layerGem} />

        <section className="rounded-4xl border border-page-border bg-page-surface p-4 sm:p-6">
          <h2 className="font-black text-lg">{content.ui.reflectionTitle}</h2>
          <p className="mt-2 text-page-ink/60 text-sm leading-6">{content.ui.reflectionBody}</p>
          <ul className="mt-4 grid gap-3">
            {GEM_AXES.map((axis) => {
              const copy = content.axes[axis]
              const reflection =
                profile.gem.axes[axis].pole === AXIS_POLES[axis][0] ? copy.first.reflection : copy.second.reflection
              return (
                <li className="rounded-3xl border border-page-border bg-white p-4" key={axis}>
                  <p className="font-black text-sm">{copy.name}</p>
                  <p className="mt-1 text-page-ink/68 text-sm leading-6">{reflection}</p>
                </li>
              )
            })}
          </ul>
        </section>

        {paidSections?.map((section) => (
          <section className="rounded-4xl border border-page-border bg-page-surface p-4 sm:p-6" key={section.key}>
            <h2 className="break-keep font-black text-lg">{section.title}</h2>
            <p className="mt-3 whitespace-pre-line break-keep text-page-ink/76 leading-8">{section.body}</p>
          </section>
        ))}

        <section className="rounded-4xl border border-page-border bg-page-surface p-4 sm:p-6">
          <h2 className="font-black text-lg">{content.ui.methodologyNoteTitle}</h2>
          <p className="mt-2 text-page-ink/64 text-sm leading-7">{content.ui.methodologyNoteBody}</p>
          <Link
            className={cn(
              'mt-4 inline-flex min-h-11 items-center font-bold text-page-accent text-sm underline underline-offset-4',
              focusClassName,
            )}
            href={`/${locale}/deep-type/methodology`}
          >
            {content.ui.methodologyCta}
          </Link>
        </section>

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
