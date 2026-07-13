'use client'

import { authClient } from '@sobok/auth/client'
import { useMutation } from '@tanstack/react-query'
import { Check, Copy, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { type SubmitEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import useClipboard from '@/hook/useClipboard'
import type { TwoFactorSetupData } from '../types'
import OneTimeCodeInput from './OneTimeCodeInput'

interface Props {
  onSuccess: () => void
  setupData: TwoFactorSetupData
}

export default function TwoFactorSetup({ setupData, onSuccess }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const { copy, copied } = useClipboard()

  const { totpURI } = setupData
  const secret = new URL(totpURI).searchParams.get('secret') ?? ''

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await authClient.twoFactor.verifyTotp({ code })

      if (error) {
        throw new Error(error.message)
      }
    },
    onError: (error) => {
      toast.warning(error.message || '코드를 확인할 수 없어요')
    },
    onSuccess: () => {
      onSuccess()
      toast.success('2단계 인증이 활성화됐어요')
    },
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!event.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(event.currentTarget)
    verifyMutation.mutate(String(formData.get('token') ?? ''))
  }

  useEffect(() => {
    let active = true

    QRCode.toDataURL(totpURI, { margin: 1, width: 240 })
      .then((dataURL) => {
        if (active) {
          setQrCode(dataURL)
        }
      })
      .catch(() => {
        if (active) {
          setQrCode(null)
        }
      })

    return () => {
      active = false
    }
  }, [totpURI])

  return (
    <div className="grid gap-6 py-3">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">2단계 인증 설정</h2>
        <p className="text-sm text-foreground-muted">
          Google Authenticator, Authy 등의 인증 앱으로 QR 코드를 스캔하세요.
        </p>
      </div>
      <div className="rounded-lg bg-surface p-4 sm:p-6">
        <div className="flex justify-center mb-4">
          {qrCode && <img alt="2FA QR Code" className="rounded-lg bg-white" src={qrCode} />}
        </div>
        <div className="grid gap-2">
          <p className="text-xs text-foreground-subtle text-center">
            QR 코드를 스캔할 수 없나요? 아래 키(시간 기준)를 복사하세요.
          </p>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 w-full rounded bg-surface-2 px-3 py-2 font-mono text-foreground-secondary"
              name="secret"
              readOnly
              type="text"
              value={secret}
            />
            <button
              type="button"
              className="rounded bg-surface-2 p-2 text-foreground-muted hover:bg-surface-3"
              onClick={() => copy(secret)}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      </div>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-center text-foreground-secondary" htmlFor="token">
          인증 앱의 6자리 코드를 입력하세요
        </label>
        <OneTimeCodeInput disabled={verifyMutation.isPending} />
        <button
          className="w-full rounded-lg bg-brand px-4 py-3 font-medium text-background hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50 transition"
          disabled={verifyMutation.isPending}
          title={verifyMutation.isPending ? '코드 확인 중' : '6자리 코드를 입력하세요'}
          type="submit"
        >
          {verifyMutation.isPending ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 size-5 animate-spin" />
              코드 확인 중
            </span>
          ) : (
            '활성화하기'
          )}
        </button>
      </form>
    </div>
  )
}
