'use client'

import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { DeepTypeCheckoutReturnContent } from '@/content/deep-type-checkout-return'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../../../components/focus'

import { DynamicReportView } from '../../_components/dynamic-report-view'
import { IntroView } from '../../_components/intro-view'
import { RefinementQuizView } from '../../_components/refinement-quiz-view'
import { postVerify } from '../../_lib/api'
import { clearPendingCheckout, type PendingCheckout, readPendingCheckout } from '../../_lib/pending-checkout'
import { readSittingWorkAnswers } from '../../_lib/sitting'
import type { DeepTypeContent } from '../../_lib/types'

type CheckoutReturnViewProps = {
  content: DeepTypeContent
  copy: DeepTypeCheckoutReturnContent
  locale: Locale
}

type Phase = 'checking' | 'error' | 'intro' | 'refinement' | 'report'

export function CheckoutReturnView({ content, copy, locale }: CheckoutReturnViewProps) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [pending, setPending] = useState<PendingCheckout | null>(null)

  const verifyPayment = useCallback(async (candidate: PendingCheckout) => {
    setPending(candidate)
    setPhase('checking')
    try {
      const verified = await postVerify(candidate.paymentId)
      setPhase(verified.status === 'paid' ? 'intro' : 'error')
    } catch {
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search)
    const paymentId = parameters.get('paymentId') ?? ''
    const failed = parameters.has('code')
    window.history.replaceState(null, '', window.location.pathname)

    if (failed) {
      clearPendingCheckout()
      setPhase('error')
      return
    }

    const candidate = readPendingCheckout(paymentId || undefined)
    if (!candidate) {
      setPhase('error')
      return
    }
    void verifyPayment(candidate)
  }, [verifyPayment])

  if (phase === 'intro' && pending) {
    return (
      <IntroView
        body={content.paywall.refinementIntroBody}
        cta={content.paywall.refinementIntroCta}
        hint={content.paywall.refinementIntroHint}
        onNext={() => setPhase('refinement')}
        title={content.paywall.refinementIntroTitle}
      />
    )
  }

  if (phase === 'refinement' && pending) {
    return (
      <RefinementQuizView
        accessToken={pending.accessToken}
        content={content}
        // The PortOne redirect lands in the same tab, so the free sitting is still in session storage here.
        freeWorkAnswers={readSittingWorkAnswers()}
        locale={locale}
        onComplete={() => setPhase('report')}
      />
    )
  }

  if (phase === 'report' && pending) {
    return (
      <DynamicReportView
        accessToken={pending.accessToken}
        content={content}
        // This tab arrived from the PortOne redirect, so it never held the free answers. Nothing to fall back
        // to; a generation failure shows the banner and the refund CTA alone.
        fallbackProfile={null}
        locale={locale}
        onRestart={() => {
          clearPendingCheckout()
          window.location.assign(`/${locale}/deep-type`)
        }}
      />
    )
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-12 text-page-ink" id="main-content">
      <section className="w-full max-w-lg rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-6 text-center shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
        <p className="font-bold text-page-accent text-sm">{copy.eyebrow}</p>
        {phase === 'checking' ? (
          <div aria-live="polite" className="py-5">
            <div
              aria-hidden="true"
              className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent motion-reduce:animate-none"
            />
            <h1 className="mt-5 break-keep font-black text-2xl">{copy.checkingTitle}</h1>
            <p className="mt-3 break-keep text-page-ink/64 leading-7">{copy.checkingBody}</p>
          </div>
        ) : (
          <>
            <h1 className="mt-3 break-keep font-black text-2xl">{copy.errorTitle}</h1>
            <p className="mt-3 break-keep text-page-ink/64 leading-7">{copy.errorBody}</p>
            {pending ? (
              <button
                className={cn(
                  'mt-6 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white hover:bg-page-accent/92',
                  FOCUS_CLASS_NAME,
                )}
                onClick={() => verifyPayment(pending)}
                type="button"
              >
                {copy.retryCta}
              </button>
            ) : null}
            <Link
              className={cn(
                'mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-page-border font-bold text-page-ink/70 text-sm hover:text-page-ink',
                FOCUS_CLASS_NAME,
              )}
              href={`/${locale}/deep-type/reopen`}
            >
              {copy.reopenCta}
            </Link>
            <Link
              className={cn(
                'mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full font-bold text-page-ink/54 text-sm hover:text-page-ink',
                FOCUS_CLASS_NAME,
              )}
              href={`/${locale}/deep-type`}
            >
              {copy.startOverCta}
            </Link>
          </>
        )}
      </section>
    </main>
  )
}
