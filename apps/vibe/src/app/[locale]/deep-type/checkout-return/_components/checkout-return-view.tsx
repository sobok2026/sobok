'use client'

import {
  CheckCircle,
  ClockCircle,
  CreditCard,
  CreditCardX,
  DangerTriangle,
  Headphones,
  type Icon,
  InfoCircle,
  Mail,
  Refresh,
} from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LEGAL_CONTACT_EMAIL } from '@/constants'
import type { DeepTypeCheckoutReturnAction, DeepTypeCheckoutReturnContent } from '@/content/deep-type-checkout-return'

import { DynamicReportView } from '../../_components/dynamic-report-view'
import {
  type FlowActionEmphasis,
  FlowMessage,
  FlowPanel,
  FlowStatus,
  type FlowTone,
  flowActionClassName,
} from '../../_components/flow-panel'
import { IntroView } from '../../_components/intro-view'
import { RefinementQuizView } from '../../_components/refinement-quiz-view'
import { postVerify } from '../../_lib/api'
import {
  type CheckoutFailure,
  RETRYABLE_FAILURES,
  SLOW_HINT_MS,
  VERIFY_RETRY_DELAYS_MS,
  VERIFY_TIMEOUT_MS,
  verifyFailure,
} from '../../_lib/checkout-outcome'
import { trackCheckoutReturn } from '../../_lib/checkout-return-analytics'
import { clearPendingCheckout, type PendingCheckout, readPendingCheckout } from '../../_lib/pending-checkout'
import { formatPrice } from '../../_lib/price'
import { readSittingWorkAnswers } from '../../_lib/sitting'
import type { DeepTypeContent } from '../../_lib/types'

type CheckoutReturnViewProps = {
  content: DeepTypeContent
  copy: DeepTypeCheckoutReturnContent
  locale: Locale
}

/**
 * `pending` rides on the three phases that need it so the render never has to prove it is there. The paid
 * phases are unreachable without it — a tab that cannot produce an access token cannot open a report, however
 * the payment went.
 */
type Phase =
  | { failure: CheckoutFailure; kind: 'failed'; pgMessage: string }
  | { kind: 'checking' }
  | { kind: 'intro'; pending: PendingCheckout }
  | { kind: 'paidElsewhere' }
  | { kind: 'refinement'; pending: PendingCheckout }
  | { kind: 'report'; pending: PendingCheckout }

/** What a verification runs against: the id to confirm, and the credential to continue with if there is one. */
type VerifyTarget = { paymentId: string; pending: PendingCheckout | null }

const TONE_BY_FAILURE: Record<CheckoutFailure, FlowTone> = {
  declined: 'accent',
  // The only state where money moved and the product is deliberately withheld. It is not a retry and it is
  // not the buyer's mistake, so it does not wear the same colour as "try again".
  mismatch: 'danger',
  noContext: 'accent',
  notFound: 'accent',
  pending: 'accent',
  refunded: 'accent',
  unavailable: 'accent',
}

const MARK_BY_FAILURE: Record<CheckoutFailure, Icon> = {
  declined: CreditCardX,
  mismatch: DangerTriangle,
  noContext: InfoCircle,
  notFound: InfoCircle,
  pending: ClockCircle,
  refunded: InfoCircle,
  unavailable: Refresh,
}

/**
 * The recoveries each state offers, best first — the head of the list is the panel's primary button and there
 * is never more than one.
 *
 * The ordering is the whole point of separating the states. `declined` leads with paying again because
 * nothing was charged and there is no report to find; `pending` leads with checking again because the PG may
 * simply be late; `mismatch` offers support and nothing else, because every other action would either fail or
 * charge a second time against an order that is already under review.
 */
const ACTIONS_BY_FAILURE: Record<CheckoutFailure, readonly DeepTypeCheckoutReturnAction[]> = {
  declined: ['payAgain', 'reopen', 'restart'],
  mismatch: ['contact'],
  noContext: ['reopen', 'restart'],
  notFound: ['reopen', 'payAgain', 'restart'],
  pending: ['retry', 'reopen', 'contact'],
  refunded: ['restart', 'contact'],
  unavailable: ['retry', 'reopen', 'contact'],
}

/**
 * `payAgain` goes to the result screen and not the landing page: the free sitting is still in this tab's
 * session storage, so that route re-scores it and puts the buyer back on their own result with the unlock CTA
 * one tap away. If the sitting is gone it redirects to the test on its own, which is the honest fallback.
 */
const HREF_BY_ACTION: Record<'payAgain' | 'reopen' | 'restart', (locale: Locale) => string> = {
  payAgain: (locale) => `/${locale}/deep-type/result`,
  reopen: (locale) => `/${locale}/deep-type/reopen`,
  restart: (locale) => `/${locale}/deep-type`,
}

const MARK_BY_ACTION: Record<DeepTypeCheckoutReturnAction, Icon> = {
  contact: Headphones,
  payAgain: CreditCard,
  reopen: Mail,
  restart: Refresh,
  retry: Refresh,
}

type VerifyOutcome = { failure: CheckoutFailure; kind: 'failed' } | { kind: 'paid'; refinementRequired: boolean }

/**
 * One attempt, with its own deadline. Without it a Worker cold start behind a stalled Hyperdrive is a spinner
 * that never resolves and offers nothing to press — on the screen a buyer reaches straight after paying.
 */
async function verifyOnce(paymentId: string, signal: AbortSignal): Promise<VerifyOutcome> {
  const attempt = new AbortController()
  const abort = () => attempt.abort()
  const timer = setTimeout(abort, VERIFY_TIMEOUT_MS)
  signal.addEventListener('abort', abort, { once: true })

  try {
    const verified = await postVerify(paymentId, attempt.signal)
    return verified.status === 'paid'
      ? { kind: 'paid', refinementRequired: verified.refinementRequired }
      : { failure: 'pending', kind: 'failed' }
  } catch (error) {
    return { failure: verifyFailure(error), kind: 'failed' }
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', abort)
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout>
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    timer = setTimeout(finish, ms)
    signal.addEventListener('abort', finish, { once: true })
  })
}

export function CheckoutReturnView({ content, copy, locale }: CheckoutReturnViewProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' })
  const [slow, setSlow] = useState(false)
  const [target, setTarget] = useState<VerifyTarget | null>(null)
  const running = useRef<AbortController | null>(null)

  const verify = useCallback(
    async (next: VerifyTarget) => {
      running.current?.abort()
      const controller = new AbortController()
      running.current = controller

      setTarget(next)
      setPhase({ kind: 'checking' })
      setSlow(false)
      const slowTimer = setTimeout(() => setSlow(true), SLOW_HINT_MS)

      try {
        for (let attempt = 0; ; attempt += 1) {
          const outcome = await verifyOnce(next.paymentId, controller.signal)

          if (controller.signal.aborted) {
            return
          }

          if (outcome.kind === 'paid') {
            trackCheckoutReturn(next.pending ? 'paid' : 'paidElsewhere', locale, attempt + 1)
            if (!next.pending) {
              setPhase({ kind: 'paidElsewhere' })
              return
            }
            // The server says whether the paid block is still unanswered. Before it did, coming back to this
            // URL a second time re-ran twenty-four questions whose answers `POST /refinement` then dropped.
            setPhase(
              outcome.refinementRequired
                ? { kind: 'intro', pending: next.pending }
                : { kind: 'report', pending: next.pending },
            )
            return
          }

          if (RETRYABLE_FAILURES.has(outcome.failure) && attempt < VERIFY_RETRY_DELAYS_MS.length) {
            await delay(VERIFY_RETRY_DELAYS_MS[attempt], controller.signal)
            if (controller.signal.aborted) {
              return
            }
            continue
          }

          trackCheckoutReturn(outcome.failure, locale, attempt + 1)
          setPhase({ failure: outcome.failure, kind: 'failed', pgMessage: '' })
          return
        }
      } finally {
        clearTimeout(slowTimer)
      }
    },
    [locale],
  )

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search)
    const paymentId = parameters.get('paymentId') ?? ''
    const code = parameters.get('code')
    const pgMessage = parameters.get('message') ?? ''
    // Off the URL before anything else runs: a payment id has no business in history, referrers or a shared link.
    window.history.replaceState(null, '', window.location.pathname)

    if (code === null) {
      const candidate = readPendingCheckout(paymentId || undefined)
      // The id from the URL when this tab has lost its own copy — an in-app browser handing off, a return
      // that landed in a new tab. The payment is still real and `POST /verify` is still the call that grants
      // it; what is gone is the access token, so the report is reached by e-mail rather than from here.
      const next = candidate?.paymentId ?? paymentId

      if (next) {
        void verify({ paymentId: next, pending: candidate })
      } else {
        trackCheckoutReturn('noContext', locale, 0)
        setPhase({ failure: 'noContext', kind: 'failed', pgMessage: '' })
      }
    } else {
      // PortOne redirects failures back with `code` and `message`. The payment never completed, so the
      // pending marker is spent; the PG's own sentence is kept and shown, because it is the only account of
      // what went wrong that anyone has.
      clearPendingCheckout()
      trackCheckoutReturn('declined', locale, 0)
      setPhase({ failure: 'declined', kind: 'failed', pgMessage })
    }

    return () => running.current?.abort()
  }, [locale, verify])

  if (phase.kind === 'intro') {
    return (
      <IntroView
        body={content.paywall.refinementIntroBody}
        cta={content.paywall.refinementIntroCta}
        hint={content.paywall.refinementIntroHint}
        notice={<PaidNotice copy={copy} locale={locale} pending={phase.pending} />}
        onNext={() => setPhase({ kind: 'refinement', pending: phase.pending })}
        title={content.paywall.refinementIntroTitle}
      />
    )
  }

  if (phase.kind === 'refinement') {
    return (
      <RefinementQuizView
        accessToken={phase.pending.accessToken}
        content={content}
        // The PortOne redirect lands in the same tab, so the free sitting is still in session storage here.
        freeWorkAnswers={readSittingWorkAnswers()}
        locale={locale}
        onComplete={() => setPhase({ kind: 'report', pending: phase.pending })}
      />
    )
  }

  if (phase.kind === 'report') {
    return (
      <DynamicReportView
        accessToken={phase.pending.accessToken}
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

  if (phase.kind === 'checking') {
    return (
      <FlowPanel eyebrow={copy.eyebrow}>
        <FlowStatus
          body={copy.checking.body}
          hint={slow ? copy.checking.hint : undefined}
          title={copy.checking.title}
        />
      </FlowPanel>
    )
  }

  if (phase.kind === 'paidElsewhere') {
    return (
      <FlowPanel eyebrow={copy.eyebrow}>
        <FlowMessage
          body={copy.paidElsewhere.body}
          icon={CheckCircle}
          takeFocus
          title={copy.paidElsewhere.title}
          tone="success"
        >
          <Reference copy={copy} paymentId={target?.paymentId ?? ''} />
        </FlowMessage>
        <Actions
          actions={['reopen', 'restart']}
          copy={copy}
          locale={locale}
          onRetry={() => target && verify(target)}
          paymentId={target?.paymentId ?? ''}
        />
      </FlowPanel>
    )
  }

  const reason = copy.reasons[phase.failure]

  return (
    <FlowPanel eyebrow={copy.eyebrow}>
      <FlowMessage
        body={reason.body}
        icon={MARK_BY_FAILURE[phase.failure]}
        takeFocus
        title={reason.title}
        tone={TONE_BY_FAILURE[phase.failure]}
      >
        {phase.pgMessage ? (
          <p className="mt-4 break-keep rounded-2xl bg-page-soft px-4 py-3 text-page-ink/62 text-sm leading-6">
            {copy.pgMessage.replace('{message}', phase.pgMessage)}
          </p>
        ) : null}
        <Reference copy={copy} paymentId={target?.paymentId ?? ''} />
      </FlowMessage>
      <Actions
        actions={ACTIONS_BY_FAILURE[phase.failure]}
        copy={copy}
        locale={locale}
        onRetry={() => target && verify(target)}
        paymentId={target?.paymentId ?? ''}
      />
    </FlowPanel>
  )
}

/**
 * The confirmation the screen never gave. A buyer came back from the PG, watched a spinner, and was handed a
 * questionnaire — with no statement anywhere that the payment had gone through, what it cost, or where the
 * receipt was going.
 *
 * The e-mail is on it deliberately. A mistyped address is the one error that permanently costs someone the
 * report they paid for, and this is the last screen where anyone can still catch it.
 */
function PaidNotice({
  copy,
  locale,
  pending,
}: {
  copy: DeepTypeCheckoutReturnContent
  locale: Locale
  pending: PendingCheckout
}) {
  return (
    <div className="mx-auto mb-9 flex max-w-md items-start gap-3 rounded-3xl border border-page-success/24 bg-page-success/8 p-4 text-left">
      <CheckCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-page-success" stroke={1.8} />
      <div>
        <p className="font-black text-sm">{copy.paid.title}</p>
        <p className="mt-1 break-keep text-page-ink/68 text-sm leading-6">
          {copy.paid.body.replace('{price}', formatPrice(locale, pending.currency, pending.amount))}
        </p>
        <p className="mt-1 break-keep text-page-ink/68 text-sm leading-6">
          {copy.paid.emailNote.replace('{email}', pending.email)}
        </p>
        <p className="mt-2 break-all text-page-ink/40 text-xs leading-5">
          {copy.orderReference.replace('{id}', pending.paymentId)}
        </p>
      </div>
    </div>
  )
}

/** The one string support will ask for. Rendered wherever there is an id, and left out when there is not. */
function Reference({ copy, paymentId }: { copy: DeepTypeCheckoutReturnContent; paymentId: string }) {
  if (!paymentId) {
    return null
  }
  return (
    <p className="mt-4 break-all text-page-ink/40 text-xs leading-5">
      {copy.orderReference.replace('{id}', paymentId)}
    </p>
  )
}

function emphasisAt(index: number): FlowActionEmphasis {
  if (index === 0) {
    return 'primary'
  }
  return index === 1 ? 'secondary' : 'tertiary'
}

function Actions({
  actions,
  copy,
  locale,
  onRetry,
  paymentId,
}: {
  actions: readonly DeepTypeCheckoutReturnAction[]
  copy: DeepTypeCheckoutReturnContent
  locale: Locale
  onRetry: () => void
  paymentId: string
}) {
  return (
    <div className="mt-7 grid gap-2">
      {actions.map((action, index) => {
        const emphasis = emphasisAt(index)
        const className = flowActionClassName(emphasis)
        // Only the primary carries its glyph. Three icons down a stack of three reads as three equal choices,
        // which is exactly what the ordering exists to deny.
        const Mark = emphasis === 'primary' ? MARK_BY_ACTION[action] : null
        const label = (
          <>
            {Mark ? <Mark aria-hidden="true" className="h-4 w-4" stroke={1.8} /> : null}
            {copy.actions[action]}
          </>
        )

        if (action === 'retry') {
          return (
            <button className={className} key={action} onClick={onRetry} type="button">
              {label}
            </button>
          )
        }

        if (action === 'contact') {
          const subject = encodeURIComponent(copy.contactSubject.replace('{id}', paymentId))
          return (
            <a className={className} href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=${subject}`} key={action}>
              {label}
            </a>
          )
        }

        return (
          <Link className={className} href={HREF_BY_ACTION[action](locale)} key={action}>
            {label}
          </Link>
        )
      })}
    </div>
  )
}
