'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { track, trackEcommerce } from '@sobok/analytics/browser'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { computeBirthChartAnalysis } from '@/chart/ephemeris'
import type { NatalChart } from '@/chart/types'
import { useBirthProfile } from '@/components/BirthProfileProvider'
import Starfield from '@/components/Starfield'
import { TURNSTILE_SITE_KEY } from '@/constants'
import {
  GUARDIAN_REPORT_UI,
  type GuardianPreviewMovement,
  type GuardianPreviewTone,
} from '@/content/guardian-report-ui'
import { toBirthInput } from '@/lib/birth-storage'
import {
  confirmGuardianPurchase,
  createGuardianCheckout,
  GUARDIAN_CHECKOUT_ACTION,
  GuardianApiError,
  type GuardianChartSnapshot,
  type GuardianCheckoutResponse,
  type GuardianCheckoutSession,
  GuardianCheckoutStorageError,
  type GuardianProductCatalog,
  getGuardianProductCatalog,
  readGuardianCheckoutSession,
  resumeGuardianCheckout,
  storeGuardianCheckoutSession,
} from '@/lib/guardian-paid'

import styles from './guardian-report.module.css'

type BirthChartAnalysis = Awaited<ReturnType<typeof computeBirthChartAnalysis>>
type ChartState = { status: 'loading' | 'missing' | 'failed' } | { status: 'ready'; analysis: BirthChartAnalysis }

type FlowStage = 'overview' | 'tone' | 'movement' | 'preview' | 'checkout'

const SLOT_ORDER = ['self', 'love', 'work', 'choice'] as const

export default function GuardianReportLanding({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].landing
  const birthProfile = useBirthProfile()
  const [stage, setStage] = useState<FlowStage>('overview')
  const [tone, setTone] = useState<GuardianPreviewTone | null>(null)
  const [movement, setMovement] = useState<GuardianPreviewMovement | null>(null)
  const [chartState, setChartState] = useState<ChartState>({ status: 'loading' })
  const [catalog, setCatalog] = useState<GuardianProductCatalog | null>(null)
  const [existingSession, setExistingSession] = useState<GuardianCheckoutSession | null | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flowRef = useRef<HTMLElement>(null)
  const productRef = useRef<HTMLElement>(null)
  const turnstile = useRef<TurnstileInstance>(null)

  useEffect(() => {
    const session = readGuardianCheckoutSession()
    const matchingSession = session?.locale === locale ? session : null
    setExistingSession(matchingSession)
    if (matchingSession) {
      setEmail(matchingSession.email)
    }

    void getGuardianProductCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(null))
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

  useEffect(() => {
    if (stage === 'overview') {
      return
    }
    flowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [stage])

  const fullReport = catalog?.products.find(({ kind }) => kind === 'full_report')
  const price = fullReport?.prices.find(({ market, currency }) => market === 'KR' && currency === 'KRW')
  const loveOdds = catalog?.loveDraw.pools.at(0)?.rarities ?? []

  function startPreview() {
    setStage('tone')
    setError(null)
    track('guardian_preview_started', { locale })
  }

  function continueFromTone() {
    if (!tone) {
      return
    }
    setStage('movement')
  }

  function showPreview() {
    if (!tone || !movement) {
      setError(content.errors.answerRequired)
      return
    }
    setError(null)
    setStage('preview')
    track('guardian_preview_complete', { locale, movement, tone })
  }

  function openCheckout() {
    setError(null)
    setStage('checkout')
    track('guardian_paywall_open', { locale })
  }

  async function submitCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!turnstileToken || submitting || existingSession === undefined) {
      return
    }
    if (!existingSession && (!tone || !movement)) {
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
        if (!tone || !movement || chartState.status !== 'ready' || !birthProfile.birth) {
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
          previewAnswers: { tone, movement },
        })
      }

      trackEcommerce('begin_checkout', {
        currency: checkout.payment.currency,
        value: checkout.payment.amount,
        items: [
          {
            item_id: checkout.payment.sku,
            item_name: checkout.payment.orderName,
            price: checkout.payment.amount,
            quantity: 1,
          },
        ],
      })

      const session = checkoutSession(checkout, existingSession, normalizedEmail, locale)
      storeGuardianCheckoutSession(session)
      setExistingSession(session)

      const cardsUrl = `${window.location.origin}/${locale}/cards`
      if (checkout.payment.status === 'paid') {
        window.location.assign(cardsUrl)
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
        redirectUrl: cardsUrl,
        storeId: checkout.payment.storeId,
        totalAmount: checkout.payment.amount,
      })

      if (result?.code != null) {
        const confirmation = await confirmGuardianPurchase(session).catch(() => null)
        if (confirmation?.status === 'paid') {
          window.location.assign(cardsUrl)
          return
        }
        track('guardian_payment_interrupted', { code: result.code, locale })
        setError(result.message || content.errors.paymentInterrupted)
        return
      }

      window.location.assign(cardsUrl)
    } catch (caught) {
      setError(checkoutErrorMessage(caught, content.errors))
    } finally {
      setSubmitting(false)
      setTurnstileToken('')
      turnstile.current?.reset()
    }
  }

  return (
    <main
      className={`${styles.page} relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(4.5rem+var(--safe-area-top))] text-foreground sm:px-4`}
    >
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 text-xs text-foreground-subtle transition hover:text-white"
          href={`/${locale}`}
        >
          <span aria-hidden>←</span>
          {content.back}
        </Link>

        {existingSession && (
          <section className="mx-auto mt-5 max-w-3xl rounded-3xl border border-accent/20 bg-accent/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                {content.resume.eyebrow}
              </p>
              <h2 className="mt-1 text-base font-bold text-white">{content.resume.title}</h2>
              <p className="mt-1 text-xs leading-5 text-foreground-muted">{content.resume.body}</p>
            </div>
            <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">
              <Link
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                href={`/${locale}/cards`}
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

        <section className="grid items-center gap-6 pb-14 pt-9 lg:grid-cols-[1fr_0.88fr] lg:gap-12 lg:pb-24 lg:pt-16">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">{content.hero.eyebrow}</p>
            <h1 className="mt-4 whitespace-pre-line text-balance text-4xl font-black leading-[1.13] text-white sm:text-5xl">
              {content.hero.title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-foreground-muted sm:text-base sm:leading-8 lg:mx-0">
              {content.hero.body}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <button
                className="rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-6 py-4 text-sm font-bold text-[#24142e] shadow-[0_14px_40px_rgba(255,193,214,0.2)] transition hover:-translate-y-0.5"
                onClick={startPreview}
                type="button"
              >
                {content.hero.cta}
              </button>
              <button
                className="rounded-2xl border border-white/12 bg-white/4 px-6 py-4 text-sm font-semibold text-foreground-secondary transition hover:border-white/25 hover:text-white"
                onClick={() => productRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                type="button"
              >
                {content.hero.secondaryCta}
              </button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-foreground-subtle lg:justify-start">
              {content.hero.trustItems.map((item) => (
                <li className="before:mr-1.5 before:text-pink-200 before:content-['✓']" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.heroCards}>
            <Image
              alt=""
              className={`${styles.heroCard} ${styles.heroCardLeft}`}
              height={640}
              loading="eager"
              src="/images/zodiac-guardians/cancer-self.webp"
              width={480}
            />
            <Image
              alt=""
              className={`${styles.heroCard} ${styles.heroCardRight}`}
              height={640}
              loading="eager"
              src="/images/zodiac-guardians/taurus-work.webp"
              width={480}
            />
            <Image
              alt={content.hero.sampleLabel}
              className={`${styles.heroCard} ${styles.heroCardFront}`}
              height={640}
              priority
              src="/images/zodiac-guardians/aries-love-stella.webp"
              width={480}
            />
            <span className="absolute bottom-[3%] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#211431]/90 px-3 py-1.5 text-[10px] font-semibold text-pink-100 shadow-xl backdrop-blur">
              {content.hero.sampleLabel}
            </span>
          </div>
        </section>

        <section className="scroll-mt-24 border-y border-white/8 py-14 sm:py-20" ref={productRef}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
              {content.product.eyebrow}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.product.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-foreground-muted">{content.product.body}</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {content.product.items.map((item) => (
              <article className="rounded-3xl border border-white/9 bg-white/4 p-5 sm:p-6" key={item.title}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-pink-100/10 text-lg text-pink-100">
                  {item.glyph}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
              {content.process.eyebrow}
            </p>
            <h2 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.process.title}</h2>
          </div>
          <ol className="relative mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {content.process.steps.map((step) => (
              <li className="rounded-3xl border border-white/9 bg-[#120b24]/76 p-5" key={step.number}>
                <p className="text-[10px] font-bold tracking-[0.2em] text-pink-200/75">{step.number}</p>
                <h3 className="mt-2 text-base font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="scroll-mt-24 pb-16 sm:pb-24" ref={flowRef}>
          {stage === 'overview' ? (
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-pink-200/15 bg-[linear-gradient(145deg,rgba(255,193,214,0.1),rgba(201,168,255,0.07))] p-6 text-center shadow-2xl sm:p-9">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
                {content.quiz.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">{content.quiz.title}</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-foreground-muted">{content.quiz.body}</p>
              <button
                className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-primary-foreground sm:w-auto sm:min-w-64"
                onClick={startPreview}
                type="button"
              >
                {content.hero.cta}
              </button>
            </div>
          ) : stage === 'tone' || stage === 'movement' ? (
            <PreviewQuestion
              content={stage === 'tone' ? content.quiz.tone : content.quiz.movement}
              current={stage === 'tone' ? 1 : 2}
              onContinue={stage === 'tone' ? continueFromTone : showPreview}
              onSelect={(value) => {
                setError(null)
                if (stage === 'tone') {
                  setTone(value as GuardianPreviewTone)
                } else {
                  setMovement(value as GuardianPreviewMovement)
                }
              }}
              position={content.quiz.position(stage === 'tone' ? 1 : 2, 2)}
              selected={stage === 'tone' ? tone : movement}
              submitLabel={stage === 'tone' ? content.quiz.next : content.quiz.result}
            />
          ) : stage === 'preview' ? (
            <FreePreview
              chartState={chartState}
              content={content}
              locale={locale}
              movement={movement as GuardianPreviewMovement}
              onCheckout={openCheckout}
              price={price}
              tone={tone as GuardianPreviewTone}
            />
          ) : (
            <CheckoutPanel
              content={content}
              email={email}
              error={error}
              locale={locale}
              onClose={() => setStage(existingSession ? 'overview' : 'preview')}
              onEmailChange={setEmail}
              onSubmit={submitCheckout}
              onTurnstileExpire={() => setTurnstileToken('')}
              onTurnstileSuccess={setTurnstileToken}
              price={price}
              submitting={submitting}
              tokenReady={turnstileToken.length > 0}
              turnstile={turnstile}
            />
          )}
          {error && stage !== 'checkout' && (
            <p className="mx-auto mt-4 max-w-2xl rounded-xl bg-danger/10 px-3 py-2 text-center text-xs leading-5 text-pink-200">
              {error}
            </p>
          )}
        </section>

        <PurchaseDetails catalog={catalog} content={content} loveOdds={loveOdds} locale={locale} price={price} />

        <section className="mx-auto max-w-3xl py-16 sm:py-24">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.faq.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">{content.faq.title}</h2>
          </div>
          <div className="mt-7 divide-y divide-white/8 rounded-[2rem] border border-white/9 bg-white/3 px-5 sm:px-7">
            {content.faq.items.map((item) => (
              <details className="group py-5" key={item.question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-white marker:content-none">
                  {item.question}
                  <span aria-hidden className="text-accent transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pt-3 text-sm leading-7 text-foreground-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function PreviewQuestion({
  content,
  current,
  onContinue,
  onSelect,
  position,
  selected,
  submitLabel,
}: {
  content: {
    label: string
    prompt: string
    supportingText: string
    options: readonly { id: string; label: string }[]
  }
  current: number
  onContinue: () => void
  onSelect: (value: string) => void
  position: string
  selected: string | null
  submitLabel: string
}) {
  return (
    <section
      aria-labelledby={`preview-question-${current}`}
      className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-5 shadow-2xl backdrop-blur sm:p-8"
    >
      <div className="flex items-center justify-between text-[11px] font-semibold text-foreground-subtle">
        <span>{content.label}</span>
        <span>{position}</span>
      </div>
      <div aria-hidden className="mt-3 grid grid-cols-2 gap-2">
        {[1, 2].map((step) => (
          <span className={`h-1 rounded-full ${step <= current ? 'bg-pink-200' : 'bg-white/8'}`} key={step} />
        ))}
      </div>
      <h2 className="mt-7 text-balance text-2xl font-black leading-9 text-white" id={`preview-question-${current}`}>
        {content.prompt}
      </h2>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.supportingText}</p>
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {content.options.map((option) => (
          <button
            aria-pressed={selected === option.id}
            className={`${styles.quizOption} ${selected === option.id ? styles.quizOptionSelected : ''} rounded-2xl px-4 py-3 text-left text-sm leading-6 text-foreground-secondary transition`}
            key={option.id}
            onClick={() => onSelect(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        className="mt-6 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!selected}
        onClick={onContinue}
        type="button"
      >
        {submitLabel}
      </button>
    </section>
  )
}

function FreePreview({
  chartState,
  content,
  locale,
  movement,
  onCheckout,
  price,
  tone,
}: {
  chartState: ChartState
  content: (typeof GUARDIAN_REPORT_UI)[Locale]['landing']
  locale: Locale
  movement: GuardianPreviewMovement
  onCheckout: () => void
  price: { market: string; currency: string; amountMinor: number } | undefined
  tone: GuardianPreviewTone
}) {
  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] border border-pink-200/15 bg-[#120b24]/90 p-5 shadow-2xl backdrop-blur sm:p-8">
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.preview.eyebrow}</p>
        <h2 className="mt-3 text-balance text-2xl font-black text-white">{content.preview.title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-foreground-subtle">{content.preview.body}</p>
      </header>

      <blockquote className="mx-auto mt-6 max-w-xl rounded-2xl border border-pink-200/18 bg-pink-100/8 px-5 py-4 text-center text-sm font-semibold leading-7 text-pink-50">
        {content.preview.toneLines[tone]} {content.preview.movementLines[movement]}
      </blockquote>

      <ul className="mt-7 grid grid-cols-4 gap-2" aria-label={content.preview.lockedTitle}>
        {SLOT_ORDER.map((slot) => (
          <li key={slot}>
            <div className={styles.sealedCard}>
              <span className="relative z-10 text-xl">{content.preview.slots[slot].glyph}</span>
              <span className="absolute bottom-3 z-10 text-[9px] font-semibold">{content.preview.sealedLabel}</span>
            </div>
            <p className="mt-2 text-center text-[10px] font-semibold text-foreground-subtle">
              {content.preview.slots[slot].label}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-3xl border border-white/8 bg-black/15 p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
          {content.preview.lockedEyebrow}
        </p>
        <h3 className="mt-2 text-base font-bold text-white">{content.preview.lockedTitle}</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {content.preview.lockedItems.map((item) => (
            <article
              className="relative overflow-hidden rounded-2xl border border-white/7 bg-white/3 p-3.5"
              key={item.title}
            >
              <h4 className="text-xs font-bold text-foreground-secondary">{item.title}</h4>
              <p className={`${styles.lockedCopy} mt-2 text-xs leading-5 text-foreground-subtle`}>{item.preview}</p>
              <span className="absolute bottom-3 right-3 text-xs text-pink-200">⌁</span>
            </article>
          ))}
        </div>
      </div>

      {chartState.status === 'missing' || chartState.status === 'failed' ? (
        <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/8 p-4 text-center">
          <h3 className="text-sm font-bold text-white">{content.preview.chartRequiredTitle}</h3>
          <p className="mt-2 text-xs leading-6 text-foreground-muted">{content.preview.chartRequiredBody}</p>
          <Link
            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground"
            href={`/${locale}`}
          >
            {content.preview.chartRequiredCta}
          </Link>
        </div>
      ) : chartState.status === 'loading' ? (
        <p className="mt-6 animate-pulse text-center text-xs text-foreground-subtle motion-reduce:animate-none">
          {content.preview.chartLoading}
        </p>
      ) : (
        <button
          className="mt-6 w-full rounded-2xl bg-[linear-gradient(100deg,#fff3f8,#eadfff)] px-5 py-4 text-sm font-bold text-[#24142e] shadow-[0_14px_40px_rgba(255,193,214,0.18)]"
          onClick={onCheckout}
          type="button"
        >
          {content.preview.unlock}
          {price && <span className="ml-2 opacity-65">· {formatPrice(price.amountMinor, price.currency, locale)}</span>}
        </button>
      )}
    </section>
  )
}

function PurchaseDetails({
  catalog,
  content,
  loveOdds,
  locale,
  price,
}: {
  catalog: GuardianProductCatalog | null
  content: (typeof GUARDIAN_REPORT_UI)[Locale]['landing']
  loveOdds: readonly { rarity: 'orbit' | 'nebula' | 'eclipse' | 'stella'; weight: number; weightScale: number }[]
  locale: Locale
  price: { market: string; currency: string; amountMinor: number } | undefined
}) {
  return (
    <section className="border-y border-white/8 py-14 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.86fr] lg:items-start lg:gap-12">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            {content.purchase.eyebrow}
          </p>
          <h2 className="mt-3 text-balance text-2xl font-black text-white sm:text-3xl">{content.purchase.title}</h2>
          <p className="mt-4 text-sm leading-7 text-foreground-muted">{content.purchase.body}</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {content.purchase.includes.map((item) => (
              <li
                className="rounded-2xl bg-white/4 px-4 py-3 text-xs font-semibold text-foreground-secondary"
                key={item}
              >
                <span className="mr-2 text-pink-200">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-[2rem] border border-pink-200/15 bg-[linear-gradient(145deg,rgba(255,193,214,0.1),rgba(201,168,255,0.06))] p-5 shadow-2xl sm:p-6">
          <div className="flex items-end justify-between gap-4 border-b border-white/8 pb-5">
            <p className="text-xs text-foreground-subtle">{content.purchase.priceSuffix}</p>
            <p className="text-2xl font-black text-white">
              {price ? formatPrice(price.amountMinor, price.currency, locale) : content.purchase.priceLoading}
            </p>
          </div>
          {loveOdds.length > 0 && (
            <div className="pt-5">
              <h3 className="text-xs font-bold text-white">{content.purchase.oddsTitle}</h3>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                {loveOdds.map((odd) => (
                  <div
                    className="flex items-center justify-between rounded-xl bg-black/15 px-3 py-2 text-[11px]"
                    key={odd.rarity}
                  >
                    <dt className="text-foreground-subtle">{content.purchase.rarityLabels[odd.rarity]}</dt>
                    <dd className="font-semibold text-foreground-secondary">
                      {formatOdds(odd.weight, odd.weightScale)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {catalog && (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-3 text-[11px] leading-5 text-foreground-subtle">
              <p>{content.purchase.guarantee(catalog.guarantee.paidDrawInterval)}</p>
              {!catalog.guarantee.initialReportCountsTowardProgress && (
                <p className="mt-1">{content.purchase.guaranteeInitial}</p>
              )}
            </div>
          )}
        </aside>
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
  price: { market: string; currency: string; amountMinor: number } | undefined
  submitting: boolean
  tokenReady: boolean
  turnstile: React.RefObject<TurnstileInstance | null>
}) {
  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border border-pink-200/15 bg-[#120b24]/94 p-5 shadow-2xl backdrop-blur sm:p-8">
      <button className="text-xs text-foreground-subtle hover:text-white" onClick={onClose} type="button">
        ← {content.checkout.close}
      </button>
      <h2 className="mt-5 text-2xl font-black text-white">{content.checkout.title}</h2>
      <p className="mt-3 text-sm leading-7 text-foreground-muted">{content.checkout.body}</p>

      <form className="mt-6" onSubmit={onSubmit}>
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

        {error && (
          <p aria-live="polite" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs leading-5 text-pink-200">
            {error}
          </p>
        )}

        <button
          className="mt-5 w-full rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-45"
          disabled={!tokenReady || submitting}
          type="submit"
        >
          {submitting ? content.checkout.submitting : content.checkout.submit}
          {!submitting && price && (
            <span className="ml-2 opacity-70">· {formatPrice(price.amountMinor, price.currency, locale)}</span>
          )}
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

function formatPrice(amount: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_LANGUAGE_TAGS[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatOdds(weight: number, weightScale: number): string {
  return `${(weight / weightScale) * 100}%`
}
