'use client'

import { DEEP_TYPE_REPORT_OFFER } from '@deep-type/offer'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { ArrowLeft, CheckCircle, Sparkles } from '@mynaui/icons-react'
import Link from 'next/link'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { TURNSTILE_SITE_KEY } from '@/constants'
import { LEGAL } from '@/content/legal'
import { track } from '@/lib/analytics/browser'
import { cn } from '@/utils/cn'

import { type FreeResult, useCheckout } from '../_hooks/use-checkout'
import { formatKrw } from '../_lib/price'
import { REPORT_OFFER_ITEMS } from '../_lib/report-offer-analytics'
import type { DeepTypeContent } from '../_lib/types'

type PaywallViewProps = {
  content: DeepTypeContent
  freeResult: FreeResult
  onClose: () => void
  onPaid: (accessToken: string) => void
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function PaywallView({ content, freeResult, onClose, onPaid }: PaywallViewProps) {
  const { errorMessage, start, status } = useCheckout(freeResult)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined)

  const paywall = content.paywall
  const discountLabel = paywall.discountTemplate.replace('{discount}', String(DEEP_TYPE_REPORT_OFFER.discountPercent))
  const listPrice = formatKrw(freeResult.locale, DEEP_TYPE_REPORT_OFFER.listAmount)
  const price = formatKrw(freeResult.locale, DEEP_TYPE_REPORT_OFFER.amount)

  useEffect(() => {
    track('view_item', {
      currency: DEEP_TYPE_REPORT_OFFER.currency,
      items: REPORT_OFFER_ITEMS,
      locale: freeResult.locale,
      value: DEEP_TYPE_REPORT_OFFER.amount,
    })
  }, [freeResult.locale])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!turnstileToken) {
      return
    }

    track('begin_checkout', {
      currency: DEEP_TYPE_REPORT_OFFER.currency,
      items: REPORT_OFFER_ITEMS,
      locale: freeResult.locale,
      value: DEEP_TYPE_REPORT_OFFER.amount,
    })
    const email = String(new FormData(event.currentTarget).get('email') ?? '')
    const accessToken = await start(email, turnstileToken)

    if (accessToken) {
      onPaid(accessToken)
      return
    }

    setTurnstileToken('')
    turnstileRef.current?.reset()
  }

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-14">
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <section className="rounded-4xl border border-page-accent/35 bg-page-surface p-6 text-center shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-page-accent/12 text-page-accent">
            <Sparkles aria-hidden="true" className="h-7 w-7" stroke={1.8} />
          </span>
          <h1 className="mt-4 break-keep font-black text-2xl leading-snug">{paywall.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-page-ink/68 leading-7">{paywall.body}</p>

          <ul className="mt-6 grid gap-2 text-left">
            {paywall.benefits.map((item) => (
              <li className="flex items-center gap-2 text-page-ink/78 leading-7" key={item}>
                <CheckCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-page-accent" stroke={1.8} />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-page-ink/40 line-through">{listPrice}</span>
            <span className="font-black text-3xl text-page-accent">{price}</span>
            <span className="rounded-full bg-page-accent/12 px-3 py-1 font-black text-page-accent text-xs">
              {discountLabel}
            </span>
          </div>
          <p className="mx-auto mt-3 max-w-md text-page-ink/54 text-sm leading-6">{paywall.effortNote}</p>
        </section>

        <form className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7" onSubmit={handleSubmit}>
          <label className="block font-bold text-page-ink/70 text-sm" htmlFor="deeptype-email">
            {paywall.emailLabel}
          </label>
          <input
            autoComplete="email"
            className={cn(
              'mt-2 min-h-12 w-full rounded-2xl border border-page-border bg-white px-4 font-medium text-page-ink outline-none placeholder:text-page-ink/36 focus-visible:border-page-accent',
              focusClassName,
            )}
            id="deeptype-email"
            inputMode="email"
            maxLength={254}
            name="email"
            placeholder={paywall.emailPlaceholder}
            required
            type="email"
          />

          <div className="mt-4 grid gap-3">
            <Consent label={paywall.ageConfirmation} name="confirm-age" />
            <Consent label={paywall.consentWithdrawal} name="agree-withdrawal" />
            <Consent label={paywall.consentPrivacy} name="agree-privacy" />
          </div>

          <div className="mt-4 flex justify-center">
            <Turnstile
              onError={() => setTurnstileToken('')}
              onExpire={() => setTurnstileToken('')}
              onSuccess={setTurnstileToken}
              options={{ responseField: false }}
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
            />
          </div>

          <button
            className={cn(
              'mt-6 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92 disabled:cursor-not-allowed disabled:bg-page-ink/20 disabled:shadow-none',
              focusClassName,
            )}
            disabled={!turnstileToken || status === 'processing'}
            type="submit"
          >
            {status === 'processing' ? paywall.processing : paywall.cta}
          </button>

          {status === 'error' || errorMessage ? (
            <p className="mt-3 text-center font-bold text-page-accent text-sm">
              {errorMessage || paywall.errorGeneric}
            </p>
          ) : null}

          <p className="mt-4 text-page-ink/40 text-xs leading-6">{paywall.notice}</p>

          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-page-ink/40 text-xs">
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
            'mx-auto inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold text-page-ink/58 text-sm transition-colors hover:text-page-ink',
            focusClassName,
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
    <label className="flex cursor-pointer items-start gap-3 text-left text-page-ink/74 text-sm leading-6">
      <input className="mt-0.5 h-5 w-5 shrink-0 accent-page-accent" name={name} required type="checkbox" />
      <span>{label}</span>
    </label>
  )
}
