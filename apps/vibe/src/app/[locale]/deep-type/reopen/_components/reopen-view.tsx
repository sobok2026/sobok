import { FOCUS_CLASS_NAME } from '../../../../../components/focus'

;('use client')

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { Lock } from '@mynaui/icons-react'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { LEGAL_CONTACT_EMAIL, TURNSTILE_SITE_KEY } from '@/constants'
import type { DeepTypeReopenContent } from '@/content/deep-type-reopen'
import { cn } from '@/utils/cn'
import { DEEPTYPE_REOPEN_ACTION } from '../../../../../../worker/api/deep-type/actions'

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
    <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-12 text-page-ink" id="main-content">
      <section className="w-full max-w-lg rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-6 shadow-[0_24px_90px_rgba(36,22,23,0.08)] sm:p-8">
        <p className="font-bold text-page-accent text-sm">{copy.eyebrow}</p>

        {phase === 'checking' || phase === 'opening' ? (
          <StatusPanel
            body={phase === 'opening' ? copy.opening : copy.generatingBody}
            title={phase === 'opening' ? copy.linkTitle : copy.generatingTitle}
          />
        ) : null}

        {phase === 'link-ready' ? (
          <>
            <h1 className="mt-3 break-keep font-black text-2xl leading-snug">{copy.linkTitle}</h1>
            <p className="mt-3 break-keep text-page-ink/66 leading-7">{copy.linkBody}</p>
            <button
              className={cn(
                'mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-page-accent px-6 font-black text-sm text-white transition-colors hover:bg-page-accent/92',
                FOCUS_CLASS_NAME,
              )}
              onClick={openReport}
              type="button"
            >
              <Lock aria-hidden="true" className="h-4 w-4" stroke={1.8} />
              {copy.linkCta}
            </button>
          </>
        ) : null}

        {phase === 'accepted' ? (
          <div aria-live="polite">
            <h1 className="mt-3 break-keep font-black text-2xl leading-snug">{copy.acceptedTitle}</h1>
            <p className="mt-3 break-keep text-page-ink/66 leading-7">{copy.acceptedBody}</p>
          </div>
        ) : null}

        {phase === 'request' ? (
          <>
            {invalidLink ? (
              <div className="mt-4 rounded-3xl border border-page-accent/30 bg-page-accent/8 p-4" role="alert">
                <h1 className="font-black text-lg text-page-accent">{copy.invalidTitle}</h1>
                <p className="mt-2 text-page-ink/66 text-sm leading-6">{copy.invalidBody}</p>
              </div>
            ) : (
              <>
                <h1 className="mt-3 break-keep font-black text-2xl leading-snug">{copy.title}</h1>
                <p className="mt-3 break-keep text-page-ink/66 leading-7">{copy.body}</p>
              </>
            )}

            <form className="mt-6" onSubmit={requestLink}>
              <label className="block font-bold text-page-ink/70 text-sm" htmlFor="deeptype-reopen-email">
                {copy.emailLabel}
              </label>
              <input
                autoComplete="email"
                className={cn(
                  'mt-2 min-h-12 w-full rounded-2xl border border-page-border bg-white px-4 font-medium text-page-ink outline-none placeholder:text-page-ink/36 focus-visible:border-page-accent',
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
                  'mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-page-accent px-6 font-black text-sm text-white transition-colors hover:bg-page-accent/92 disabled:cursor-not-allowed disabled:bg-page-ink/20',
                  FOCUS_CLASS_NAME,
                )}
                disabled={!turnstileToken || requestPending}
                type="submit"
              >
                {requestPending ? copy.requesting : copy.requestCta}
              </button>
              {requestError ? (
                <p className="mt-3 text-center font-bold text-page-accent text-sm" role="alert">
                  {requestError}
                </p>
              ) : null}
              <p className="mt-4 text-page-ink/44 text-xs leading-6">{copy.deliveryNote}</p>
            </form>
          </>
        ) : null}

        {phase !== 'checking' && phase !== 'opening' ? (
          <Link
            className={cn(
              'mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full font-bold text-page-ink/54 text-sm hover:text-page-ink',
              FOCUS_CLASS_NAME,
            )}
            href={`/${locale}/deep-type`}
          >
            {copy.startOverCta}
          </Link>
        ) : null}
      </section>
    </main>
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

function StatusPanel({ body, title }: { body: string; title: string }) {
  return (
    <div aria-live="polite" className="py-6 text-center">
      <div
        aria-hidden="true"
        className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-page-accent/20 border-t-page-accent"
      />
      <h1 className="mt-5 break-keep font-black text-xl">{title}</h1>
      <p className="mt-2 text-page-ink/62 text-sm leading-6">{body}</p>
    </div>
  )
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
      <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-16 text-page-ink">
        <StatusPanel body={copy.generatingBody} title={copy.generatingTitle} />
      </main>
    )
  }

  if (report.phase === 'failed') {
    return (
      <main className="flex flex-1 items-center justify-center bg-page-bg px-safe py-12 text-page-ink">
        <section className="w-full max-w-lg rounded-3xl sm:rounded-4xl border border-page-border bg-page-surface p-6 text-center sm:p-8">
          <h1 className="font-black text-2xl">{copy.reportFailedTitle}</h1>
          <p className="mt-3 text-page-ink/64 leading-7">{copy.reportFailedBody}</p>
          {refund === 'done' ? <p className="mt-4 text-page-ink/64 text-sm">{content.paywall.refundDone}</p> : null}
          {refund === 'failed' ? <p className="mt-4 text-page-ink/64 text-sm">{content.paywall.refundFailed}</p> : null}
          {refund === 'idle' || refund === 'pending' ? (
            <button
              className={cn(
                'mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-page-accent/50 px-5 font-bold text-page-accent text-sm hover:bg-page-accent/8 disabled:opacity-60',
                FOCUS_CLASS_NAME,
              )}
              disabled={refund === 'pending'}
              onClick={requestRefund}
              type="button"
            >
              {refund === 'pending' ? content.paywall.refundPending : content.paywall.refundCta}
            </button>
          ) : null}
          <p className="mt-5 text-page-ink/48 text-xs">
            <a className="underline underline-offset-2" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </main>
    )
  }

  const accessDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(access.accessExpiresAt))

  return (
    <div className="flex flex-1 flex-col">
      <p className="bg-page-soft px-safe py-3 text-center text-page-ink/52 text-xs">
        {copy.accessUntil.replace('{date}', accessDate)}
      </p>
      <ReportView
        content={content}
        locale={locale}
        narrativePending={report.narrativePending}
        narrativeSections={report.narrative}
        onRestart={() => window.location.assign(`/${locale}/deep-type`)}
        profile={report.profile}
        sections={report.sections}
      />
    </div>
  )
}
