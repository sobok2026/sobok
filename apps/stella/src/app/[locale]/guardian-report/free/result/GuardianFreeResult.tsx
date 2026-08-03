'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { track, trackEcommerce } from '@sobok/analytics/browser'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { computeBirthChartAnalysis } from '@/chart/ephemeris'
import type { NatalChart } from '@/chart/types'
import { useBirthProfile } from '@/components/BirthProfileProvider'
import Starfield from '@/components/Starfield'
import { TURNSTILE_SITE_KEY } from '@/constants'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
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
  type GuardianPreviewSession,
  type GuardianProductCatalog,
  getGuardianProductCatalog,
  guardianReportPaths,
  readGuardianCheckoutSession,
  readGuardianPreviewSession,
  resumeGuardianCheckout,
  storeGuardianCheckoutSession,
} from '@/lib/guardian-paid'

import styles from '../../guardian-report.module.css'

type BirthChartAnalysis = Awaited<ReturnType<typeof computeBirthChartAnalysis>>
type ChartState = { status: 'loading' | 'missing' | 'failed' } | { status: 'ready'; analysis: BirthChartAnalysis }

const SLOT_ORDER = ['self', 'love', 'work', 'choice'] as const

export default function GuardianFreeResult({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].landing
  const paths = guardianReportPaths(locale)
  const birthProfile = useBirthProfile()
  const [preview, setPreview] = useState<GuardianPreviewSession | null | undefined>(undefined)
  const [chartState, setChartState] = useState<ChartState>({ status: 'loading' })
  const [catalog, setCatalog] = useState<GuardianProductCatalog | null>(null)
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

  const fullReport = catalog?.products.find(({ kind }) => kind === 'full_report')
  const price = fullReport?.prices.find(({ market, currency }) => market === 'KR' && currency === 'KRW')

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
    return <LoadingResult copy={content.preview.chartLoading} />
  }

  if (!preview && !existingSession) {
    return (
      <ResultShell locale={locale}>
        <section className="mx-auto mt-[10vh] max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/88 p-7 text-center shadow-2xl backdrop-blur">
          <span aria-hidden className="text-3xl text-pink-100">
            ☾
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">{content.preview.missingTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{content.preview.missingBody}</p>
          <Link
            className="mt-6 block rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
            href={paths.free}
          >
            {content.preview.missingCta}
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
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
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
        <FreePreview
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
            className="mt-6 block rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
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
    <main className="relative min-h-dvh bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <Link
          className="mb-7 inline-flex items-center gap-2 text-xs text-foreground-subtle transition hover:text-white"
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

function FreePreview({
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
  price: { market: string; currency: string; amountMinor: number } | undefined
}) {
  return (
    <section className="rounded-[2rem] border border-pink-200/15 bg-[#120b24]/90 p-5 shadow-2xl backdrop-blur sm:p-8">
      <header className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">{content.preview.eyebrow}</p>
        <h1 className="mt-3 text-balance text-2xl font-black text-white">{content.preview.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-foreground-subtle">{content.preview.body}</p>
      </header>

      <blockquote className="mx-auto mt-6 max-w-xl rounded-2xl border border-pink-200/18 bg-pink-100/8 px-5 py-4 text-center text-sm font-semibold leading-7 text-pink-50">
        {content.preview.toneLines[preview.tone]} {content.preview.movementLines[preview.movement]}
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
        <h2 className="mt-2 text-base font-bold text-white">{content.preview.lockedTitle}</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {content.preview.lockedItems.map((item) => (
            <article
              className="relative overflow-hidden rounded-2xl border border-white/7 bg-white/3 p-3.5"
              key={item.title}
            >
              <h3 className="text-xs font-bold text-foreground-secondary">{item.title}</h3>
              <p className={`${styles.lockedCopy} mt-2 text-xs leading-5 text-foreground-subtle`}>{item.preview}</p>
              <span className="absolute bottom-3 right-3 text-xs text-pink-200">⌁</span>
            </article>
          ))}
        </div>
      </div>

      {chartState.status === 'missing' || chartState.status === 'failed' ? (
        <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/8 p-4 text-center">
          <h2 className="text-sm font-bold text-white">{content.preview.chartRequiredTitle}</h2>
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
      <h1 className="mt-5 text-2xl font-black text-white">{content.checkout.title}</h1>
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
