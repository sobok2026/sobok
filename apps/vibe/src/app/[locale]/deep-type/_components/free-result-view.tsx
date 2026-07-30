'use client'

import { WORLD_JOB_CORE, WORLD_JOB_FAMILY } from '@deep-type/content/world-job'
import { FREE_DELIVERABLES_KO } from '@deep-type/free-deliverables'
import { AXIS_POLES, type FreeAssessmentProfile } from '@deep-type/model'
import { DEEP_TYPE_REPORT_OFFER } from '@deep-type/offer'
import {
  buildFreeReport,
  type FreeAxisBand,
  type FreeStrengthCard,
  type FreeStrengthCards,
} from '@deep-type/rules/free'
import { Refresh, Share } from '@mynaui/icons-react'
import { trackEcommerce } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { useFlowFocusOverride } from '@/components/flow-focus'
import { cn } from '@/utils/cn'

import { DEEP_TYPE_BRAND_NAME } from '../_lib/brand'
import { formatPrice } from '../_lib/price'
import { reportPromotionEcommerce } from '../_lib/report-offer-analytics'
import { CARD_CLASS_NAME, GROUPED_LIST_CLASS_NAME, GROUPED_ROW_CLASS_NAME } from '../_lib/surface'
import type { DeepTypeContent } from '../_lib/types'
import { AbilityArtwork } from './ability-artwork'
import { GemArtwork } from './gem-artwork'
import { InnerArtwork } from './inner-artwork'
import { WorldJobHero } from './world-job-hero'

type FreeResultViewProps = {
  content: DeepTypeContent
  locale: Locale
  onRestart: () => void
  /** Absent once the report has been bought: the failure screen shows the same free result without the offer. */
  onUnlock?: () => void
  profile: FreeAssessmentProfile
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'
const [TYPE_HEADING, CORE_HEADING, JOB_HEADING, DRAIN_HEADING] = FREE_DELIVERABLES_KO

/**
 * The free result, and the four blocks below the hero are the four deliverables the terms name — headings
 * injected from `FREE_DELIVERABLES_KO` in its declared order, because the withdrawal-right limitation only holds
 * while the screen and the terms list the same four things.
 *
 * No percentages and no bars. `clarity = |lean| * 100` is a distance from even, not a confidence, and printing
 * it as a share invited exactly the reading the band wording exists to prevent. Each axis says its letter and
 * which of three bands it landed in, and the note above them says what the paid pass can and cannot move.
 */
export function FreeResultView({ content, locale, onRestart, onUnlock, profile }: FreeResultViewProps) {
  // `deep-type/result` is a focused flow by route, because the paywall and the refinement run live on that URL
  // too. This phase is the exception: nothing is unsaved and nothing is in flight, the visitor is reading and
  // sharing, and 'what else is here' is the question the site wants them to ask next.
  useFlowFocusOverride(false)

  const offer = DEEP_TYPE_REPORT_OFFER[locale]
  const promotionRef = useRef<HTMLElement>(null)
  const [shareFeedback, setShareFeedback] = useState('')
  const report = buildFreeReport(profile)
  const gemName = content.gemNames[profile.gem.code]
  const shareText = content.ui.reportShareText
    .replace('{inner}', profile.inner.code)
    .replace('{gem}', `${gemName} (${profile.gem.code})`)
    .replace('{job}', report.worldJob.name)

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
        trackEcommerce('view_promotion', reportPromotionEcommerce(locale), { locale })
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
    trackEcommerce('select_promotion', reportPromotionEcommerce(locale), { locale })
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
        <WorldJobHero content={content} gem={profile.gem.code} inner={profile.inner.code} />

        {onUnlock ? (
          <section
            className="rounded-3xl border border-page-accent/40 bg-page-accent/8 p-6 text-center sm:rounded-4xl sm:p-7"
            ref={promotionRef}
          >
            <p className="break-keep font-black text-lg text-page-accent">{content.paywall.title}</p>
            <p className="mx-auto mt-2 max-w-md text-page-ink/68 text-sm leading-7">{content.paywall.body}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-page-ink/38 text-sm line-through">
                {formatPrice(locale, offer.currency, offer.listAmount)}
              </span>
              <span className="font-black text-page-accent text-xl">
                {formatPrice(locale, offer.currency, offer.amount)}
              </span>
              <span className="rounded-full bg-page-accent/12 px-2.5 py-1 font-black text-page-accent text-xs">
                {content.paywall.discountTemplate.replace('{discount}', String(offer.discountPercent))}
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
          <p className="text-page-ink/60 text-xs leading-6">{report.clarityNote}</p>
        </div>

        <section className={CARD_CLASS_NAME}>
          <h2 className="font-black text-lg">{TYPE_HEADING}</h2>
          <p className="mt-1 font-black text-2xl text-page-accent tracking-wide">{profile.inner.code}</p>
          <div className="mt-4">
            <InnerArtwork innerCode={profile.inner.code} />
          </div>
          <AxisBands bands={report.axes.inner} content={content} />
        </section>

        <section className={CARD_CLASS_NAME}>
          <h2 className="font-black text-lg">{CORE_HEADING}</h2>
          <p className="mt-1 font-black text-2xl text-page-accent tracking-wide">
            {gemName} · {profile.gem.code}
          </p>
          <div className="mt-4">
            <GemArtwork gemCode={profile.gem.code} />
          </div>
          <AxisBands bands={report.axes.gem} content={content} />
        </section>

        <section className={CARD_CLASS_NAME}>
          <h2 className="font-black text-lg">{JOB_HEADING}</h2>
          <p className="mt-2 break-keep font-black text-xl">{report.worldJob.name}</p>
          <dl className={cn('mt-4', GROUPED_LIST_CLASS_NAME, 'sm:grid sm:grid-cols-2 sm:gap-2')}>
            <Facet
              label={content.ui.worldJobFamilyLabel}
              name={WORLD_JOB_FAMILY[profile.inner.code].name}
              value={WORLD_JOB_FAMILY[profile.inner.code].role}
            />
            <Facet
              label={content.ui.worldJobCoreLabel}
              name={WORLD_JOB_CORE[profile.gem.code].name}
              value={WORLD_JOB_CORE[profile.gem.code].strength}
            />
          </dl>
        </section>

        <section className={CARD_CLASS_NAME}>
          <h2 className="font-black text-lg">{DRAIN_HEADING}</h2>
          <p className="mt-2 font-bold text-page-accent text-sm">{report.drainSignature.spread.label}</p>
          <p className="mt-1 text-page-ink/68 text-sm leading-6">{report.drainSignature.spread.detail}</p>
          <ul className={cn('mt-4', GROUPED_LIST_CLASS_NAME, 'sm:grid sm:gap-3')}>
            {report.drainSignature.leaders.map((facet) => (
              <li className={GROUPED_ROW_CLASS_NAME} key={facet.id}>
                <p className="break-keep font-black text-sm">{facet.label}</p>
                <p className="mt-1 break-keep text-page-ink/68 text-sm leading-6">{facet.action}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-page-ink/56 text-xs leading-5">{report.drainSignature.meaning}</p>
          <p className="mt-1 text-page-ink/56 text-xs leading-5">{report.drainSignature.narrowNote}</p>
        </section>

        <StrengthCards cards={report.strengthCards} title={content.ui.strengthCardsTitle} />

        <section className={CARD_CLASS_NAME}>
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
      </div>
    </main>
  )
}

function AxisBands({ bands, content }: { bands: readonly FreeAxisBand[]; content: DeepTypeContent }) {
  return (
    <ul className="mt-5 grid gap-4">
      {bands.map((axis) => {
        const copy = content.axes[axis.id]
        const pole = axis.leading === AXIS_POLES[axis.id][0] ? copy.first : copy.second

        return (
          <li key={axis.id}>
            <div className="flex items-start justify-between gap-4">
              <p className="font-black text-sm">{copy.name}</p>
              <span className="shrink-0 rounded-full bg-page-soft px-3 py-1 font-black text-page-accent text-xs">
                {axis.leading} · {pole.label}
              </span>
            </div>
            <p className="mt-2 break-keep font-bold text-page-ink/64 text-xs leading-5">{axis.band.label}</p>
            <p className="mt-1 break-keep text-page-ink/48 text-xs leading-5">{axis.band.detail}</p>
          </li>
        )
      })}
    </ul>
  )
}

// Two sets, no ranks. Comparing eight axes measured by three items each is a within-person comparison that one
// flipped answer reorders, so the stronger band comes first and the order inside a band is the engine's own
// declaration order. Each card names the band it came from rather than implying a position.
function StrengthCards({ cards, title }: { cards: FreeStrengthCards; title: string }) {
  const ordered: readonly FreeStrengthCard[] = [
    ...cards.axis.distinct3,
    ...cards.combo.distinct3,
    ...cards.axis.moderate3,
    ...cards.combo.moderate3,
  ]

  if (ordered.length === 0) {
    return null
  }

  return (
    <section className={CARD_CLASS_NAME}>
      <h2 className="font-black text-lg">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {ordered.map((card) => (
          <li
            className="flex flex-col overflow-hidden rounded-3xl border border-page-border bg-white sm:flex-row sm:gap-4"
            key={card.slug}
          >
            <AbilityArtwork slug={card.slug} />
            <div className="min-w-0 flex-1 p-4 sm:py-4 sm:pr-4 sm:pl-0">
              <div className="flex items-start justify-between gap-3">
                <p className="break-keep font-black text-sm leading-5">{card.copy.name}</p>
                <span className="inline-flex h-5 min-w-9 shrink-0 items-center justify-center rounded-full bg-page-soft px-2 font-bold text-page-ink/56 text-xs">
                  {card.poles.join('')}
                </span>
              </div>
              <p className="mt-2 break-keep text-page-ink/68 text-sm leading-6">{card.copy.core}</p>
              <p className="mt-2 break-keep text-page-ink/52 text-xs leading-5">{card.band.label}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Facet({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <div className={GROUPED_ROW_CLASS_NAME}>
      <dt className="text-page-ink/44 text-xs">{label}</dt>
      <dd className="mt-1 font-black text-sm">{name}</dd>
      <dd className="mt-1 break-keep text-page-ink/64 text-xs leading-5">{value}</dd>
    </div>
  )
}
