'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { track, trackEcommerce } from '@sobok/analytics/browser'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { big3, elementCounts, reliableBodies } from '@/chart/astrology'
import { ELEMENT_COLORS, ELEMENT_IDS } from '@/chart/data'
import { computeBirthChartAnalysis } from '@/chart/ephemeris'
import type { NatalChart, SignId } from '@/chart/types'
import { useBirthProfile } from '@/components/BirthProfileProvider'
import { SignFigure } from '@/components/SignFigure'
import Starfield from '@/components/Starfield'
import { TURNSTILE_SITE_KEY } from '@/constants'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import { toBirthInput } from '@/lib/birth-storage'
import {
  confirmGuardianPurchase,
  createGuardianCheckout,
  GUARDIAN_CHECKOUT_ACTION,
  GUARDIAN_CURRENCY,
  GUARDIAN_FREE_DELIVERABLES_KO,
  GUARDIAN_REPORT_ITEM,
  GUARDIAN_REPORT_NAME,
  GUARDIAN_REPORT_PRICE,
  GuardianApiError,
  type GuardianChartSnapshot,
  type GuardianCheckoutResponse,
  type GuardianCheckoutSession,
  GuardianCheckoutStorageError,
  type GuardianPreviewSession,
  guardianReportPaths,
  readGuardianCheckoutSession,
  readGuardianPreviewSession,
  resumeGuardianCheckout,
  storeGuardianCheckoutSession,
} from '@/lib/guardian-paid'

import GuardianStickyCta from '../../_components/GuardianStickyCta'
import styles from '../../guardian-report.module.css'

type BirthChartAnalysis = Awaited<ReturnType<typeof computeBirthChartAnalysis>>
type ChartState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'ready'; analysis: BirthChartAnalysis }

const SLOT_ORDER = ['self', 'love', 'work', 'choice'] as const

export default function GuardianFreeResult({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].landing
  const paths = guardianReportPaths(locale)
  const birthProfile = useBirthProfile()
  const [preview, setPreview] = useState<GuardianPreviewSession | null | undefined>(undefined)
  const [chartState, setChartState] = useState<ChartState>({ status: 'loading' })
  const [existingSession, setExistingSession] = useState<GuardianCheckoutSession | null | undefined>(undefined)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const turnstile = useRef<TurnstileInstance>(null)

  useEffect(() => {
    const storedPreview = readGuardianPreviewSession(locale)
    const storedCheckout = readGuardianCheckoutSession()
    const matchingCheckout = storedCheckout?.locale === locale ? storedCheckout : null
    setPreview(storedPreview)
    setExistingSession(matchingCheckout)
    if (matchingCheckout) {
      setEmail(matchingCheckout.email)
    }
    if (storedPreview) {
      track('guardian_free_result_view', { locale, movement: storedPreview.movement, tone: storedPreview.tone })
    }
  }, [locale])

  useEffect(() => {
    if (!birthProfile.hydrated) {
      return
    }
    if (!birthProfile.birth) {
      setChartState({ status: 'missing' })
      return
    }

    let cancelled = false
    setChartState({ status: 'loading' })
    void computeBirthChartAnalysis(toBirthInput(birthProfile.birth))
      .then((analysis) => {
        if (!cancelled) {
          setChartState({ status: 'ready', analysis })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChartState({ status: 'failed' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [birthProfile.birth, birthProfile.hydrated])

  const price = formatPrice(locale)

  function openCheckout() {
    setError(null)
    setCheckoutOpen(true)
    track('guardian_paywall_open', { locale })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!turnstileToken || submitting || existingSession === undefined) {
      return
    }
    if (!existingSession && !preview) {
      setError(content.errors.answerRequired)
      return
    }
    if (!existingSession && chartState.status !== 'ready') {
      setError(content.errors.chartUnavailable)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const normalizedEmail = email.trim()
      let checkout: GuardianCheckoutResponse
      if (existingSession) {
        checkout = await resumeGuardianCheckout(existingSession, { email: normalizedEmail, turnstileToken })
      } else {
        if (!preview || chartState.status !== 'ready' || !birthProfile.birth) {
          throw new Error('Guardian checkout context changed before submission')
        }
        checkout = await createGuardianCheckout({
          locale,
          email: normalizedEmail,
          turnstileToken,
          chart: toCheckoutChart(
            chartState.analysis.chart,
            birthProfile.birth.timeKnown,
            chartState.analysis.unknownTime?.moonLongitudeRange ?? null,
          ),
          previewAnswers: { tone: preview.tone, movement: preview.movement },
        })
      }

      trackEcommerce('begin_checkout', {
        currency: checkout.payment.currency,
        value: checkout.payment.amount,
        items: [GUARDIAN_REPORT_ITEM],
      })

      const session = checkoutSession(checkout, existingSession, normalizedEmail, locale)
      storeGuardianCheckoutSession(session)
      setExistingSession(session)

      const questionsUrl = `${window.location.origin}${paths.questions}`
      if (checkout.payment.status === 'paid') {
        window.location.assign(questionsUrl)
        return
      }

      const { requestPayment } = await import('@portone/browser-sdk/v2')
      const result = await requestPayment({
        channelKey: checkout.payment.channelKey,
        currency: checkout.payment.currency,
        customer: { email: normalizedEmail },
        forceRedirect: true,
        orderName: checkout.payment.orderName,
        paymentId: checkout.payment.paymentId,
        payMethod: checkout.payment.payMethod,
        redirectUrl: questionsUrl,
        storeId: checkout.payment.storeId,
        totalAmount: checkout.payment.amount,
      })

      if (result?.code != null) {
        const confirmation = await confirmGuardianPurchase(session).catch(() => null)
        if (confirmation?.status === 'paid') {
          window.location.assign(questionsUrl)
          return
        }
        track('guardian_payment_interrupted', { code: result.code, locale })
        setError(result.message || content.errors.paymentInterrupted)
        return
      }

      window.location.assign(questionsUrl)
    } catch (caught) {
      setError(checkoutErrorMessage(caught, content.errors))
    } finally {
      setSubmitting(false)
      setTurnstileToken('')
      turnstile.current?.reset()
    }
  }

  if (preview === undefined || existingSession === undefined) {
    return <LoadingResult copy={content.freeResult.states.chartLoading} />
  }

  if (!preview && !existingSession) {
    return (
      <ResultShell locale={locale}>
        <section className="mx-auto mt-[10vh] max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-7 text-center shadow-2xl backdrop-blur">
          <span aria-hidden className="text-3xl text-pink-100">
            ☾
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">{content.freeResult.states.missingTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.freeResult.states.missingBody}</p>
          <Link
            className="mt-6 block rounded-2xl cta bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
            href={paths.free}
          >
            {content.freeResult.states.missingCta}
          </Link>
        </section>
      </ResultShell>
    )
  }

  return (
    <ResultShell locale={locale}>
      {existingSession && !checkoutOpen && (
        <section className="mx-auto mb-5 max-w-3xl rounded-3xl border border-accent/20 bg-accent/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              {content.resume.eyebrow}
            </p>
            <h2 className="mt-1 text-base font-bold text-white">{content.resume.title}</h2>
            <p className="mt-1 text-xs leading-5 text-foreground-muted">{content.resume.body}</p>
          </div>
          <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">
            <Link
              className="rounded-full cta bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              href={paths.questions}
            >
              {content.resume.reportCta}
            </Link>
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-foreground-secondary"
              onClick={openCheckout}
              type="button"
            >
              {content.resume.paymentCta}
            </button>
          </div>
        </section>
      )}

      {checkoutOpen ? (
        <CheckoutPanel
          content={content}
          email={email}
          error={error}
          locale={locale}
          onClose={() => setCheckoutOpen(false)}
          onEmailChange={setEmail}
          onSubmit={submitCheckout}
          onTurnstileExpire={() => setTurnstileToken('')}
          onTurnstileSuccess={setTurnstileToken}
          price={price}
          submitting={submitting}
          tokenReady={turnstileToken.length > 0}
          turnstile={turnstile}
        />
      ) : preview ? (
        <FreeResultReading
          chartState={chartState}
          content={content}
          locale={locale}
          onCheckout={openCheckout}
          preview={preview}
          price={price}
        />
      ) : (
        <section className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-7 text-center">
          <h1 className="text-xl font-bold text-white">{content.resume.title}</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.resume.body}</p>
          <Link
            className="mt-6 block rounded-2xl cta bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
            href={paths.questions}
          >
            {content.resume.reportCta}
          </Link>
        </section>
      )}
    </ResultShell>
  )
}

function ResultShell({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].landing
  const paths = guardianReportPaths(locale)

  return (
    <main className="relative min-h-dvh bg-night-sky px-4 pb-[calc(5.5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-6">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <Link
          className="mb-6 inline-flex items-center gap-2 text-xs text-foreground-subtle transition hover:text-white"
          href={paths.free}
        >
          <span aria-hidden>←</span>
          {content.navigation.backToFree}
        </Link>
        {children}
      </div>
    </main>
  )
}

function LoadingResult({ copy }: { copy: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-night-sky px-4 text-foreground">
      <div className="text-center">
        <span aria-hidden className="text-3xl text-pink-100">
          ✦
        </span>
        <p className="mt-3 animate-pulse text-sm text-foreground-muted motion-reduce:animate-none">{copy}</p>
      </div>
    </main>
  )
}

/** Reading body, at the size Korean wants on a phone. The `sm` step up is for the wider column, not the card. */
const PROSE = 'text-[0.9375rem] leading-[1.75] text-foreground-muted sm:text-base sm:leading-[1.8]'

function FreeResultReading({
  chartState,
  content,
  locale,
  onCheckout,
  preview,
  price,
}: {
  chartState: ChartState
  content: (typeof GUARDIAN_REPORT_UI)[Locale]['landing']
  locale: Locale
  onCheckout: () => void
  preview: GuardianPreviewSession
  price: string
}) {
  const freeResult = content.freeResult
  const toneInsight = freeResult.reading.toneInsights[preview.tone]
  const movementInsight = freeResult.reading.movementInsights[preview.movement]
  const paywallRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const unlockRef = useRef<HTMLButtonElement>(null)
  const [heroGone, setHeroGone] = useState(false)
  const [unlockOnScreen, setUnlockOnScreen] = useState(false)

  useEffect(() => {
    const paywall = paywallRef.current
    if (!paywall) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }
        track('guardian_free_paywall_view', { locale, movement: preview.movement, tone: preview.tone })
        observer.disconnect()
      },
      { threshold: 0.15 },
    )

    observer.observe(paywall)
    return () => observer.disconnect()
  }, [locale, preview.movement, preview.tone])

  // The bar stands in for the unlock button while it is off screen — so it arrives once the hero is gone and
  // steps aside again when the real button is in view, rather than sitting on top of it.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) {
      return
    }

    const observer = new IntersectionObserver(([entry]) => setHeroGone(!entry.isIntersecting))
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const unlock = unlockRef.current
    if (!unlock) {
      setUnlockOnScreen(false)
      return
    }

    const observer = new IntersectionObserver(([entry]) => setUnlockOnScreen(entry.isIntersecting))
    observer.observe(unlock)
    return () => observer.disconnect()
  }, [chartState.status])

  return (
    // Below `sm` the page itself is the document: no frame, so every line keeps the full column. The card is
    // an `sm` affordance, where the column is wider than the text wants to be anyway.
    <article className="sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-pink-200/15 sm:bg-[#120b24]/90 sm:shadow-2xl sm:backdrop-blur">
      <header className="sm:p-8" ref={heroRef}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{freeResult.hero.eyebrow}</p>
        <h1 className="mt-3 text-balance text-[1.75rem] font-black leading-[1.25] text-white sm:text-3xl">
          {freeResult.hero.title}
        </h1>
        <p className={`mt-3 ${PROSE}`}>{freeResult.hero.body}</p>

        <blockquote className="mt-6 rounded-3xl border border-pink-200/18 bg-[linear-gradient(145deg,rgba(255,193,214,0.13),rgba(201,168,255,0.07))] px-5 py-5 text-[1.0625rem] font-semibold leading-[1.7] text-pink-50 sm:px-7 sm:py-6 sm:text-lg">
          <span aria-hidden className="mb-2 block text-lg text-pink-200">
            ✦
          </span>
          {freeResult.hero.toneLines[preview.tone]} {freeResult.hero.movementLines[preview.movement]}
        </blockquote>
      </header>

      <section
        aria-labelledby="guardian-free-reading-title"
        className="mt-9 border-t border-white/8 pt-9 sm:mt-0 sm:px-8 sm:py-10"
      >
        <SectionHeading
          eyebrow={freeResult.reading.eyebrow}
          id="guardian-free-reading-title"
          title={freeResult.reading.title}
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-3">
          <InsightBlock eyebrow={freeResult.reading.toneLabel} insight={toneInsight} />
          <InsightBlock eyebrow={freeResult.reading.movementLabel} insight={movementInsight} />
        </div>
      </section>

      <ChartClue chartState={chartState} content={freeResult} locale={locale} movementLabel={movementInsight.label} />

      <section
        aria-labelledby="guardian-free-action-title"
        className="mt-9 border-t border-white/8 pt-9 sm:mt-0 sm:bg-[linear-gradient(145deg,rgba(255,193,214,0.08),rgba(201,168,255,0.04))] sm:px-8 sm:py-10"
      >
        <SectionHeading
          eyebrow={freeResult.action.eyebrow}
          id="guardian-free-action-title"
          title={freeResult.action.title}
        />
        <div className={`${styles.accentBlock} mt-6`}>
          <p className="text-[1.0625rem] font-bold leading-[1.65] text-white">
            {freeResult.action.actions[preview.movement][preview.tone]}
          </p>
        </div>
        <div className={`${styles.quietBlock} mt-5`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            {freeResult.action.reflectionLabel}
          </p>
          <p className={`mt-1.5 ${PROSE}`}>{freeResult.action.reflections[preview.movement]}</p>
        </div>
      </section>

      <section
        aria-labelledby="guardian-free-paywall-title"
        className="mt-9 border-t border-white/8 pt-9 sm:mt-0 sm:bg-black/15 sm:px-8 sm:py-10"
        ref={paywallRef}
      >
        <SectionHeading
          body={freeResult.paywall.body}
          eyebrow={freeResult.paywall.eyebrow}
          id="guardian-free-paywall-title"
          title={freeResult.paywall.titles[preview.movement]}
        />

        {/* One real card above the four sealed slots. The four slots say "there are four"; only the artwork
            says what a card actually is, and this page carried no picture at all. It leads rather than sits
            beside them because a 3:4 card and a row of 3:4 slots cannot be made the same height without
            cropping the one thing here that is meant to be seen whole. */}
        <figure className="m-0 mt-7">
          <Image
            alt=""
            className="mx-auto w-36 rounded-2xl border border-white/15 shadow-[0_18px_44px_rgba(2,0,12,0.5)] sm:w-40"
            height={480}
            sizes="(min-width: 640px) 10rem, 9rem"
            src="/images/zodiac-guardians/aries-love-stella.webp"
            width={360}
          />
          <figcaption className="mt-2.5 text-center text-[10px] font-semibold text-foreground-subtle">
            {freeResult.paywall.sampleLabel}
          </figcaption>
        </figure>

        <ul className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={freeResult.paywall.lockedTitle}>
          {SLOT_ORDER.map((slot) => (
            <li key={slot}>
              <div className={styles.sealedCard}>
                <span className="relative z-10 text-base">{freeResult.paywall.slots[slot].glyph}</span>
              </div>
              <p className="mt-1.5 text-center text-[10px] font-semibold text-foreground-subtle">
                {freeResult.paywall.slots[slot].label}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-[10px] font-semibold text-foreground-faint">
          {freeResult.paywall.sealedLabel}
        </p>

        <div className="mt-8">
          <h2 className="text-sm font-bold text-white">{freeResult.paywall.lockedTitle}</h2>
          <div className="mt-4 grid gap-0 sm:grid-cols-2 sm:gap-2">
            {freeResult.paywall.lockedItems.map((item) => (
              <article className={`${styles.listBlock} relative`} key={item.title}>
                <h3 className="text-xs font-bold text-foreground-secondary">{item.title}</h3>
                <p className={`${styles.lockedCopy} mt-1.5 text-xs leading-5 text-foreground-subtle`}>{item.preview}</p>
              </article>
            ))}
          </div>
        </div>

        <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label={content.purchase.title}>
          {content.purchase.includes.map((item) => (
            <li
              className="rounded-full border border-pink-100/12 bg-pink-100/7 px-3 py-1.5 text-[10px] font-semibold text-pink-50/80"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>

        {chartState.status === 'ready' ? (
          <button
            className="mt-6 w-full rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-5 py-4 text-sm font-bold text-[#24142e] shadow-[0_14px_40px_rgba(255,193,214,0.18)] cta"
            onClick={onCheckout}
            ref={unlockRef}
            type="button"
          >
            {freeResult.paywall.unlock}
            <span className="ml-2 opacity-65">· {price}</span>
          </button>
        ) : null}

        {/* The three things this free run already handed over. This is what makes the withdrawal limitation
            in the refund policy stand up under 전자상거래법 §17(6) — that clause names the same three, from the
            same constant — and it also reminds a reader what they got before being asked for money. */}
        <p className="mt-4 text-center text-[10px] leading-4 text-foreground-faint">
          {GUARDIAN_FREE_DELIVERABLES_KO.join(' · ')}
        </p>
      </section>

      <GuardianStickyCta
        cta={freeResult.paywall.unlockShort}
        note={freeResult.paywall.unlockNote}
        price={price}
        onSelect={onCheckout}
        visible={chartState.status === 'ready' && heroGone && !unlockOnScreen}
      />
    </article>
  )
}

function SectionHeading({ body, eyebrow, id, title }: { body?: string; eyebrow: string; id: string; title: string }) {
  return (
    <header>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-xl font-black leading-[1.4] text-white" id={id}>
        {title}
      </h2>
      {body ? <p className={`mt-2.5 ${PROSE}`}>{body}</p> : null}
    </header>
  )
}

function InsightBlock({
  eyebrow,
  insight,
}: {
  eyebrow: string
  insight: { label: string; title: string; body: string }
}) {
  return (
    <article className={styles.listBlock}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">{eyebrow}</p>
        <span className="shrink-0 rounded-full bg-pink-100/9 px-2.5 py-1 text-[10px] font-semibold text-pink-100">
          {insight.label}
        </span>
      </div>
      <h3 className="mt-3 text-base font-bold leading-[1.5] text-white">{insight.title}</h3>
      <p className={`mt-2 ${PROSE}`}>{insight.body}</p>
    </article>
  )
}

function ChartClue({
  chartState,
  content,
  locale,
  movementLabel,
}: {
  chartState: ChartState
  content: (typeof GUARDIAN_REPORT_UI)[Locale]['landing']['freeResult']
  locale: Locale
  movementLabel: string
}) {
  const t = useTranslations('Constellation')
  const heading = (
    <SectionHeading eyebrow={content.chart.eyebrow} id="guardian-chart-clue-title" title={content.chart.title} />
  )
  const shell = 'mt-9 border-t border-white/8 pt-9 sm:mt-0 sm:px-8 sm:py-10'

  if (chartState.status === 'loading') {
    return (
      <section className={`min-h-64 ${shell}`}>
        {heading}
        <p className="mt-8 animate-pulse text-center text-xs text-foreground-subtle motion-reduce:animate-none">
          {content.states.chartLoading}
        </p>
      </section>
    )
  }

  if (chartState.status === 'missing' || chartState.status === 'failed') {
    return (
      <section className={shell}>
        {heading}
        <div className="mt-6 rounded-3xl border border-accent/20 bg-accent/8 p-5 text-center">
          <h3 className="text-sm font-bold text-white">{content.states.chartRequiredTitle}</h3>
          <p className="mt-2 text-xs leading-6 text-foreground-muted">{content.states.chartRequiredBody}</p>
          <Link
            className="mt-4 inline-flex rounded-full cta bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground"
            href={`/${locale}`}
          >
            {content.states.chartRequiredCta}
          </Link>
        </div>
      </section>
    )
  }

  const { chart, unknownTime } = chartState.analysis
  const { sunSign, moonSign, risingSign } = big3(chart)
  const moonSigns = unknownTime?.moonSigns ?? (moonSign ? [moonSign] : [])
  const moonUncertain = moonSigns.length > 1
  const counts = elementCounts(reliableBodies(chart.planets, moonUncertain))
  const dominant = ELEMENT_IDS.reduce((best, element) => (counts[element] > counts[best] ? element : best))
  const total = ELEMENT_IDS.reduce((sum, element) => sum + counts[element], 0)
  const elementInsight = content.chart.elements[dominant]
  // A figure only where one sign is certain: an unknown rising has none, and a Moon that crossed a boundary
  // has two, so drawing either one would claim a precision the chart does not have.
  const placements: { label: string; sign: SignId | null; value: string }[] = [
    { label: content.chart.sunLabel, sign: sunSign ?? null, value: sunSign ? t(`signs.${sunSign}`) : '—' },
    {
      label: moonUncertain ? content.chart.moonRangeLabel : content.chart.moonLabel,
      sign: moonSigns.length === 1 ? moonSigns[0] : null,
      value: moonSigns.length > 0 ? moonSigns.map((sign) => t(`signs.${sign}`)).join(' / ') : '—',
    },
    {
      label: content.chart.risingLabel,
      sign: risingSign ?? null,
      value: risingSign ? t(`signs.${risingSign}`) : content.chart.risingUnknown,
    },
  ]

  return (
    <section aria-labelledby="guardian-chart-clue-title" className={shell}>
      {heading}

      <dl className="mt-6 grid grid-cols-3 gap-2">
        {placements.map((placement) => (
          <div className="rounded-2xl border border-white/8 bg-white/3 px-2 py-4 text-center" key={placement.label}>
            <dt className="text-[10px] font-semibold text-foreground-subtle">{placement.label}</dt>
            <dd className="mt-1.5">
              {placement.sign ? <SignFigure className="mx-auto h-14 w-14" sign={placement.sign} /> : null}
              <span className="mt-1 block text-[0.8125rem] font-bold leading-5 text-white">{placement.value}</span>
            </dd>
          </div>
        ))}
      </dl>

      <figure className="m-0 mt-6">
        <figcaption className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          {content.chart.balanceLabel}
        </figcaption>
        {/* One strip for the proportion, one legend row for the counts. Four tracks spent ~110px saying what
            a share-of-whole reading needs a single bar to say; the counts are the part worth keeping, so
            they move into the legend rather than disappearing. */}
        <div aria-hidden className="mt-2.5 flex h-3 overflow-hidden rounded-full bg-white/8">
          {ELEMENT_IDS.map((element) => (
            <span
              key={element}
              style={{
                background: ELEMENT_COLORS[element],
                opacity: element === dominant ? 1 : 0.5,
                width: `${total > 0 ? (counts[element] / total) * 100 : 0}%`,
              }}
            />
          ))}
        </div>
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {ELEMENT_IDS.map((element) => (
            <div className="flex items-center gap-1.5" key={element}>
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: ELEMENT_COLORS[element], opacity: element === dominant ? 1 : 0.5 }}
              />
              <dt className={element === dominant ? 'text-xs font-bold text-white' : 'text-xs text-foreground-subtle'}>
                {content.chart.elements[element].label}
              </dt>
              <dd className="text-xs tabular-nums text-foreground-subtle">{counts[element]}</dd>
            </div>
          ))}
        </dl>
      </figure>

      <div className={`${styles.accentBlock} mt-6`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          {content.chart.dominantLabel} · {elementInsight.label}
        </p>
        <h3 className="mt-2 text-base font-bold leading-[1.5] text-white">{elementInsight.title}</h3>
        <p className={`mt-2.5 ${PROSE}`}>{elementInsight.body}</p>
      </div>

      <div className={`${styles.quietBlock} mt-5`}>
        <p className="text-[0.8125rem] leading-[1.7] text-pink-50/85">
          {content.chart.bridge(movementLabel, elementInsight.label)}
        </p>
      </div>
    </section>
  )
}

function CheckoutPanel({
  content,
  email,
  error,
  locale,
  onClose,
  onEmailChange,
  onSubmit,
  onTurnstileExpire,
  onTurnstileSuccess,
  price,
  submitting,
  tokenReady,
  turnstile,
}: {
  content: (typeof GUARDIAN_REPORT_UI)[Locale]['landing']
  email: string
  error: string | null
  locale: Locale
  onClose: () => void
  onEmailChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onTurnstileExpire: () => void
  onTurnstileSuccess: (token: string) => void
  price: string
  submitting: boolean
  tokenReady: boolean
  turnstile: React.RefObject<TurnstileInstance | null>
}) {
  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border border-pink-200/15 bg-[#120b24]/94 p-5 shadow-2xl backdrop-blur sm:p-8">
      <button className="text-xs text-foreground-subtle hover:text-white" onClick={onClose} type="button">
        ← {content.checkout.close}
      </button>
      <h1 className="mt-5 text-2xl font-black text-white">{content.checkout.title}</h1>
      <p className="mt-3 text-sm leading-7 text-foreground-muted">{content.checkout.body}</p>

      {/* 전자상거래법 §13(2): the product name, the price and how it is delivered, stated before the contract
          forms rather than only on the receipt. */}
      <dl className="mt-6 rounded-2xl border border-white/8 bg-white/3 p-4 text-xs">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
          {content.checkout.orderTitle}
        </p>
        {(
          [
            [content.checkout.orderProductLabel, GUARDIAN_REPORT_NAME.ko],
            [content.checkout.orderPriceLabel, price],
            [content.checkout.orderDeliveryLabel, content.checkout.orderDeliveryValue],
          ] as const
        ).map(([label, value]) => (
          <div className="flex gap-3 py-1" key={label}>
            <dt className="w-20 shrink-0 text-foreground-subtle">{label}</dt>
            <dd className="flex-1 leading-5 text-foreground-secondary">{value}</dd>
          </div>
        ))}
      </dl>

      <form className="mt-5" onSubmit={onSubmit}>
        <label className="block text-xs font-semibold text-foreground-secondary" htmlFor="guardian-recovery-email">
          {content.checkout.emailLabel}
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3.5 text-sm text-white outline-none placeholder:text-foreground-faint focus:border-pink-200/45 focus:ring-2 focus:ring-pink-200/10"
          id="guardian-recovery-email"
          maxLength={254}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={content.checkout.emailPlaceholder}
          required
          type="email"
          value={email}
        />
        <p className="mt-2 text-[11px] leading-5 text-foreground-faint">{content.checkout.emailHint}</p>

        <div className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-3">
          <Turnstile
            onExpire={onTurnstileExpire}
            onSuccess={onTurnstileSuccess}
            options={{ action: GUARDIAN_CHECKOUT_ACTION, language: LOCALE_LANGUAGE_TAGS[locale], theme: 'dark' }}
            ref={turnstile}
            siteKey={TURNSTILE_SITE_KEY}
          />
          <p className="mt-2 text-center text-[10px] text-foreground-faint">{content.checkout.securityHint}</p>
        </div>

        {/* 전자상거래법 §8(2) asks for confirmation of the order's terms before the contract forms, and the
            withdrawal limitation in the refund policy only holds if the buyer agreed to it here. Native
            `required` checkboxes, so the browser blocks submission and points at the missing one. */}
        <fieldset className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-4">
          <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
            {content.checkout.consentTitle}
          </legend>
          <div className="grid gap-3">
            {(
              [
                ['age', content.checkout.consentAge],
                ['privacy', content.checkout.consentPrivacy],
                ['withdrawal', content.checkout.consentWithdrawal],
              ] as const
            ).map(([id, label]) => (
              <label className="flex cursor-pointer gap-2.5 text-[11px] leading-5 text-foreground-secondary" key={id}>
                <input
                  className="mt-0.5 size-4 shrink-0 accent-pink-300"
                  name={`guardian-consent-${id}`}
                  required
                  type="checkbox"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-foreground-faint">{content.checkout.minorNotice}</p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
            {content.checkout.docLinks.map(({ label, path }) => (
              <Link
                className="text-foreground-subtle underline underline-offset-2 hover:text-white"
                href={`/${locale}/${path}`}
                key={path}
                rel="noopener"
                target="_blank"
              >
                {label}
              </Link>
            ))}
          </p>
        </fieldset>

        {error && (
          <p aria-live="polite" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs leading-5 text-pink-200">
            {error}
          </p>
        )}

        <button
          className="mt-5 w-full rounded-2xl cta bg-primary px-5 py-4 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-45"
          disabled={!tokenReady || submitting}
          type="submit"
        >
          {submitting ? content.checkout.submitting : content.checkout.submit}
          {!submitting && <span className="ml-2 opacity-70">· {price}</span>}
        </button>
      </form>
    </section>
  )
}

function toCheckoutChart(
  chart: NatalChart,
  timeKnown: boolean,
  moonLongitudeRange: readonly [start: number, end: number] | null,
): GuardianChartSnapshot {
  return {
    timeKnown,
    planets: chart.planets.map(({ id, lon, retrograde }) => ({ id, lon, retrograde })),
    ascendant: timeKnown ? chart.ascendant : null,
    midheaven: timeKnown ? chart.midheaven : null,
    cusps: timeKnown ? chart.cusps : null,
    moonLongitudeRange: timeKnown ? null : moonLongitudeRange,
  }
}

function checkoutSession(
  checkout: GuardianCheckoutResponse,
  existing: GuardianCheckoutSession | null,
  email: string,
  locale: Locale,
): GuardianCheckoutSession {
  const accessToken = checkout.guest.accessToken ?? existing?.accessToken
  if (!accessToken) {
    throw new Error('Guardian checkout did not return an access token')
  }
  return {
    locale,
    collectionPublicId: checkout.guest.collectionPublicId,
    reportPublicId: checkout.guest.reportPublicId,
    accessToken,
    paymentId: checkout.payment.paymentId,
    email,
    createdAt: existing?.createdAt ?? Date.now(),
  }
}

function checkoutErrorMessage(
  error: unknown,
  content: (typeof GUARDIAN_REPORT_UI)[Locale]['landing']['errors'],
): string {
  if (error instanceof GuardianCheckoutStorageError) {
    return content.storage
  }
  if (error instanceof GuardianApiError) {
    if (error.slug === 'turnstile-expired' || error.slug === 'turnstile-failed') {
      return content.turnstile
    }
    if (error.slug === 'rate-limited') {
      return content.rateLimited
    }
    if (error.slug === 'service-unavailable') {
      return content.serviceUnavailable
    }
  }
  return content.genericCheckout
}

function formatPrice(locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[locale], {
    style: 'currency',
    currency: GUARDIAN_CURRENCY,
    maximumFractionDigits: 0,
  }).format(GUARDIAN_REPORT_PRICE)
}
