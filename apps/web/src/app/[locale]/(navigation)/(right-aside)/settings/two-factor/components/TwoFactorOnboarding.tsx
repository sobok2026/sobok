'use client'

import { authClient } from '@sobok/auth/client'
import { useMutation } from '@tanstack/react-query'
import { RectangleEllipsis } from 'lucide-react'
import type { SubmitEvent } from 'react'
import { toast } from 'sonner'

import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'
import type { TwoFactorSetupData } from '../types'

type Props = {
  onSuccess: (data: TwoFactorSetupData) => void
}

export default function TwoFactorOnboarding({ onSuccess }: Props) {
  const setupMutation = useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.enable({ password })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onError: (error) => {
      toast.warning(error.message || '2단계 인증을 시작할 수 없어요')
    },
    onSuccess,
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!event.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(event.currentTarget)
    setupMutation.mutate(String(formData.get('password') ?? ''))
  }

  return (
    <StatusState
      description="인증 앱을 통해 계정을 이중으로 보호하세요"
      icon={<RectangleEllipsis className="size-8" />}
      intent="setup"
      title="2단계 인증이 꺼져있어요"
    >
      <form className="grid w-full max-w-xs gap-3" onSubmit={handleSubmit}>
        <input
          autoComplete="current-password"
          className="w-full rounded-lg border border-border-2 bg-surface-2 px-3 py-2 outline-none transition placeholder:text-foreground-subtle focus:border-transparent focus:ring-2 focus:ring-border-strong"
          disabled={setupMutation.isPending}
          maxLength={64}
          minLength={8}
          name="password"
          placeholder="비밀번호 확인"
          required
          type="password"
        />
        <button className={getStatusActionClassName('primary')} disabled={setupMutation.isPending} type="submit">
          {setupMutation.isPending ? 'QR 코드 생성하는 중' : '2단계 인증 시작하기'}
        </button>
      </form>
    </StatusState>
  )
}
