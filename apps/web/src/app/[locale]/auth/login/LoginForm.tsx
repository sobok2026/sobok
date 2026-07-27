'use client'

import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { identify, track } from '@sobok/analytics/browser'
import { authClient } from '@sobok/auth/client'
import { TURNSTILE_AUTH_ACTION } from '@sobok/contracts'
import { Toggle } from '@sobok/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import PasskeyLoginButton from '@/components/PasskeyLoginButton'
import PasswordInput from '@/components/PasswordInput'
import TurnstileWidget from '@/components/TurnstileWidget'
import { Link, useRouter } from '@/i18n/navigation'
import { getAuthRedirectHref, getAuthSuccessRedirect, getCurrentAuthRedirect } from '@/lib/auth-redirect'
import { getMeQueryFetchOptions } from '@/query/useMeQuery'

import { authInputClassName, authTrailingButtonClassName } from '../field'
import TwoFactorVerification from './TwoFactorVerification'
import { clearIdentifier, clearLoginValidity } from './util'

type LoginSuccessUser = {
  id: string
  email: string
  username?: string | null
}

type LoginVariables = {
  identifier: string
  password: string
  rememberMe: boolean
  turnstileToken: string
}

export default function LoginForm() {
  const [hasTurnstileToken, setHasTurnstileToken] = useState(false)
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false)
  const [signupHref, setSignupHref] = useState('/auth/signup')
  const turnstileRef = useRef<TurnstileInstance>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const t = useTranslations('Auth.login')
  const queryClient = useQueryClient()
  const router = useRouter()

  function resetTurnstile() {
    turnstileRef.current?.reset()
    setHasTurnstileToken(false)
  }

  async function handleLoginSuccess(user: LoginSuccessUser) {
    toast.success(t('success', { email: user.email }))

    identify(user.id)
    track('login', { email: user.email })

    const me = await queryClient.fetchQuery({ ...getMeQueryFetchOptions(), staleTime: 0 }).catch(() => null)

    router.replace(getAuthSuccessRedirect(getCurrentAuthRedirect(), me?.username ?? user.username ?? ''))
  }

  const { mutate: submitLogin, isPending } = useMutation({
    mutationFn: async ({ identifier, password, rememberMe, turnstileToken }: LoginVariables) => {
      const fetchOptions = { headers: { 'x-captcha-response': turnstileToken } }

      // username에는 '@'가 들어갈 수 없으므로('/^[a-zA-Z0-9_.]+$/') 이메일/아이디를 안전하게 구분한다.
      const { data, error } = identifier.includes('@')
        ? await authClient.signIn.email({ email: identifier, password, rememberMe, fetchOptions })
        : await authClient.signIn.username({ username: identifier, password, rememberMe, fetchOptions })

      if (error) {
        throw new Error(error.message ?? '')
      }

      return data
    },
    onSuccess: async (data) => {
      if ('twoFactorRedirect' in data && data.twoFactorRedirect) {
        setIsTwoFactorStep(true)
        return
      }

      await handleLoginSuccess(data.user)
    },
    onError: (error: Error) => {
      resetTurnstile()
      toast.warning(error.message || t('fallbackError'))
    },
  })

  async function getTurnstileToken() {
    const existingToken = turnstileRef.current?.getResponse()

    if (existingToken) {
      return existingToken
    }

    try {
      return (await turnstileRef.current?.getResponsePromise()) ?? null
    } catch {
      return null
    }
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)
    clearLoginValidity(form)

    if (!form.reportValidity()) {
      return
    }

    const turnstileToken = await getTurnstileToken()

    if (!turnstileToken) {
      resetTurnstile()
      toast.warning(t('turnstileRequired'))
      return
    }

    submitLogin({
      identifier: String(formData.get('identifier') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      rememberMe: formData.get('remember') === 'on',
      turnstileToken,
    })
  }

  function handleFormInput(e: React.InputEvent) {
    if (e.target instanceof HTMLInputElement) {
      e.target.setCustomValidity('')
    }
  }

  useEffect(() => {
    const redirect = getCurrentAuthRedirect()

    if (redirect) {
      setSignupHref(getAuthRedirectHref('/auth/signup', redirect))
    }
  }, [])

  return (
    <div className="grid gap-6 sm:gap-7">
      {isTwoFactorStep ? (
        <TwoFactorVerification
          onCancel={() => {
            setIsTwoFactorStep(false)
            resetTurnstile()
          }}
          onSuccess={handleLoginSuccess}
        />
      ) : (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h2>
            <p className="mt-2 text-sm text-foreground-muted">{t('description')}</p>
          </div>

          <form
            className="grid gap-5"
            id="login-form"
            name="login"
            onInput={handleFormInput}
            onSubmit={handleSubmit}
            ref={formRef}
          >
            <div className="grid gap-4">
              <div>
                <label
                  className="block mb-1.5 text-sm font-medium text-foreground-secondary"
                  htmlFor="login-identifier"
                >
                  {t('identifier')}
                </label>
                <div className="relative group">
                  <input
                    autoCapitalize="off"
                    autoComplete="username webauthn"
                    autoCorrect="off"
                    autoFocus
                    className={authInputClassName}
                    disabled={isPending}
                    enterKeyHint="next"
                    id="login-identifier"
                    maxLength={254}
                    name="identifier"
                    required
                    spellCheck={false}
                    type="text"
                  />
                  <button
                    aria-label={t('clearIdentifier')}
                    className={authTrailingButtonClassName}
                    disabled={isPending}
                    onClick={() => clearIdentifier(formRef.current)}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                    type="button"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="block mb-1.5 text-sm font-medium text-foreground-secondary"
                  htmlFor="login-current-password"
                >
                  {t('password')}
                </label>
                <PasswordInput
                  autoComplete="current-password"
                  className={authInputClassName}
                  disabled={isPending}
                  enterKeyHint="done"
                  id="login-current-password"
                  name="password"
                  required
                  toggleClassName={authTrailingButtonClassName}
                  toggleLabel={t('showPassword')}
                  wrapperClassName="group"
                />
              </div>

              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-foreground-muted select-none cursor-pointer" htmlFor="remember">
                    {t('remember')}
                  </label>
                  <Toggle
                    aria-label={t('rememberAria')}
                    className={twMerge(
                      'w-10 bg-white/6 border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.28)] after:bg-white after:border-white/20 transition',
                      'peer-checked:bg-brand/65 peer-checked:border-transparent',
                      'peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.18)]',
                      'peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0',
                    )}
                    disabled={isPending}
                    id="remember"
                    name="remember"
                  />
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/7" />
              </div>
              <div className="flex justify-center text-sm">
                <span className="relative z-10 px-4 bg-transparent text-foreground-subtle">{t('divider')}</span>
              </div>
            </div>

            <PasskeyLoginButton disabled={isPending} onSuccess={handleLoginSuccess} />

            <TurnstileWidget
              hasToken={hasTurnstileToken}
              id="login-turnstile"
              onTokenChange={(token) => setHasTurnstileToken(Boolean(token))}
              options={{ action: TURNSTILE_AUTH_ACTION }}
              turnstileRef={turnstileRef}
            />
          </form>

          <p className="text-center flex flex-wrap gap-1 justify-center text-xs text-foreground-muted">
            <span>{t('signupPrompt')}</span>
            <Link
              className="underline underline-offset-4 hover:text-foreground transition"
              href={signupHref}
              prefetch={false}
            >
              {t('signupAction')}
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
