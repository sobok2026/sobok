'use client'

import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { Info, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import PasswordInput from '@/components/PasswordInput'
import TurnstileWidget from '@/components/TurnstileWidget'
import { Link } from '@/i18n/navigation'
import { getAuthRedirectHref, getCurrentAuthRedirect } from '@/lib/auth-redirect'

import { authInputClassName as inputClassName, authTrailingButtonClassName as trailingButtonClassName } from '../field'
import {
  clearSignupInputValidity,
  clearSignupUsername,
  clearSignupValidity,
  getSignupInput,
  reportInputValidity,
} from './signup-form'
import useSignupMutation from './useSignupMutation'

// better-auth username 플러그인의 기본 검증 규칙(3–30자, 영문·숫자·_·.)과 동일하게 맞춘다.
const USERNAME_PATTERN = '^[a-zA-Z0-9_.]+$'

export default function SignupForm() {
  const [hasTurnstileToken, setHasTurnstileToken] = useState(false)
  const [loginHref, setLoginHref] = useState('/auth/login')
  const turnstileRef = useRef<TurnstileInstance>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const t = useTranslations('Auth.signup')

  function resetTurnstile() {
    turnstileRef.current?.reset()
    setHasTurnstileToken(false)
  }

  const { mutate: submitSignup, isPending } = useSignupMutation({
    onError: (error) => {
      resetTurnstile()
      clearSignupValidity(formRef.current)
      toast.warning(error.message || t('fallbackError'))
    },
  })

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    clearSignupValidity(e.currentTarget)

    const turnstileToken = turnstileRef.current?.getResponse()

    if (!turnstileToken) {
      resetTurnstile()
      toast.warning(t('turnstileRequired'))
      return
    }

    const formData = new FormData(e.currentTarget)

    const body = {
      email: String(formData.get('email') ?? ''),
      username: String(formData.get('username') ?? ''),
      nickname: String(formData.get('nickname') ?? ''),
      password: String(formData.get('password') ?? ''),
      turnstileToken,
    }

    const passwordConfirm = String(formData.get('password-confirm') ?? '')

    if (body.password !== passwordConfirm) {
      reportInputValidity(getSignupInput(e.currentTarget, 'password-confirm'), t('passwordMismatch'))
      return
    }

    if (body.username === body.password) {
      reportInputValidity(getSignupInput(e.currentTarget, 'password'), t('passwordSameAsUsername'))
      return
    }

    submitSignup(body)
  }

  function handleTurnstileTokenChange(token: string) {
    setHasTurnstileToken(Boolean(token))
  }

  useEffect(() => {
    const redirect = getCurrentAuthRedirect()

    if (redirect) {
      setLoginHref(getAuthRedirectHref('/auth/login', redirect))
    }
  }, [])

  return (
    <div className="grid gap-6 sm:gap-7">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h2>
        <p className="mt-2 text-sm text-foreground-muted">{t('description')}</p>
      </div>

      <form
        className="grid gap-5"
        id="signup-form"
        name="signup"
        onInput={(e) => clearSignupInputValidity(e.currentTarget, e.target)}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <div className="grid gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-foreground-secondary" htmlFor="signup-email">
              {t('email')}
            </label>
            <input
              autoCapitalize="off"
              autoComplete="email"
              autoCorrect="off"
              autoFocus
              className={inputClassName}
              disabled={isPending}
              enterKeyHint="next"
              id="signup-email"
              maxLength={254}
              name="email"
              placeholder={t('emailPlaceholder')}
              required
              spellCheck={false}
              type="email"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-foreground-secondary" htmlFor="signup-username">
              {t('username')}
            </label>
            <div className="relative group">
              <input
                aria-describedby="signup-username-help"
                autoCapitalize="off"
                autoComplete="username"
                autoCorrect="off"
                className={inputClassName}
                disabled={isPending}
                enterKeyHint="next"
                id="signup-username"
                maxLength={30}
                minLength={3}
                name="username"
                pattern={USERNAME_PATTERN}
                placeholder={t('usernamePlaceholder')}
                required
                spellCheck={false}
                type="text"
              />
              <button
                aria-label={t('username')}
                className={trailingButtonClassName}
                disabled={isPending}
                onClick={() => clearSignupUsername(formRef.current)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-foreground-muted" id="signup-username-help">
              {t('usernameHelp')}
            </p>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-foreground-secondary" htmlFor="signup-new-password">
              {t('password')}
            </label>
            <PasswordInput
              aria-describedby="signup-password-help"
              autoCapitalize="off"
              autoComplete="new-password"
              autoCorrect="off"
              className={inputClassName}
              disabled={isPending}
              enterKeyHint="next"
              id="signup-new-password"
              maxLength={64}
              minLength={8}
              name="password"
              placeholder={t('passwordPlaceholder')}
              required
              spellCheck={false}
              toggleClassName={trailingButtonClassName}
              toggleLabel={t('showPassword')}
              wrapperClassName="group"
            />
            <p className="mt-1 text-xs text-foreground-muted" id="signup-password-help">
              {t('passwordHelp')}
            </p>
          </div>

          <div>
            <label
              className="block mb-1.5 text-sm font-medium text-foreground-secondary"
              htmlFor="signup-new-password-confirmation"
            >
              {t('passwordConfirm')}
            </label>
            <PasswordInput
              aria-describedby="signup-password-confirmation-help"
              autoCapitalize="off"
              autoComplete="new-password"
              autoCorrect="off"
              className={inputClassName}
              disabled={isPending}
              enterKeyHint="next"
              id="signup-new-password-confirmation"
              maxLength={64}
              minLength={8}
              name="password-confirm"
              placeholder={t('passwordConfirmPlaceholder')}
              required
              spellCheck={false}
              toggleClassName={trailingButtonClassName}
              toggleLabel={t('showPassword')}
              wrapperClassName="group"
            />
            <p className="mt-1 text-xs text-foreground-muted" id="signup-password-confirmation-help">
              {t('passwordConfirmHelp')}
            </p>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-foreground-secondary" htmlFor="signup-nickname">
              {t('nickname')}
            </label>
            <input
              aria-describedby="signup-nickname-help"
              autoCapitalize="off"
              autoComplete="nickname"
              autoCorrect="off"
              className={twMerge(inputClassName, 'px-3')}
              disabled={isPending}
              enterKeyHint="done"
              id="signup-nickname"
              maxLength={32}
              minLength={2}
              name="nickname"
              placeholder={t('nicknamePlaceholder')}
              spellCheck={false}
              type="text"
            />
            <p className="mt-1 text-xs text-foreground-muted" id="signup-nickname-help">
              {t('nicknameHelp')}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white/4 border border-white/7 p-4">
          <div className="flex gap-3">
            <Info className="size-4 text-foreground-secondary/80 shrink-0 mt-0.5" />
            <div className="text-foreground-muted">
              <p className="text-sm font-medium text-foreground mb-1">{t('autoDeletionTitle')}</p>
              <p className="text-xs">{t('autoDeletionDescription')}</p>
            </div>
          </div>
        </div>

        <button
          className={twMerge(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/5 px-4 py-3 text-sm font-medium text-white/90',
            'shadow-[inset_0_-2px_0_var(--color-brand),inset_0_1px_0_rgba(255,255,255,0.06)] transition',
            'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
            'disabled:opacity-50',
          )}
          disabled={isPending || !hasTurnstileToken}
          type="submit"
        >
          {isPending && <Loader2 className="size-5 animate-spin" />}
          <span>{isPending ? t('submitting') : t('submit')}</span>
        </button>

        <TurnstileWidget
          hasToken={hasTurnstileToken}
          id="signup-turnstile"
          onTokenChange={handleTurnstileTokenChange}
          options={{ action: 'signup' }}
          turnstileRef={turnstileRef}
        />
      </form>

      <div className="grid gap-2 text-center text-xs text-foreground-muted">
        <p className="flex flex-wrap gap-1 justify-center">
          <span>{t('termsPrefix')}</span>
          <Link
            className="underline underline-offset-4 hover:text-foreground transition"
            href="/doc/terms"
            prefetch={false}
          >
            {t('termsAction')}
          </Link>
          <span>{t('termsMiddle')}</span>
          <Link
            className="underline underline-offset-4 hover:text-foreground transition"
            href="/doc/privacy"
            prefetch={false}
          >
            {t('privacyAction')}
          </Link>
          <span>{t('termsSuffix')}</span>
        </p>
        <p className="flex flex-wrap gap-1 justify-center">
          <span>{t('loginPrompt')}</span>
          <Link
            className="underline underline-offset-4 hover:text-foreground transition"
            href={loginHref}
            prefetch={false}
          >
            {t('loginAction')}
          </Link>
        </p>
      </div>
    </div>
  )
}
