'use client'

import { DEEP_TYPE_REPORT_OFFER } from '@deep-type/offer'
import { type PayMethod, payMethodsFor } from '@deep-type/pay-method'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { ArrowLeft, CheckCircle, Sparkles } from '@mynaui/icons-react'
import { trackEcommerce } from '@sobok/analytics/browser'
import Link from 'next/link'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { PAY_TIER, TURNSTILE_SITE_KEY } from '@/constants'
import { LEGAL } from '@/content/legal'
import { cn } from '@/utils/cn'
import { DEEPTYPE_CHECKOUT_ACTION } from '../../../../../worker/api/deep-type/actions'
import { FOCUS_CLASS_NAME } from '../../../../components/focus'

import { type FreeResult, type PaypalSession, type SettledPayment, useCheckout } from '../_hooks/use-checkout'
import { formatPrice } from '../_lib/price'
import { reportOfferEcommerce } from '../_lib/report-offer-analytics'
import { CARD_CLASS_NAME } from '../_lib/surface'
import type { DeepTypeContent } from '../_lib/types'

type PaywallViewProps = {
  content: DeepTypeContent
  freeResult: FreeResult
  onClose: () => void
  onPaid: (payment: SettledPayment) => void
}

export function PaywallView({ content, freeResult, onClose, onPaid }: PaywallViewProps) {
  const paywall = content.paywall
  const { cancelPaypal, errorMessage, failPaypal, finishPaypal, paypal, start, status } = useCheckout(
    freeResult,
    paywall,
  )
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined)
  // The same list the Worker enforces, from the same module and narrowed by the same tier — the screen cannot
  // offer a channel `/checkout` would refuse, and a method this deployment has no approved contract for is not
  // rendered at all rather than rendered and refused.
  //
  // The catalogue's order is the picker's order and its first entry is the default, so which method a decided
  // buyer lands on is edited in `@deep-type/pay-method` and not here.
  const methods = payMethodsFor(freeResult.locale, PAY_TIER)
  const [payMethod, setPayMethod] = useState<PayMethod>(methods[0])

  const offer = DEEP_TYPE_REPORT_OFFER[freeResult.locale]
  const discountLabel = paywall.discountTemplate.replace('{discount}', String(offer.discountPercent))
  const listPrice = formatPrice(freeResult.locale, offer.currency, offer.listAmount)
  const price = formatPrice(freeResult.locale, offer.currency, offer.amount)

  useEffect(() => {
    trackEcommerce('view_item', reportOfferEcommerce(freeResult.locale), { locale: freeResult.locale })
  }, [freeResult.locale])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!turnstileToken) {
      return
    }

    trackEcommerce('begin_checkout', reportOfferEcommerce(freeResult.locale), { locale: freeResult.locale })
    const email = String(new FormData(event.currentTarget).get('email') ?? '')
    const settled = await start(email, turnstileToken, payMethod)

    if (settled) {
      onPaid(settled)
      return
    }

    // The token is spent either way — `/checkout` consumed it even when the next step is PayPal's button.
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }

  async function handlePaypalSuccess() {
    const settled = await finishPaypal()

    if (settled) {
      onPaid(settled)
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-14">
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <section className="rounded-3xl sm:rounded-4xl border border-page-accent/35 bg-page-surface p-6 text-center shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-page-accent/12 text-page-accent-strong">
            <Sparkles aria-hidden="true" className="h-7 w-7" stroke={1.8} />
          </span>
          <h1 className="mt-4 font-black text-2xl leading-snug">{paywall.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-page-ink-soft leading-7">{paywall.body}</p>

          <ul className="mt-6 grid gap-2 text-left">
            {paywall.benefits.map((item) => (
              <li className="flex items-center gap-2 text-page-ink leading-7" key={item}>
                <CheckCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-page-accent-strong" stroke={1.8} />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-page-ink-muted line-through">{listPrice}</span>
            <span className="font-black text-3xl text-page-accent-strong">{price}</span>
            <span className="rounded-full bg-page-accent/12 px-3 py-1 font-black text-page-accent-strong text-xs">
              {discountLabel}
            </span>
          </div>
          <p className="mx-auto mt-3 max-w-md text-page-ink-muted text-sm leading-6">{paywall.effortNote}</p>
          {/* O6, said twice on purpose. On the picker it is information; here it is disclosure, because this is
              the screen where money moves and a buyer who skipped the picker would otherwise learn afterwards. */}
          {freeResult.declaredPersona === null ? (
            <p className="mx-auto mt-2 max-w-md text-page-ink-muted text-sm leading-6">{paywall.unknownPersonaNote}</p>
          ) : null}
        </section>

        <form className={CARD_CLASS_NAME} onSubmit={handleSubmit}>
          {/* `display: contents` so the wrapper adds no box, `disabled` so the whole form freezes while the
              PayPal leg is open — the created payment is pinned to these values, and an edit here would be
              silently ignored by the window the buyer is about to open. */}
          <fieldset className="contents" disabled={status === 'paypal'}>
            <label className="block font-bold text-page-ink-soft text-sm" htmlFor="deeptype-email">
              {paywall.emailLabel}
            </label>
            <input
              autoComplete="email"
              className={cn(
                'mt-2 min-h-12 w-full rounded-2xl border border-page-border bg-white px-4 font-medium text-page-ink outline-none placeholder:text-page-ink-muted focus-visible:border-page-accent',
                FOCUS_CLASS_NAME,
              )}
              id="deeptype-email"
              inputMode="email"
              maxLength={254}
              name="email"
              placeholder={paywall.emailPlaceholder}
              required
              type="email"
            />

            {/* Hidden rather than disabled when there is nothing to choose: a one-entry radio group is a control
              that cannot do anything, and every non-Korean locale has exactly one channel. */}
            {methods.length > 1 ? (
              <fieldset className="mt-5">
                <legend className="font-bold text-page-ink-soft text-sm">{paywall.methodLabel}</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {methods.map((method) => (
                    <label
                      className={cn(
                        'flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border font-bold text-sm transition-colors',
                        // The radio itself is sr-only, so the ring has to be borrowed from the input it labels —
                        // otherwise the whole picker is invisible to a keyboard.
                        'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-page-accent',
                        payMethod === method
                          ? 'border-page-accent bg-page-accent/10 text-page-accent-strong'
                          : 'border-page-border text-page-ink-soft hover:text-page-ink',
                      )}
                      key={method}
                    >
                      <input
                        checked={payMethod === method}
                        className="sr-only"
                        name="pay-method"
                        onChange={() => setPayMethod(method)}
                        type="radio"
                        value={method}
                      />
                      {paywall.methodLabels[method]}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <div className="mt-4 grid gap-3">
              <Consent label={paywall.ageConfirmation} name="confirm-age" />
              <Consent label={paywall.consentWithdrawal} name="agree-withdrawal" />
              <Consent label={paywall.consentPrivacy} name="agree-privacy" />
            </div>

            {/* 전자상거래법 제13조 제3항 owes this to a minor at the moment the contract is formed, so it sits on the
              checkout rather than only in the terms. It is a notice and not a consent — nothing to tick, because
              the right it describes exists whether or not the buyer agrees to it. */}
            <p className="mt-3 text-page-ink-muted text-xs leading-relaxed">{paywall.minorNotice}</p>

            {/* Same reservation as the re-open form: the widget mounts late, so its box is held open from the
              first paint rather than pushing the pay button down mid-read. */}
            <div className="mt-4 flex min-h-18 justify-center">
              <Turnstile
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
                onSuccess={setTurnstileToken}
                options={{ action: DEEPTYPE_CHECKOUT_ACTION, responseField: false }}
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
              />
            </div>
          </fieldset>

          {/* The two-step SPB leg: `/checkout` has approved this payment, and only PayPal's own button can
              open its window — ours cannot. So the pay button gives way to PayPal's, with the way back out. */}
          {status === 'paypal' && paypal ? (
            <PaypalArea
              cancelLabel={paywall.paypalCancel}
              hint={paywall.paypalHint}
              onCancel={cancelPaypal}
              onFail={failPaypal}
              onSuccess={handlePaypalSuccess}
              session={paypal}
            />
          ) : (
            <button
              className={cn(
                'mt-6 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent-strong px-6 font-black text-sm text-white shadow-[0_20px_60px_var(--page-accent-glow)] transition-colors hover:bg-page-accent-strong/92 disabled:cursor-not-allowed disabled:bg-page-ink/20 disabled:shadow-none',
                FOCUS_CLASS_NAME,
              )}
              disabled={!turnstileToken || status === 'processing'}
              type="submit"
            >
              {status === 'processing' ? paywall.processing : paywall.cta}
            </button>
          )}

          {status === 'error' || errorMessage ? (
            <p className="mt-3 text-center font-bold text-page-accent-strong text-sm">
              {errorMessage || paywall.errorGeneric}
            </p>
          ) : null}

          <p className="mt-4 text-page-ink-muted text-xs leading-6">{paywall.notice}</p>

          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-page-ink-muted text-xs">
            <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${freeResult.locale}/terms`}>
              {LEGAL[freeResult.locale].nav.terms}
            </Link>
            <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${freeResult.locale}/refund`}>
              {LEGAL[freeResult.locale].nav.refund}
            </Link>
            <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${freeResult.locale}/privacy`}>
              {LEGAL[freeResult.locale].nav.privacy}
            </Link>
          </p>
        </form>

        <button
          className={cn(
            'mx-auto inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold text-page-ink-muted text-sm transition-colors hover:text-page-ink',
            FOCUS_CLASS_NAME,
          )}
          onClick={onClose}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" stroke={1.8} />
          {paywall.closeCta}
        </button>
      </div>
    </main>
  )
}

function Consent({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-left text-page-ink text-sm leading-6">
      <input className="mt-0.5 h-5 w-5 shrink-0 accent-page-accent" name={name} required type="checkbox" />
      <span>{label}</span>
    </label>
  )
}

type PaypalAreaProps = {
  cancelLabel: string
  hint: string
  onCancel: () => void
  onFail: (message: string) => void
  onSuccess: () => void
  session: PaypalSession
}

// PortOne renders PayPal's buttons into the element carrying the `portone-ui-container` class — the class is
// the SDK's contract, not a style hook. Mounted only after `/checkout` approved the payment, because the
// request the buttons are loaded with is the approved one: paymentId, server-priced amount, the single channel
// key. `onPaymentFail` is per attempt and not terminal — the buttons stay pressable, so it surfaces the
// message and leaves the session standing.
function PaypalArea({ cancelLabel, hint, onCancel, onFail, onSuccess, session }: PaypalAreaProps) {
  useEffect(() => {
    let cancelled = false

    void import('@portone/browser-sdk/v2').then(({ loadPaymentUI }) => {
      if (cancelled) {
        return
      }
      void loadPaymentUI(session.request, {
        onPaymentFail: (error) => onFail(error.message),
        onPaymentSuccess: (response) => {
          // The success callback still carries a failure shape (`code` set) for PG-reported declines.
          if (response.code != null) {
            onFail(response.message ?? '')
            return
          }
          onSuccess()
        },
      })
    })

    return () => {
      cancelled = true
    }
  }, [session, onFail, onSuccess])

  return (
    <div className="mt-6 grid gap-3">
      <p className="text-center text-page-ink-soft text-sm leading-6">{hint}</p>
      <div className="portone-ui-container min-h-13" />
      <button
        className={cn(
          'justify-self-center rounded-full px-3 py-1 font-bold text-page-ink-muted text-sm underline underline-offset-2 transition-colors hover:text-page-ink',
          FOCUS_CLASS_NAME,
        )}
        onClick={onCancel}
        type="button"
      >
        {cancelLabel}
      </button>
    </div>
  )
}
