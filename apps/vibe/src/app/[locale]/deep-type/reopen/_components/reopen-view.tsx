'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { DangerTriangle, Lock, MailOpen } from '@mynaui/icons-react'
import { LEGAL_CONTACT_EMAIL } from '@sobok/brand/identity'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { TURNSTILE_SITE_KEY } from '@/constants'
import type { DeepTypeReopenContent } from '@/content/deep-type-reopen'
import { cn } from '@/utils/cn'
import { DEEPTYPE_REOPEN_ACTION } from '../../../../../../worker/api/deep-type/actions'
import { FOCUS_CLASS_NAME } from '../../../../../components/focus'

import { FlowMessage, FlowPanel, FlowStatus, flowActionClassName } from '../../_components/flow-panel'
import { IntroView } from '../../_components/intro-view'
import { RefinementQuizView } from '../../_components/refinement-quiz-view'
import { ReportView } from '../../_components/report-view'
import { useReportPolling } from '../../_hooks/use-report-polling'
import { postCancel, postReopenExchange, postReopenRequest, type ReopenExchangeResponse } from '../../_lib/api'
import { readSittingWorkAnswers } from '../../_lib/sitting'
import type { DeepTypeContent } from '../../_lib/types'
import { classifyApiError, type VerificationErrorKind } from '../../_lib/verification-error'

type ReopenViewProps = {
  content: DeepTypeContent
  copy: DeepTypeReopenContent
  locale: Locale
}

type Phase = 'checking' | 'request' | 'link-ready' | 'opening' | 'report' | 'accepted'

type ReopenErrorKey =
  | 'genericError'
  | 'verificationExpiredError'
  | 'verificationFailedError'
  | 'verificationUnavailableError'

const REQUEST_ERROR_KEY_BY_KIND: Record<VerificationErrorKind, ReopenErrorKey> = {
  expired: 'verificationExpiredError',
  generic: 'genericError',
  rejected: 'verificationFailedError',
  unavailable: 'verificationUnavailableError',
}

export function ReopenView({ content, copy, locale }: ReopenViewProps) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [linkToken, setLinkToken] = useState('')
  const [invalidLink, setInvalidLink] = useState(false)
  const [access, setAccess] = useState<ReopenExchangeResponse | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestPending, setRequestPending] = useState(false)
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined)

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.hash.slice(1))
    const token = parameters.get('token') ?? ''

    // The raw one-time credential stays in the URL fragment so it never reaches edge logs or referrers.
    // Remove it from browser history before any user interaction or third-party challenge loads.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)

    if (/^[A-Za-z0-9_-]{43}$/.test(token)) {
      setLinkToken(token)
      setPhase('link-ready')
      return
    }

    setInvalidLink(token.length > 0)
    setPhase('request')
  }, [])

  async function openReport() {
    if (!linkToken) {
      return
    }
    setPhase('opening')
    try {
      const reopened = await postReopenExchange(linkToken)
      setLinkToken('')
      setAccess(reopened)
      setPhase('report')
    } catch {
      setLinkToken('')
      setInvalidLink(true)
      setPhase('request')
    }
  }

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!turnstileToken) {
      return
    }

    setRequestError('')
    setRequestPending(true)
    const email = String(new FormData(event.currentTarget).get('email') ?? '')
    try {
      await postReopenRequest({ email, locale, turnstileToken })
      setPhase('accepted')
    } catch (error) {
      // The widget resets on the next line, so an expired solve is worth naming: confirming again works,
      // and the generic "try later" copy would send someone away from a form they could finish now.
      setRequestError(copy[REQUEST_ERROR_KEY_BY_KIND[classifyApiError(error)]])
      setRequestPending(false)
      setTurnstileToken('')
      turnstileRef.current?.reset()
    }
  }

  if (phase === 'report' && access) {
    return <ReopenedAccess access={access} content={content} copy={copy} locale={locale} />
  }

  return (
    <FlowPanel eyebrow={copy.eyebrow}>
      {phase === 'checking' || phase === 'opening' ? (
        <FlowStatus
          body={phase === 'opening' ? copy.opening : copy.generatingBody}
          title={phase === 'opening' ? copy.linkTitle : copy.generatingTitle}
        />
      ) : null}

      {phase === 'link-ready' ? (
        <>
          <FlowMessage body={copy.linkBody} icon={Lock} takeFocus title={copy.linkTitle} />
          <button className={cn(flowActionClassName('primary'), 'mt-7')} onClick={openReport} type="button">
            <Lock aria-hidden="true" className="h-4 w-4" stroke={1.8} />
            {copy.linkCta}
          </button>
        </>
      ) : null}

      {phase === 'accepted' ? (
        <FlowMessage body={copy.acceptedBody} icon={MailOpen} takeFocus title={copy.acceptedTitle} tone="success" />
      ) : null}

      {phase === 'request' ? (
        <>
          {invalidLink ? (
            <FlowMessage body={copy.invalidBody} icon={DangerTriangle} takeFocus title={copy.invalidTitle} />
          ) : (
            <div className="text-center">
              <h1 className="mt-3 font-black text-2xl leading-snug">{copy.title}</h1>
              <p className="mt-3 break-prose text-foreground-secondary leading-7">{copy.body}</p>
            </div>
          )}

          <form className="mt-6" onSubmit={requestLink}>
            <label className="block font-bold text-foreground-secondary text-sm" htmlFor="deeptype-reopen-email">
              {copy.emailLabel}
            </label>
            <input
              autoComplete="email"
              className={cn(
                'mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-medium text-foreground outline-none placeholder:text-foreground-muted focus-visible:border-brand',
                FOCUS_CLASS_NAME,
              )}
              id="deeptype-reopen-email"
              inputMode="email"
              maxLength={254}
              name="email"
              placeholder={copy.emailPlaceholder}
              required
              type="email"
            />
            {/* The challenge arrives from a third-party script and mounts into a container that is zero
                height until then, so the button underneath jumps once the widget lands. Reserving the
                widget's own box (300x72) keeps the form still while it loads. */}
            <div className="mt-4 flex min-h-18 justify-center">
              <Turnstile
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
                onSuccess={setTurnstileToken}
                options={{ action: DEEPTYPE_REOPEN_ACTION, responseField: false }}
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
              />
            </div>
            <button
              className={cn(
                flowActionClassName('primary'),
                'mt-5 disabled:cursor-not-allowed disabled:bg-foreground/20 disabled:shadow-none',
              )}
              disabled={!turnstileToken || requestPending}
              type="submit"
            >
              {requestPending ? copy.requesting : copy.requestCta}
            </button>
            {requestError ? (
              <p className="mt-3 text-center font-bold text-accent text-sm" role="alert">
                {requestError}
              </p>
            ) : null}
            <p className="mt-4 text-foreground-muted text-xs leading-6">{copy.deliveryNote}</p>
          </form>
        </>
      ) : null}

      {phase !== 'checking' && phase !== 'opening' ? (
        <Link className={cn(flowActionClassName('tertiary'), 'mt-5')} href={`/${locale}/deep-type`}>
          {copy.startOverCta}
        </Link>
      ) : null}
    </FlowPanel>
  )
}

function ReopenedAccess({
  access,
  content,
  copy,
  locale,
}: {
  access: ReopenExchangeResponse
  content: DeepTypeContent
  copy: DeepTypeReopenContent
  locale: Locale
}) {
  const [phase, setPhase] = useState<'intro' | 'refinement' | 'report'>(access.refinementRequired ? 'intro' : 'report')

  if (phase === 'intro') {
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

  if (phase === 'refinement') {
    return (
      <RefinementQuizView
        accessToken={access.accessToken}
        content={content}
        // A re-open link may be opened on another device, where no sitting exists. The parked draft carries the
        // free drain answers in that case; otherwise the Worker refuses an incomplete forced-choice set rather
        // than scoring a partial one.
        freeWorkAnswers={readSittingWorkAnswers()}
        locale={locale}
        onComplete={() => setPhase('report')}
      />
    )
  }

  return <ReopenedReport access={access} content={content} copy={copy} locale={locale} />
}

function ReopenedReport({
  access,
  content,
  copy,
  locale,
}: {
  access: ReopenExchangeResponse
  content: DeepTypeContent
  copy: DeepTypeReopenContent
  locale: Locale
}) {
  const report = useReportPolling(access.accessToken)
  const [refund, setRefund] = useState<'idle' | 'pending' | 'done' | 'failed'>('idle')

  async function requestRefund() {
    setRefund('pending')
    try {
      const response = await postCancel(access.accessToken)
      setRefund(response.status === 'refunded' ? 'done' : 'failed')
    } catch {
      setRefund('failed')
    }
  }

  if (report.phase === 'generating') {
    return (
      <FlowPanel eyebrow={copy.eyebrow}>
        <FlowStatus body={copy.generatingBody} title={copy.generatingTitle} />
      </FlowPanel>
    )
  }

  if (report.phase === 'failed') {
    return (
      <FlowPanel eyebrow={copy.eyebrow}>
        <FlowMessage
          body={copy.reportFailedBody}
          icon={DangerTriangle}
          takeFocus
          title={copy.reportFailedTitle}
          tone="danger"
        >
          {refund === 'done' ? (
            <p className="mt-4 text-foreground-secondary text-sm">{content.paywall.refundDone}</p>
          ) : null}
          {refund === 'failed' ? (
            <p className="mt-4 text-foreground-secondary text-sm">{content.paywall.refundFailed}</p>
          ) : null}
        </FlowMessage>
        {/* An accent outline rather than the panel's own secondary weight, because undoing a purchase is the
            one action in this flow that is neither the happy path nor a neutral way out — the same treatment
            the report's own failure screen gives it. */}
        {refund === 'idle' || refund === 'pending' ? (
          <button
            className={cn(
              flowActionClassName('secondary'),
              'mt-7 border-accent/45 text-accent hover:border-accent/45 hover:bg-brand/8 hover:text-accent disabled:opacity-60',
            )}
            disabled={refund === 'pending'}
            onClick={requestRefund}
            type="button"
          >
            {refund === 'pending' ? content.paywall.refundPending : content.paywall.refundCta}
          </button>
        ) : null}
        <p className="mt-5 text-center text-foreground-muted text-xs">
          <a className="underline underline-offset-2" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
        </p>
      </FlowPanel>
    )
  }

  // No strip over the document. The expiry used to be announced twice on this route and nowhere on the other
  // two — once in a band above the report and once inside it — so it says it where every route says it, in the
  // order record at the foot, and this screen adds the order number the others already had.
  return (
    <ReportView
      accessExpiresAt={report.accessExpiresAt ?? access.accessExpiresAt}
      content={content}
      locale={locale}
      narrativePending={report.narrativePending}
      narrativeSections={report.narrative}
      onRestart={() => window.location.assign(`/${locale}/deep-type`)}
      orderId={access.paymentId}
      paidAt={report.paidAt}
      profile={report.profile}
      sections={report.sections}
    />
  )
}
