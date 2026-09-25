'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { SOBOK_OIDC_PROVIDER_ID } from '@sobok/auth/contracts'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Starfield from '@/components/Starfield'
import { TURNSTILE_LANGUAGE_TAGS, TURNSTILE_SITE_KEY } from '@/constants'
import { GUARDIAN_DAILY_UI as copy } from '@/content/guardian-daily-ui'
import { stellaAuthClient } from '@/lib/auth-client'
import {
  exchangeGuardianPassReopen,
  GUARDIAN_PASS_REOPEN_ACTION,
  GuardianApiError,
  guardianPassPaths,
  requestGuardianPassReopen,
  storeGuardianPassSession,
} from '@/lib/guardian-daily'

type State = 'idle' | 'submitting' | 'accepted' | 'exchanging' | 'account' | 'invalid' | 'error'

export default function GuardianPassReopen({ locale }: { locale: Locale }) {
  const paths = guardianPassPaths(locale)
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstile = useRef<TurnstileInstance>(null)

  useEffect(() => {
    if (locale !== 'ko') return
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    if (!token) return
    window.history.replaceState(null, '', window.location.pathname)
    let cancelled = false
    setState('exchanging')
    void exchangeGuardianPassReopen(token)
      .then((result) => {
        if (cancelled) return
        if (result.status === 'account') {
          setState('account')
          return
        }
        storeGuardianPassSession({
          locale: 'ko',
          collectionPublicId: result.collectionPublicId,
          accessToken: result.accessToken,
          paymentId: result.paymentId,
          payMethod: null,
          accessExpiresAt: result.accessExpiresAt,
          createdAt: Date.now(),
          claimed: false,
        })
        window.location.replace(paths.tomorrow)
      })
      .catch((error) => {
        if (cancelled) return
        setState(error instanceof GuardianApiError && error.slug === 'reopen-link-invalid' ? 'invalid' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [locale, paths.tomorrow])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locale !== 'ko' || !turnstileToken || state === 'submitting') return
    setState('submitting')
    try {
      await requestGuardianPassReopen({ locale: 'ko', email: email.trim(), turnstileToken })
      setState('accepted')
    } catch {
      setState('error')
    } finally {
      setTurnstileToken('')
      turnstile.current?.reset()
    }
  }

  async function signIn() {
    const callbackURL = paths.account
    await stellaAuthClient.signIn.oauth2({
      providerId: SOBOK_OIDC_PROVIDER_ID,
      callbackURL,
      errorCallbackURL: callbackURL,
    })
  }

  return (
    <main className="relative min-h-dvh bg-night-sky px-3 pb-16 pt-[calc(5rem+var(--safe-area-top))] text-foreground sm:px-4">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
      <section className="relative z-10 mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-[#120b24]/92 p-6 shadow-2xl sm:p-7">
        <Link className="text-xs text-foreground-subtle underline-offset-4 hover:underline" href={paths.tomorrow}>
          ← {copy.reopen.back}
        </Link>
        <header className="mt-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">{copy.reopen.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black text-white">{copy.reopen.title}</h1>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">{copy.reopen.body}</p>
        </header>

        {locale !== 'ko' ? (
          <p className="mt-6 text-center text-sm text-foreground-muted">한국어로 제공하는 상품이에요.</p>
        ) : state === 'exchanging' ? (
          <p className="mt-8 animate-pulse text-center text-sm text-foreground-muted motion-reduce:animate-none">
            {copy.reopen.exchanging}
          </p>
        ) : state === 'account' ? (
          <div className="mt-7 text-center">
            <p className="text-sm leading-6 text-foreground-muted">{copy.reopen.account}</p>
            <button
              className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold"
              onClick={() => void signIn()}
              type="button"
            >
              소복 계정으로 로그인
            </button>
          </div>
        ) : (
          <form className="mt-7" onSubmit={submit}>
            <label className="text-xs font-semibold text-foreground-secondary" htmlFor="guardian-reopen-email">
              {copy.reopen.emailLabel}
            </label>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-pink-200/40"
              id="guardian-reopen-email"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-3">
              <Turnstile
                onExpire={() => setTurnstileToken('')}
                onSuccess={setTurnstileToken}
                options={{
                  action: GUARDIAN_PASS_REOPEN_ACTION,
                  language: TURNSTILE_LANGUAGE_TAGS[locale],
                  theme: 'dark',
                }}
                ref={turnstile}
                siteKey={TURNSTILE_SITE_KEY}
              />
            </div>
            {(state === 'accepted' || state === 'invalid' || state === 'error') && (
              <p
                aria-live="polite"
                className={`mt-4 rounded-xl px-3 py-2 text-xs leading-5 ${
                  state === 'accepted' ? 'bg-positive/10 text-positive' : 'bg-danger/10 text-pink-200'
                }`}
              >
                {state === 'accepted'
                  ? copy.reopen.accepted
                  : state === 'invalid'
                    ? copy.reopen.invalid
                    : copy.reopen.error}
              </p>
            )}
            <button
              className="mt-5 w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-45"
              disabled={!turnstileToken || state === 'submitting'}
              type="submit"
            >
              {state === 'submitting' ? copy.reopen.submitting : copy.reopen.submit}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
