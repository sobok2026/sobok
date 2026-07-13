'use client'

import { authClient } from '@sobok/auth/client'
import { Toggle } from '@sobok/ui'
import { useMutation } from '@tanstack/react-query'
import { Key, Loader2, RectangleEllipsis } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import OneTimeCodeInput from '@/app/[locale]/(navigation)/(right-aside)/settings/two-factor/components/OneTimeCodeInput'

interface Props {
  onCancel: () => void
  onSuccess: (user: { id: string; email: string; username?: string | null }) => void
}

type VerifyVariables = {
  code: string
  trustDevice: boolean
  useBackupCode: boolean
}

export default function TwoFactorVerification({ onCancel, onSuccess }: Props) {
  const [isBackupCode, setIsBackupCode] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const t = useTranslations('Auth.twoFactor')

  const { mutate: verify, isPending } = useMutation({
    mutationFn: async ({ code, trustDevice, useBackupCode }: VerifyVariables) => {
      const { data, error } = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code, trustDevice })

      if (error) {
        throw new Error(error.message ?? '')
      }

      return data
    },
    onSuccess: (data) => {
      onSuccess(data.user)
    },
    onError: (error: Error) => {
      toast.warning(error.message || t('fallbackError'))
    },
  })

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!e.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(e.currentTarget)

    verify({
      code: String(formData.get('token') ?? ''),
      trustDevice: formData.get('trust-browser') === 'on',
      useBackupCode: isBackupCode,
    })
  }

  function handleFormInput(e: React.InputEvent) {
    if (e.target instanceof HTMLInputElement) {
      e.target.setCustomValidity('')
    }
  }

  return (
    <div className="grid gap-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/4 border border-white/7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <RectangleEllipsis className="size-6 text-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          {isBackupCode ? t('backupCodeDescription') : t('appCodeDescription')}
        </p>
      </div>

      <form
        className="grid gap-5"
        id="two-factor-form"
        name="two-factor"
        onInput={handleFormInput}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <div>
          <label className="sr-only" htmlFor="token">
            {t('tokenLabel')}
          </label>
          <OneTimeCodeInput
            autoCapitalize={isBackupCode ? 'characters' : 'off'}
            autoComplete={isBackupCode ? 'off' : 'one-time-code'}
            autoCorrect="off"
            autoFocus
            className={twMerge(
              'w-full rounded-xl bg-white/4 border border-white/7 px-4 py-3 text-center text-xl font-mono text-foreground placeholder:text-foreground-subtle transition',
              'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
            disabled={isPending}
            enterKeyHint="done"
            inputMode={isBackupCode ? 'text' : 'numeric'}
            maxLength={isBackupCode ? 11 : 6}
            minLength={isBackupCode ? 10 : 6}
            placeholder={isBackupCode ? 'XXXXX-XXXXX' : '000000'}
            spellCheck={false}
          />
        </div>

        <div className="flex justify-end">
          <div
            aria-disabled={isBackupCode}
            className="flex items-center gap-2 transition aria-disabled:opacity-50"
            title={isBackupCode ? t('backupCodeTrustDisabled') : ''}
          >
            <label className="text-sm text-foreground-muted cursor-pointer" htmlFor="trust-browser">
              {t('trustBrowser')}
            </label>
            <Toggle
              aria-label={t('trustBrowserAria')}
              className={twMerge(
                'w-10 bg-white/6 border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.28)] after:bg-white after:border-white/20 transition',
                'peer-checked:bg-brand/65 peer-checked:border-transparent',
                'peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.18)]',
                'peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0',
              )}
              disabled={isPending || isBackupCode}
              id="trust-browser"
              name="trust-browser"
            />
          </div>
        </div>

        <button
          className={twMerge(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/5 px-4 py-3 text-sm font-medium text-white/90',
            'shadow-[inset_0_-2px_0_var(--color-brand),inset_0_1px_0_rgba(255,255,255,0.06)] transition',
            'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
            'disabled:opacity-50',
          )}
          disabled={isPending}
          type="submit"
        >
          {isPending ? <Loader2 className="size-5 animate-spin" /> : null}
          {isPending ? t('submitting') : t('submit')}
        </button>

        <div className="flex items-center justify-between pt-1">
          <button
            className="flex items-center text-sm text-foreground-muted hover:text-foreground transition"
            disabled={isPending}
            onClick={() => setIsBackupCode(!isBackupCode)}
            type="button"
          >
            <Key className="mr-1 size-4" />
            {isBackupCode ? t('useAuthCode') : t('useBackupCode')}
          </button>

          <button
            className="text-sm text-foreground-muted hover:text-foreground transition"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
