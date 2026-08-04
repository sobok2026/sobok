'use client'

import { track } from '@sobok/analytics/browser'
import { SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import type { Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import Starfield from '@/components/Starfield'
import { GUARDIAN_LOVE_REDRAW_UI } from '@/content/guardian-love-redraw-ui'
import { GUARDIAN_REPORT_UI, type GuardianReportPaidContent } from '@/content/guardian-report-ui'
import { stellaAuthClient } from '@/lib/auth-client'
import {
  claimGuardianCollection,
  clearGuardianCheckoutSession,
  GuardianApiError,
  type GuardianCheckoutSession,
  type GuardianReportAccess,
  type GuardianReportView,
  getGuardianReport,
  guardianReportPaths,
} from '@/lib/guardian-paid'

import styles from '../paid-report.module.css'
import GuardianAccountRequired from './GuardianAccountRequired'
import GuardianMissingSession from './GuardianMissingSession'
import { useGuardianReportAccess } from './useGuardianReportAccess'

type FulfilledReport = Extract<GuardianReportView, { status: 'fulfilled' }>
type ResultState =
  | { kind: 'loading' }
  | { kind: 'fulfilled'; report: FulfilledReport }
  | { kind: 'error'; message: string }

export default function GuardianPaidResult({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].paid
  const state = useGuardianReportAccess(locale)

  if (state.kind === 'loading') {
    return <LoadingResult copy={content.status.fulfillingTitle} />
  }
  if (state.kind === 'account-required') {
    return <GuardianAccountRequired locale={locale} />
  }
  if (state.kind === 'missing') {
    return <GuardianMissingSession locale={locale} />
  }

  return <GuardianResultLoader access={state.access} checkout={state.checkout} />
}

function GuardianResultLoader({
  access,
  checkout,
}: {
  access: GuardianReportAccess
  checkout: GuardianCheckoutSession | null
}) {
  const content = GUARDIAN_REPORT_UI[access.locale].paid
  const paths = guardianReportPaths(access.locale)
  const router = useRouter()
  const [state, setState] = useState<ResultState>({ kind: 'loading' })
  const started = useRef(false)

  useEffect(() => {
    if (started.current) {
      return
    }
    started.current = true
    void loadResult()
  }, [])

  async function loadResult() {
    setState({ kind: 'loading' })
    try {
      const report = await getGuardianReport(access)
      if (report.status !== 'fulfilled') {
        router.replace(paths.questions)
        return
      }
      setState({ kind: 'fulfilled', report })
      track('guardian_report_opened', { locale: report.locale })
    } catch (error) {
      if (error instanceof GuardianApiError && error.slug === 'payment-required') {
        router.replace(paths.questions)
        return
      }
      setState({ kind: 'error', message: reportErrorMessage(error, content) })
    }
  }

  if (state.kind === 'fulfilled') {
    return <GuardianReportExperience checkout={checkout} content={content} report={state.report} />
  }

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
      <section className="relative z-10 mx-auto mt-[12vh] max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-6 text-center shadow-2xl backdrop-blur sm:p-8">
        <StatusIcon>{state.kind === 'loading' ? '✧' : '⋆'}</StatusIcon>
        <h1 className="mt-4 text-xl font-bold text-white">
          {state.kind === 'loading' ? content.status.fulfillingTitle : content.status.errorTitle}
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          {state.kind === 'loading' ? content.status.fulfillingBody : state.message}
        </p>
        {state.kind === 'loading' ? (
          <LoadingDots />
        ) : (
          <button
            className="mt-6 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            onClick={loadResult}
            type="button"
          >
            {content.status.retryLoad}
          </button>
        )}
      </section>
    </main>
  )
}

function GuardianReportExperience({
  checkout,
  content,
  report,
}: {
  checkout: GuardianCheckoutSession | null
  content: GuardianReportPaidContent
  report: FulfilledReport
}) {
  const [view, setView] = useState<'reveal' | 'report'>('reveal')

  useEffect(() => {
    if (view === 'report') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [view])

  function openReport() {
    setView('report')
    track('guardian_report_body_opened', { locale: report.locale })
  }

  if (view === 'reveal') {
    return <CardReveal content={content} onComplete={openReport} report={report} />
  }
  return <GuardianReport checkout={checkout} content={content} report={report} />
}

function CardReveal({
  content,
  onComplete,
  report,
}: {
  content: GuardianReportPaidContent
  onComplete: () => void
  report: FulfilledReport
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const revealedDetailsRef = useRef<HTMLDivElement>(null)
  const card = report.cards[index]
  const section = report.narrative.sections.find(({ slot }) => slot === card.slot)
  const isLast = index === report.cards.length - 1

  useEffect(() => {
    if (flipped) {
      revealedDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [flipped])

  function reveal() {
    if (flipped) {
      return
    }
    setFlipped(true)
    track('guardian_card_revealed', { index, locale: report.locale, slot: card.slot })
  }

  function next() {
    if (isLast) {
      track('guardian_card_reveal_complete', { locale: report.locale })
      onComplete()
      return
    }
    setIndex((current) => current + 1)
    setFlipped(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-65" />
      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.reveal.eyebrow}</p>
        <h1 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.reveal.title}</h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.reveal.body}</p>
        <div
          aria-label={`${index + 1} / ${report.cards.length}`}
          aria-valuemax={report.cards.length}
          aria-valuemin={1}
          aria-valuenow={index + 1}
          className="mt-3 flex justify-center gap-1.5"
          role="progressbar"
        >
          {report.cards.map((item, itemIndex) => (
            <span
              className={`h-1.5 rounded-full transition-all ${itemIndex <= index ? 'w-7 bg-pink-200' : 'w-3 bg-white/10'}`}
              key={item.cardEditionId}
            />
          ))}
        </div>

        <button
          className="mt-3 text-xs text-foreground-faint underline-offset-4 hover:text-foreground-muted hover:underline"
          onClick={onComplete}
          type="button"
        >
          {content.reveal.skip}
        </button>

        <div className={`${styles.revealStage} mt-4`}>
          <button
            aria-label={flipped ? section?.artworkAlt : content.reveal.tap}
            className={styles.revealButton}
            onClick={reveal}
            type="button"
          >
            <span className={`${styles.revealInner} ${flipped ? styles.revealFlipped : ''}`}>
              <span className={`${styles.revealFace} ${styles.revealBack}`}>
                <span className="relative z-10 text-5xl">✦</span>
                <span className="absolute bottom-8 z-10 text-[10px] font-semibold uppercase tracking-[0.22em]">
                  {content.questionnaire.slotLabels[card.slot]}
                </span>
              </span>
              <span className={`${styles.revealFace} ${styles.revealFront}`}>
                <Image
                  alt={section?.artworkAlt ?? ''}
                  className="h-full w-full object-cover"
                  fill
                  priority
                  sizes="(max-width: 640px) 82vw, 21rem"
                  src={card.artworkPath}
                />
              </span>
            </span>
          </button>
        </div>

        {!flipped ? (
          <p className="mt-5 animate-pulse text-xs font-semibold text-pink-100 motion-reduce:animate-none">
            {content.reveal.tap}
          </p>
        ) : (
          <div className="mx-auto mt-5 max-w-md scroll-mb-24" ref={revealedDetailsRef}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              {content.questionnaire.slotLabels[card.slot]} ·{' '}
              {card.rarity ? content.reveal.rarityLabels[card.rarity] : content.reveal.signatureRarity}
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">{section?.title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{section?.oneLine}</p>
            <button
              className="mt-5 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
              onClick={next}
              type="button"
            >
              {isLast ? content.reveal.read : content.reveal.next}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function GuardianReport({
  checkout,
  content,
  report,
}: {
  checkout: GuardianCheckoutSession | null
  content: GuardianReportPaidContent
  report: FulfilledReport
}) {
  const { narrative } = report
  const redrawContent = GUARDIAN_LOVE_REDRAW_UI[report.locale]
  const paths = guardianReportPaths(report.locale)
  const placements = placementSummary(narrative.sections)
  const closingRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const closing = closingRef.current
    if (!closing) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }
        track('guardian_report_complete', { card_count: report.cards.length, locale: report.locale })
        observer.disconnect()
      },
      { threshold: 0.5 },
    )

    observer.observe(closing)
    return () => observer.disconnect()
  }, [report.cards.length, report.locale])

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-45" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <header className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{narrative.hero.eyebrow}</p>
          <h1 className="mt-3 text-balance text-3xl font-black leading-tight text-white sm:text-4xl">
            {narrative.hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-foreground-muted">{narrative.hero.introduction}</p>
          <p className="mx-auto mt-5 rounded-2xl border border-pink-200/15 bg-pink-100/8 px-4 py-3 text-sm font-semibold leading-6 text-pink-50">
            {narrative.hero.oneLine}
          </p>
          {narrative.hero.chartNote && (
            <p className="mt-3 text-xs leading-5 text-foreground-subtle">{narrative.hero.chartNote}</p>
          )}
        </header>

        <section aria-label={content.report.cardsLabel} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {report.cards.map((card) => (
            <figure
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-xl"
              key={card.cardEditionId}
            >
              <Image
                alt={narrative.sections.find(({ slot }) => slot === card.slot)?.artworkAlt ?? ''}
                className="aspect-[3/4] w-full object-cover"
                height={480}
                priority
                src={card.artworkPath}
                width={360}
              />
              <figcaption className="flex items-center justify-between gap-2 px-2.5 py-2 text-[10px]">
                <span className="font-semibold text-white">{content.questionnaire.slotLabels[card.slot]}</span>
                <span className="text-foreground-subtle">
                  {card.rarity ? content.reveal.rarityLabels[card.rarity] : content.reveal.signatureRarity}
                </span>
              </figcaption>
            </figure>
          ))}
        </section>

        <AccountSaveOffer checkout={checkout} content={content.report.accountSave} report={report} />

        <aside className="mt-4 rounded-[2rem] border border-pink-200/20 bg-[linear-gradient(135deg,rgba(255,193,214,0.11),rgba(201,168,255,0.08))] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              {redrawContent.reportOffer.eyebrow}
            </p>
            <h2 className="mt-2 text-lg font-bold text-white">{redrawContent.reportOffer.title}</h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-foreground-muted">{redrawContent.reportOffer.body}</p>
          </div>
          <Link
            className="mt-4 inline-flex w-full shrink-0 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground sm:mt-0 sm:w-auto"
            href={`${paths.loveRedraw}?report=${encodeURIComponent(report.reportPublicId)}`}
            onClick={() => track('guardian_redraw_offer_clicked', { locale: report.locale, source: 'report_top' })}
          >
            {redrawContent.reportOffer.cta}
          </Link>
        </aside>

        <section className="mt-9 rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-5 shadow-2xl sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            {content.report.mapEyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{content.report.mapTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.report.mapBody}</p>
          <div className={`${styles.themeMap} mt-6 grid gap-3 sm:grid-cols-2`}>
            {narrative.sections.map((section) => (
              <article className="relative z-10 rounded-2xl border border-white/8 bg-[#1b1230] p-4" key={section.slot}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pink-200/75">
                  {section.label}
                </p>
                <h3 className="mt-1 text-sm font-bold text-white">{section.title}</h3>
                <p className="mt-2 text-xs leading-5 text-foreground-muted">{section.oneLine}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-accent/15 bg-accent/7 p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            {content.report.placementsEyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{content.report.placementsTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.report.placementsBody}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {placements.map((placement) => (
              <span
                className="rounded-full border border-white/10 bg-black/12 px-3 py-1.5 text-[11px] text-foreground-secondary"
                key={placement.label}
              >
                {placement.label}
                {placement.count > 1 && <strong className="ml-1.5 text-pink-200">×{placement.count}</strong>}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-8 space-y-8">
          {narrative.sections.map((section) => {
            const card = report.cards.find(({ slot }) => slot === section.slot)
            return (
              <article
                className="rounded-[2rem] border border-white/10 bg-[#120b24]/82 p-5 shadow-2xl backdrop-blur sm:p-7"
                key={section.slot}
              >
                <div className="grid items-start gap-5 sm:grid-cols-[8rem_1fr]">
                  {card && (
                    <Image
                      alt={section.artworkAlt}
                      className="mx-auto aspect-[3/4] w-32 rounded-2xl object-cover shadow-xl"
                      height={480}
                      src={card.artworkPath}
                      width={360}
                    />
                  )}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{section.label}</p>
                    <h2 className="mt-2 text-xl font-bold leading-7 text-white">{section.title}</h2>
                    <p className="mt-1 text-xs text-pink-200/80">{section.guardians}</p>
                    <p className="mt-4 text-sm font-semibold leading-6 text-pink-50">{section.oneLine}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white/4 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    {content.report.chartClues}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">{section.chart.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {section.chart.placements.map((placement) => (
                      <span
                        className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-foreground-subtle"
                        key={placement.body}
                      >
                        {placement.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {section.details.map((detail) => (
                    <section key={detail.title}>
                      <h3 className="text-sm font-bold text-white">{detail.title}</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground-muted">{detail.body}</p>
                    </section>
                  ))}
                </div>

                <aside className="mt-6 rounded-2xl border border-accent/15 bg-accent/8 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                    {content.report.guidance}
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-white">{section.guidance.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground-muted">
                    {section.guidance.body}
                  </p>
                </aside>
                <div className="mt-5 border-t border-white/8 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    {content.report.reflection}
                  </p>
                  <p className="mt-2 text-sm italic leading-7 text-foreground-secondary">{section.reflection}</p>
                </div>
              </article>
            )
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/4 p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            {content.report.actionEyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{content.report.actionTitle}</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2">
            {narrative.sections.map((section, index) => (
              <li className="rounded-2xl border border-white/8 bg-black/12 p-4" key={section.slot}>
                <span className="text-[10px] font-bold text-pink-200">0{index + 1}</span>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">{section.reflection}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="mt-8 rounded-[2rem] border border-pink-200/15 bg-[linear-gradient(145deg,rgba(255,193,214,0.1),rgba(201,168,255,0.08))] p-6 text-center sm:p-8"
          ref={closingRef}
        >
          <p aria-hidden className="text-2xl">
            {content.report.closingGlyph}
          </p>
          <h2 className="mt-3 text-xl font-bold text-white">{narrative.closing.title}</h2>
          {narrative.closing.body.map((paragraph) => (
            <p className="mt-3 text-sm leading-7 text-foreground-muted" key={paragraph}>
              {paragraph}
            </p>
          ))}
          {narrative.closing.personalNote && (
            <blockquote className="mt-5 rounded-2xl bg-black/15 px-4 py-4 text-left">
              <p className="text-[11px] font-semibold text-pink-200">{narrative.closing.personalNote.label}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground-secondary">
                {narrative.closing.personalNote.body}
              </p>
            </blockquote>
          )}
          <p className="mt-6 text-sm font-bold text-pink-50">{narrative.closing.action}</p>
        </section>
      </div>
    </main>
  )
}

type AccountSaveState = 'idle' | 'signing-in' | 'saving' | 'saved' | 'error'

function AccountSaveOffer({
  checkout,
  content,
  report,
}: {
  checkout: GuardianCheckoutSession | null
  content: GuardianReportPaidContent['report']['accountSave']
  report: FulfilledReport
}) {
  const { data: accountSession, isPending } = stellaAuthClient.useSession()
  const [state, setState] = useState<AccountSaveState>(checkout ? 'idle' : 'saved')
  const claimStarted = useRef(false)
  const intentKey = `stella.guardianClaimIntent.v1.${report.reportPublicId}`

  useEffect(() => {
    if (!checkout || !accountSession || claimStarted.current) return
    if (sessionStorage.getItem(intentKey) !== '1') return
    claimStarted.current = true
    void saveToAccount()
  }, [accountSession, checkout, intentKey])

  async function saveToAccount() {
    if (!checkout) return
    setState('saving')
    try {
      const result = await claimGuardianCollection(checkout)
      sessionStorage.removeItem(intentKey)
      clearGuardianCheckoutSession()
      const stableURL = new URL(window.location.href)
      stableURL.searchParams.set('report', report.reportPublicId)
      window.history.replaceState(null, '', `${stableURL.pathname}${stableURL.search}`)
      setState('saved')
      track('guardian_collection_claimed', {
        locale: report.locale,
        reward: result.reward,
        status: result.status,
      })
    } catch {
      claimStarted.current = false
      setState('error')
    }
  }

  async function beginSave() {
    if (!checkout || state === 'saving' || state === 'signing-in') return
    track('guardian_account_claim_start', { locale: report.locale, signed_in: Boolean(accountSession) })
    if (accountSession) {
      claimStarted.current = true
      await saveToAccount()
      return
    }

    setState('signing-in')
    sessionStorage.setItem(intentKey, '1')
    const callbackURL = `${window.location.pathname}?report=${encodeURIComponent(report.reportPublicId)}`
    const result = await stellaAuthClient.signIn.oauth2({
      providerId: SOBOK_OIDC_PROVIDER_ID,
      callbackURL,
      errorCallbackURL: callbackURL,
    })
    if (result.error) {
      sessionStorage.removeItem(intentKey)
      setState('error')
    }
  }

  const saved = state === 'saved'
  return (
    <aside className="mt-5 rounded-[2rem] border border-violet-200/20 bg-[linear-gradient(135deg,rgba(201,168,255,0.13),rgba(255,193,214,0.08))] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">{content.eyebrow}</p>
        <h2 className="mt-2 text-lg font-bold text-white">{saved ? content.savedTitle : content.title}</h2>
        <p className="mt-2 max-w-xl text-xs leading-6 text-foreground-muted">
          {saved ? content.savedBody : content.body}
        </p>
        {!saved && <p className="mt-2 text-xs font-semibold text-pink-100">{content.reward}</p>}
        {state === 'error' && (
          <p aria-live="polite" className="mt-2 text-xs leading-5 text-pink-200">
            {content.error}
          </p>
        )}
      </div>
      {saved ? (
        <Link
          className="mt-4 inline-flex w-full shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/7 px-5 py-3 text-xs font-bold text-pink-50 sm:mt-0 sm:w-auto"
          href={`/${report.locale}/account`}
        >
          {content.library}
        </Link>
      ) : (
        <button
          className="mt-4 w-full shrink-0 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground disabled:opacity-50 sm:mt-0 sm:w-auto"
          disabled={isPending || state === 'saving' || state === 'signing-in'}
          onClick={beginSave}
          type="button"
        >
          {state === 'saving' || state === 'signing-in'
            ? content.saving
            : accountSession
              ? content.save
              : content.signIn}
        </button>
      )}
    </aside>
  )
}

function placementSummary(sections: FulfilledReport['narrative']['sections']): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const section of sections) {
    for (const placement of section.chart.placements) {
      counts.set(placement.label, (counts.get(placement.label) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8)
}

function LoadingResult({ copy }: { copy: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
      <div className="text-center">
        <span aria-hidden className="text-3xl">
          ✦
        </span>
        <p className="mt-3 animate-pulse text-sm text-foreground-muted motion-reduce:animate-none">{copy}</p>
      </div>
    </main>
  )
}

function StatusIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-pink-200/20 bg-pink-100/10 text-2xl text-pink-100"
    >
      {children}
    </span>
  )
}

function LoadingDots() {
  return (
    <span
      aria-hidden
      className="mx-auto mt-6 block w-fit animate-pulse text-lg tracking-[0.35em] text-accent motion-reduce:animate-none"
    >
      •••
    </span>
  )
}

function reportErrorMessage(error: unknown, content: GuardianReportPaidContent): string {
  if (error instanceof GuardianApiError) {
    if (error.slug === 'forbidden' || error.slug === 'report-not-found') {
      return content.errors.reportUnavailable
    }
    if (error.slug === 'service-unavailable') {
      return content.errors.serviceUnavailable
    }
  }
  return content.errors.genericReport
}
