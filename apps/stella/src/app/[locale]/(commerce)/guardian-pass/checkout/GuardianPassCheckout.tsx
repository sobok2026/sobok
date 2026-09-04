'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { track, trackEcommerce } from '@sobok/analytics/browser'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import Starfield from '@/components/Starfield'
import { TURNSTILE_LANGUAGE_TAGS, TURNSTILE_SITE_KEY } from '@/constants'
import { GUARDIAN_DAILY_UI as copy } from '@/content/guardian-daily-ui'
import {
  browserTimeZone,
  clearGuardianCheckoutRequestId,
  confirmGuardianPass,
  createGuardianPassCheckout,
  GUARDIAN_CURRENCY,
  GUARDIAN_PASS_CHECKOUT_ACTION,
  GUARDIAN_PASS_ITEM,
  GUARDIAN_PASS_NAME,
  GUARDIAN_PASS_PRICE,
  GUARDIAN_PAY_METHODS,
  GuardianApiError,
  type GuardianPassConfirmation,
  type GuardianPassSession,
  type GuardianPayMethod,
  GuardianStorageError,
  guardianPassPaths,
  readGuardianPassSession,
  readOrCreateGuardianCheckoutRequestId,
  readOrCreateGuardianViewerId,
  storeGuardianPassSession,
} from '@/lib/guardian-daily'

export default function GuardianPassCheckout({ locale }: { locale: Locale }) {
  const paths = guardianPassPaths(locale)
  const [email, setEmail] = useState('')
  const [payMethod, setPayMethod] = useState<GuardianPayMethod>(GUARDIAN_PAY_METHODS[0])
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const turnstile = useRef<TurnstileInstance>(null)

  useEffect(() => {
    if (locale !== 'ko') return
    const session = readGuardianPassSession()
    if (!session) return
    if (session.payMethod) setPayMethod(session.payMethod)
    if (session.accessExpiresAt && new Date(session.accessExpiresAt) > new Date()) {
      window.location.replace(paths.tomorrow)
      return
    }

    let cancelled = false
    setConfirming(true)
    void confirmGuardianPass(session)
      .then((confirmation) => {
        if (cancelled) return
        if (confirmation.status === 'paid' && new Date(confirmation.accessExpiresAt) > new Date()) {
          completePurchase(session, confirmation, paths.tomorrow)
          return
        }
        if (confirmation.status === 'paid') {
          storeGuardianPassSession({ ...session, accessExpiresAt: confirmation.accessExpiresAt })
        }
        if (confirmation.status !== 'pending') clearGuardianCheckoutRequestId()
      })
      .catch(() => {
        // A stale or interrupted pending checkout remains resumable through the form below.
      })
      .finally(() => {
        if (!cancelled) setConfirming(false)
      })
    return () => {
      cancelled = true
    }
  }, [locale, paths.tomorrow])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locale !== 'ko' || !turnstileToken || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const existing = readGuardianPassSession()
      const response = await createGuardianPassCheckout({
        locale: 'ko',
        timeZone: browserTimeZone(),
        email: email.trim(),
        payMethod,
        turnstileToken,
        viewerId: readOrCreateGuardianViewerId(),
        checkoutRequestId: readOrCreateGuardianCheckoutRequestId(),
        consents: { age: true, terms: true, privacy: true, withdrawal: true },
        accessToken: existing?.accessToken,
      })
      const session: GuardianPassSession = {
        locale: 'ko',
        collectionPublicId: response.collection.publicId,
        accessToken: response.collection.accessToken ?? existing?.accessToken,
        paymentId: response.payment.paymentId,
        payMethod,
        accessExpiresAt: response.payment.accessExpiresAt,
        createdAt: existing?.createdAt ?? Date.now(),
        claimed: existing?.claimed ?? response.collection.accessToken === undefined,
      }
      storeGuardianPassSession(session)

      trackEcommerce('begin_checkout', {
        currency: response.payment.currency,
        value: response.payment.amount,
        items: [GUARDIAN_PASS_ITEM],
      })

      if (response.payment.status === 'paid') {
        if (!response.payment.accessExpiresAt) throw new Error('Paid guardian pass has no expiry')
        completePurchase(
          session,
          {
            status: 'paid',
            grant: 'already-granted',
            accessExpiresAt: response.payment.accessExpiresAt,
            collectionPublicId: response.collection.publicId,
          },
          paths.tomorrow,
        )
        return
      }

      const { requestPayment } = await import('@portone/browser-sdk/v2')
      const result = await requestPayment({
        channelKey: response.payment.channelKey,
        currency: response.payment.currency,
        customer: { email: email.trim() },
        forceRedirect: true,
        orderName: response.payment.orderName,
        paymentId: response.payment.paymentId,
        payMethod: response.payment.payMethod,
        redirectUrl: `${window.location.origin}${paths.checkout}?return=1`,
        storeId: response.payment.storeId,
        totalAmount: response.payment.amount,
      })

      if (result?.code != null) {
        const confirmation = await confirmGuardianPass(session).catch(() => null)
        if (confirmation?.status === 'paid') {
          completePurchase(session, confirmation, paths.tomorrow)
          return
        }
        if (confirmation && confirmation.status !== 'pending') clearGuardianCheckoutRequestId()
        track('guardian_pass_payment_interrupted', { code: result.code })
        setError(result.message || copy.checkout.errors.interrupted)
        return
      }

      const confirmation = await confirmGuardianPass(session)
      if (confirmation.status === 'paid') {
        completePurchase(session, confirmation, paths.tomorrow)
        return
      }
      setError(copy.checkout.errors.interrupted)
    } catch (caught) {
      if (caught instanceof GuardianApiError && caught.slug === 'pass-active') {
        window.location.replace(paths.tomorrow)
        return
      }
      setError(checkoutError(caught))
    } finally {
      setSubmitting(false)
      setTurnstileToken('')
      turnstile.current?.reset()
    }
  }

  if (locale !== 'ko') {
    return (
      <CheckoutShell>
        <section className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/90 p-7 text-center">
          <h1 className="text-xl font-bold text-white">한국어에서 준비 중인 상품이에요</h1>
          <Link className="mt-6 block text-sm text-accent underline" href={paths.today}>
            오늘의 운세로 돌아가기
          </Link>
        </section>
      </CheckoutShell>
    )
  }

  if (confirming) {
    return (
      <CheckoutShell>
        <p className="mt-[20vh] animate-pulse text-center text-sm text-foreground-muted motion-reduce:animate-none">
          {copy.checkout.confirming}
        </p>
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell>
      <section className="mx-auto w-full max-w-lg rounded-[2rem] border border-pink-200/15 bg-[#120b24]/92 p-5 shadow-2xl sm:p-7">
        <Link className="text-xs text-foreground-subtle underline-offset-4 hover:underline" href={paths.tomorrow}>
          ← {copy.checkout.back}
        </Link>
        <header className="mt-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">{copy.checkout.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black text-white">{copy.checkout.title}</h1>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">{copy.checkout.body}</p>
        </header>

        <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 p-4">
          <p className="text-xs font-bold text-white">{copy.checkout.orderTitle}</p>
          <dl className="mt-3 grid gap-2 text-xs">
            {[
              [copy.checkout.productLabel, GUARDIAN_PASS_NAME.ko],
              [copy.checkout.priceLabel, `${formatPrice()} · ${copy.checkout.vatIncluded}`],
              [copy.checkout.durationLabel, copy.checkout.durationValue],
              [copy.checkout.renewalLabel, copy.checkout.renewalValue],
            ].map(([label, value]) => (
              <div className="flex items-start justify-between gap-4" key={label}>
                <dt className="text-foreground-subtle">{label}</dt>
                <dd className="text-right font-semibold text-foreground-secondary">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <form className="mt-6" onSubmit={submit}>
          <label className="text-xs font-semibold text-foreground-secondary" htmlFor="guardian-pass-email">
            {copy.checkout.emailLabel}
          </label>
          <input
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-200/40"
            id="guardian-pass-email"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.checkout.emailPlaceholder}
            required
            type="email"
            value={email}
          />
          <p className="mt-2 text-[10px] leading-5 text-foreground-faint">{copy.checkout.emailHint}</p>

          <fieldset className="mt-5">
            <legend className="text-xs font-semibold text-foreground-secondary">{copy.checkout.methodLabel}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {GUARDIAN_PAY_METHODS.map((method) => (
                <label
                  className={`cursor-pointer rounded-2xl border px-3 py-3 text-center text-xs font-semibold ${
                    payMethod === method
                      ? 'border-pink-200/45 bg-pink-100/12 text-pink-50'
                      : 'border-white/10 bg-white/3 text-foreground-secondary'
                  }`}
                  key={method}
                >
                  <input
                    checked={payMethod === method}
                    className="sr-only"
                    name="guardian-pass-pay-method"
                    onChange={() => setPayMethod(method)}
                    type="radio"
                    value={method}
                  />
                  {copy.checkout.methodLabels[method]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-3">
            <Turnstile
              onExpire={() => setTurnstileToken('')}
              onSuccess={setTurnstileToken}
              options={{
                action: GUARDIAN_PASS_CHECKOUT_ACTION,
                language: TURNSTILE_LANGUAGE_TAGS[locale],
                theme: 'dark',
              }}
              ref={turnstile}
              siteKey={TURNSTILE_SITE_KEY}
            />
            <p className="mt-2 text-center text-[10px] text-foreground-faint">{copy.checkout.securityHint}</p>
          </div>

          <fieldset className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-4">
            <legend className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
              {copy.checkout.consentTitle}
            </legend>
            <div className="grid gap-3">
              {[
                copy.checkout.consentAge,
                copy.checkout.consentTerms,
                copy.checkout.consentPrivacy,
                copy.checkout.consentWithdrawal,
              ].map((label) => (
                <label
                  className="flex cursor-pointer gap-2.5 text-[11px] leading-5 text-foreground-secondary"
                  key={label}
                >
                  <input className="mt-0.5 size-4 shrink-0 accent-pink-300" required type="checkbox" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-foreground-faint">{copy.checkout.minorNotice}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
              {[
                ['이용약관', 'terms'],
                ['개인정보처리방침', 'privacy'],
                ['청약철회·환불 정책', 'refund'],
              ].map(([label, path]) => (
                <Link
                  className="text-foreground-subtle underline underline-offset-2"
                  href={`/${locale}/${path}`}
                  key={path}
                  target="_blank"
                >
                  {label}
                </Link>
              ))}
            </p>
          </fieldset>

          {error && <p className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs text-pink-200">{error}</p>}

          <button
            className="mt-5 w-full rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-45"
            disabled={!turnstileToken || submitting}
            type="submit"
          >
            {submitting ? copy.checkout.submitting : copy.checkout.submit}
          </button>
        </form>

        <Link className="mt-5 block text-center text-xs text-foreground-subtle underline" href={paths.reopen}>
          {copy.checkout.reopen}
        </Link>
      </section>
    </CheckoutShell>
  )
}

function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-16 pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <div className="relative z-10">{children}</div>
    </main>
  )
}

function completePurchase(
  session: GuardianPassSession,
  confirmation: Extract<GuardianPassConfirmation, { status: 'paid' }>,
  destination: string,
) {
  const next = {
    ...session,
    collectionPublicId: confirmation.collectionPublicId,
    accessExpiresAt: confirmation.accessExpiresAt,
  }
  storeGuardianPassSession(next)
  clearGuardianCheckoutRequestId()
  trackEcommerce('purchase', {
    transaction_id: session.paymentId,
    currency: GUARDIAN_CURRENCY,
    value: GUARDIAN_PASS_PRICE,
    items: [GUARDIAN_PASS_ITEM],
  })
  window.location.replace(destination)
}

function checkoutError(error: unknown): string {
  if (error instanceof GuardianStorageError) return copy.checkout.errors.storage
  if (error instanceof GuardianApiError) {
    if (error.slug === 'turnstile-expired' || error.slug === 'turnstile-failed') return copy.checkout.errors.turnstile
    if (error.slug === 'rate-limited') return copy.checkout.errors.rateLimited
    if (error.slug === 'pass-active') return copy.checkout.errors.active
    if (error.slug === 'service-unavailable') return copy.checkout.errors.service
  }
  return copy.checkout.errors.generic
}

function formatPrice(): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: GUARDIAN_CURRENCY,
    maximumFractionDigits: 0,
  }).format(GUARDIAN_PASS_PRICE)
}
