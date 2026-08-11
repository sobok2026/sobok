'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { track } from '@sobok/analytics/browser'
import { SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import { LOCALE_LANGUAGE_TAGS, type Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useRef, useState } from 'react'

import Starfield from '@/components/Starfield'
import { TURNSTILE_SITE_KEY } from '@/constants'
import { GUARDIAN_REPORT_UI } from '@/content/guardian-report-ui'
import { stellaAuthClient } from '@/lib/auth-client'
import {
  exchangeGuardianReopen,
  GUARDIAN_REOPEN_ACTION,
  GuardianApiError,
  guardianReportPaths,
  requestGuardianReopen,
  storeGuardianCheckoutSession,
} from '@/lib/guardian-paid'

type Phase = 'checking' | 'request' | 'link-ready' | 'opening' | 'accepted'

export default function GuardianReopen({ locale }: { locale: Locale }) {
  const content = GUARDIAN_REPORT_UI[locale].paid.reopen
  const paths = guardianReportPaths(locale)
  const router = useRouter()
  const { data: accountSession } = stellaAuthClient.useSession()
  const [phase, setPhase] = useState<Phase>('checking')
  const [linkToken, setLinkToken] = useState('')
  const [invalidLink, setInvalidLink] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [error, setError] = useState('')
  const turnstile = useRef<TurnstileInstance>(null)

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.hash.slice(1))
    const token = parameters.get('token') ?? ''

    // Strip the one-time credential before any challenge widget or user interaction can expose it through
    // browser history, referrers, analytics, screenshots, or copied address bars.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)

    if (/^[A-Za-z0-9_-]{43}$/.test(token)) {
      setLinkToken(token)
      setPhase('link-ready')
      track('guardian_reopen_link_view', { locale })
      return
    }

    setInvalidLink(token.length > 0)
    setPhase('request')
    track('guardian_reopen_request_view', { locale })
  }, [locale])

  async function openReport() {
    if (!linkToken || phase === 'opening') {
      return
    }
    setPhase('opening')
    setError('')

    try {
      const reopened = await exchangeGuardianReopen(linkToken)
      const destination = guardianReportPaths(reopened.locale)
      if (reopened.status === 'account') {
        const reportURL = `${destination.result}?report=${encodeURIComponent(reopened.reportPublicId)}`
        setLinkToken('')
        track('guardian_report_reopen', { locale: reopened.locale, report_status: 'account' })
        if (accountSession) {
          router.replace(reportURL)
          return
        }
        const result = await stellaAuthClient.signIn.oauth2({
          providerId: SOBOK_OIDC_PROVIDER_ID,
          callbackURL: reportURL,
          errorCallbackURL: reportURL,
        })
        if (result.error) throw new Error('account sign-in failed')
        return
      }
      storeGuardianCheckoutSession({
        locale: reopened.locale,
        collectionPublicId: reopened.collectionPublicId,
        reportPublicId: reopened.reportPublicId,
        accessToken: reopened.accessToken,
        paymentId: reopened.paymentId,
        email: reopened.recoveryEmail,
        payMethod: null,
        createdAt: Date.now(),
      })
      setLinkToken('')
      track('guardian_report_reopen', { locale: reopened.locale, report_status: reopened.reportStatus })
      router.replace(reopened.reportStatus === 'fulfilled' ? destination.result : destination.questions)
    } catch (caught) {
      if (caught instanceof GuardianApiError && caught.slug === 'reopen-link-invalid') {
        setLinkToken('')
        setInvalidLink(true)
        setPhase('request')
        return
      }

      // A transient API or network failure must not discard the credential while it is still valid.
      setError(content.genericError)
      setPhase('link-ready')
    }
  }

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!turnstileToken || phase === 'checking') {
      return
    }

    setError('')
    setPhase('checking')
    const email = String(new FormData(event.currentTarget).get('email') ?? '')
    try {
      await requestGuardianReopen({ email, locale, turnstileToken })
      setPhase('accepted')
      track('guardian_reopen_requested', { locale })
    } catch (caught) {
      setError(reopenErrorMessage(caught, content))
      setPhase('request')
      setTurnstileToken('')
      turnstile.current?.reset()
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center bg-night-sky px-3 pb-[calc(5rem+var(--safe-area-bottom))] pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <section className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#120b24]/92 p-5 shadow-2xl backdrop-blur sm:p-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
          {content.eyebrow}
        </p>

        {phase === 'checking' || phase === 'opening' ? (
          <Status icon="✦" title={phase === 'opening' ? content.linkTitle : content.title}>
            {phase === 'opening' ? content.opening : content.requesting}
          </Status>
        ) : null}

        {phase === 'link-ready' ? (
          <>
            <Status icon="☾" title={content.linkTitle}>
              {content.linkBody}
            </Status>
            <button
              className="mt-7 w-full rounded-2xl cta bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground"
              onClick={openReport}
              type="button"
            >
              {content.linkCta}
            </button>
            {error && (
              <p aria-live="polite" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs text-pink-200">
                {error}
              </p>
            )}
          </>
        ) : null}

        {phase === 'accepted' ? (
          <Status icon="✉" title={content.acceptedTitle}>
            {content.acceptedBody}
          </Status>
        ) : null}

        {phase === 'request' ? (
          <>
            {invalidLink ? (
              <Status icon="☁" title={content.invalidTitle}>
                {content.invalidBody}
              </Status>
            ) : (
              <header className="mt-5 text-center">
                <h1 className="text-balance text-2xl font-black text-white">{content.title}</h1>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">{content.body}</p>
              </header>
            )}

            <form className="mt-7" onSubmit={requestLink}>
              <label className="block text-xs font-semibold text-foreground-secondary" htmlFor="guardian-reopen-email">
                {content.emailLabel}
              </label>
              <input
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3.5 text-sm text-white outline-none placeholder:text-foreground-faint focus:border-pink-200/45 focus:ring-2 focus:ring-pink-200/10"
                id="guardian-reopen-email"
                inputMode="email"
                maxLength={254}
                name="email"
                placeholder={content.emailPlaceholder}
                required
                type="email"
              />
              <div className="mt-5 flex min-h-18 justify-center">
                <Turnstile
                  onError={() => setTurnstileToken('')}
                  onExpire={() => setTurnstileToken('')}
                  onSuccess={setTurnstileToken}
                  options={{
                    action: GUARDIAN_REOPEN_ACTION,
                    language: LOCALE_LANGUAGE_TAGS[locale],
                    responseField: false,
                    theme: 'dark',
                  }}
                  ref={turnstile}
                  siteKey={TURNSTILE_SITE_KEY}
                />
              </div>
              {error && (
                <p aria-live="polite" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs text-pink-200">
                  {error}
                </p>
              )}
              <button
                className="mt-5 w-full rounded-2xl cta bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!turnstileToken}
                type="submit"
              >
                {content.requestCta}
              </button>
              <p className="mt-4 text-xs leading-6 text-foreground-faint">{content.deliveryNote}</p>
            </form>
          </>
        ) : null}

        {phase !== 'checking' && phase !== 'opening' && (
          <Link
            className="mt-6 block text-center text-xs text-foreground-subtle underline-offset-4 hover:text-white hover:underline"
            href={paths.landing}
          >
            {content.startOverCta}
          </Link>
        )}
      </section>
    </main>
  )
}

function Status({ children, icon, title }: { children: React.ReactNode; icon: string; title: string }) {
  return (
    <div className="mt-5 text-center">
      <span
        aria-hidden
        className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-pink-200/20 bg-pink-100/10 text-2xl text-pink-100"
      >
        {icon}
      </span>
      <h1 className="mt-4 text-balance text-xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm leading-7 text-foreground-muted">{children}</p>
    </div>
  )
}

function reopenErrorMessage(error: unknown, content: (typeof GUARDIAN_REPORT_UI)[Locale]['paid']['reopen']): string {
  if (error instanceof GuardianApiError) {
    if (error.slug === 'turnstile-expired' || error.slug === 'turnstile-failed') {
      return content.turnstileError
    }
    if (error.slug === 'rate-limited') {
      return content.rateLimitedError
    }
  }
  return content.genericError
}
