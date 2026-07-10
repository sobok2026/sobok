'use client'

import { authClient } from '@sobok/auth/client'
import { Fingerprint, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useEffectEvent, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

type Props = {
  disabled?: boolean
  onSuccess?: (user: User) => void
}

type User = {
  id: string
  email: string
  username?: string | null
}

export default function PasskeyLoginButton({ disabled, onSuccess }: Props) {
  const [supportsAutofill, setSupportsAutofill] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const t = useTranslations('Auth.loginButton')

  async function runPasskeyLogin(mode: 'autofill' | 'button') {
    const isAutofill = mode === 'autofill'

    if (!isAutofill) {
      setIsPending(true)
    }

    const { error } = await authClient.signIn.passkey({
      ...(isAutofill && { autoFill: true }),
    })

    if (!isAutofill) {
      setIsPending(false)
    }

    if (error) {
      if (isAutofill) {
        return
      }

      toast.warning(error.message ?? t('error.verificationFailed'))
      return
    }

    const { data: session } = await authClient.getSession({ query: { disableCookieCache: true } })

    if (session) {
      onSuccess?.(session.user)
    }
  }

  const beginAutofillPasskeyLogin = useEffectEvent(async () => {
    await runPasskeyLogin('autofill')
  })

  // NOTE: 브라우저 패스키 자동완성(conditional UI) 지원 여부를 확인해요
  useEffect(() => {
    let active = true

    const supported =
      typeof window !== 'undefined' &&
      typeof window.PublicKeyCredential !== 'undefined' &&
      typeof window.PublicKeyCredential.isConditionalMediationAvailable === 'function'

    if (!supported) {
      setSupportsAutofill(false)
      return
    }

    window.PublicKeyCredential.isConditionalMediationAvailable()
      .then((available) => {
        if (active) {
          setSupportsAutofill(available)
        }
      })
      .catch(() => {
        if (active) {
          setSupportsAutofill(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  // NOTE: 패스키 자동완성은 저위험 시도에만 조용히 시도해요
  useEffect(() => {
    if (!supportsAutofill || disabled) {
      return
    }

    beginAutofillPasskeyLogin()
  }, [disabled, supportsAutofill])

  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/4 px-4 py-3 text-sm font-medium text-white/80 transition',
        'hover:bg-white/6 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
        'disabled:opacity-50',
      )}
      disabled={disabled || isPending}
      onClick={() => runPasskeyLogin('button')}
      title={t('passkey')}
      type="button"
    >
      {isPending ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <Fingerprint className="size-5 shrink-0" />}
      <span>{t('passkey')}</span>
    </button>
  )
}
