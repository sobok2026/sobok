'use client'

import { ArrowLeft, Lock } from '@mynaui/icons-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'

import { type FreeResult, useCheckout } from '../_hooks/use-checkout'
import type { DeepTypeContent } from '../_lib/types'

type PaywallViewProps = {
  content: DeepTypeContent
  freeResult: FreeResult
  onClose: () => void
  onPaid: (accessToken: string) => void
}

const focusClassName = 'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-page-accent'

export function PaywallView({ content, freeResult, onClose, onPaid }: PaywallViewProps) {
  const paywall = content.paywall
  const { errorMessage, start, status } = useCheckout(freeResult)
  const [email, setEmail] = useState('')
  const [agreeWithdrawal, setAgreeWithdrawal] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)

  const emailValid = /.+@.+\..+/.test(email)
  const canSubmit = emailValid && agreeWithdrawal && agreePrivacy && status !== 'processing'

  async function submit() {
    if (!canSubmit) {
      return
    }
    const accessToken = await start(email)
    if (accessToken) {
      onPaid(accessToken)
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-page-bg px-safe py-10 text-page-ink sm:py-14">
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <section className="rounded-4xl border border-page-accent/35 bg-page-surface p-6 text-center shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-page-accent/12 text-page-accent">
            <Lock aria-hidden="true" className="h-7 w-7" stroke={1.8} />
          </span>
          <h1 className="mt-4 break-keep font-black text-2xl leading-snug">{paywall.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-page-ink/68 leading-7">{paywall.body}</p>

          <ul className="mt-6 grid gap-2 text-left">
            {paywall.lockedItems.map((item) => (
              <li className="flex items-center gap-2 text-page-ink/78 leading-7" key={item}>
                <Lock aria-hidden="true" className="h-4 w-4 shrink-0 text-page-ink/40" stroke={1.8} />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-page-ink/40 line-through">{paywall.listPriceLabel}</span>
            <span className="font-black text-3xl text-page-accent">{paywall.priceLabel}</span>
          </div>
        </section>

        <section className="rounded-4xl border border-page-border bg-page-surface p-6 sm:p-7">
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
            onChange={(event) => setEmail(event.target.value)}
            placeholder={paywall.emailPlaceholder}
            type="email"
            value={email}
          />

          <div className="mt-4 grid gap-3">
            <Consent checked={agreeWithdrawal} label={paywall.consentWithdrawal} onChange={setAgreeWithdrawal} />
            <Consent checked={agreePrivacy} label={paywall.consentPrivacy} onChange={setAgreePrivacy} />
          </div>

          <button
            className={cn(
              'mt-6 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white shadow-[0_20px_60px_rgba(255,77,109,0.24)] transition-colors hover:bg-page-accent/92 disabled:cursor-not-allowed disabled:bg-page-ink/20 disabled:shadow-none',
              focusClassName,
            )}
            disabled={!canSubmit}
            onClick={submit}
            type="button"
          >
            {status === 'processing' ? paywall.processing : paywall.cta}
          </button>

          {status === 'error' ? (
            <p className="mt-3 text-center font-bold text-page-accent text-sm">
              {errorMessage || paywall.errorGeneric}
            </p>
          ) : null}

          <p className="mt-4 text-page-ink/40 text-xs leading-6">{paywall.notice}</p>
        </section>

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

function Consent({ checked, label, onChange }: { checked: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-left text-page-ink/74 text-sm leading-6">
      <input
        checked={checked}
        className="mt-0.5 h-5 w-5 shrink-0 accent-page-accent"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}
