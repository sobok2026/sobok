'use client'

import { authClient } from '@sobok/auth/client'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

interface ConfirmFormProps {
  onCancel: () => void
  onSubmit: (password: string) => void
  isPending: boolean
  message: string
  messageClassName: string
  submitClassName: string
  submitLabel: string
}

interface Props {
  onBackupCodesChange: (codes: string[]) => void
  onDisabled: () => void
}

export default function TwoFactorManagement({ onBackupCodesChange, onDisabled }: Props) {
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)

  const disableMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await authClient.twoFactor.disable({ password })

      if (error) {
        throw new Error(error.message)
      }
    },
    onError: (error) => {
      toast.warning(error.message || '2단계 인증을 비활성화할 수 없어요')
    },
    onSuccess: () => {
      onDisabled()
      setShowDisableConfirm(false)
      toast.info('2단계 인증이 비활성화됐어요')
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onError: (error) => {
      toast.warning(error.message || '복구 코드를 재생성할 수 없어요')
    },
    onSuccess: ({ backupCodes }) => {
      onBackupCodesChange(backupCodes)
      setShowRegenerateModal(false)
      toast.success('새로운 복구 코드를 생성했어요')
    },
  })

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">2단계 인증 (2FA)</h2>
        <div className="rounded-full bg-green-900/20 px-2.5 py-1 text-xs font-medium text-green-500">활성화</div>
      </div>
      {!showDisableConfirm && !showRegenerateModal && (
        <div className="space-y-3">
          <button
            type="button"
            className="w-full rounded-lg bg-red-900/20 border border-red-900 px-4 py-3 font-medium text-red-500 hover:bg-red-900/30"
            onClick={() => setShowDisableConfirm(true)}
          >
            2단계 인증 비활성화
          </button>
          <button
            type="button"
            className="w-full rounded-lg bg-surface-2 px-4 py-3 font-medium text-foreground hover:bg-surface-3"
            onClick={() => setShowRegenerateModal(true)}
          >
            복구 코드 재생성
          </button>
        </div>
      )}
      {showDisableConfirm && (
        <ConfirmForm
          isPending={disableMutation.isPending}
          message="2단계 인증을 비활성화하면 계정 보안이 약해져요. 계속하려면 비밀번호를 입력하세요."
          messageClassName="rounded-lg bg-red-900/20 border border-red-900 p-4 text-sm text-red-500"
          onCancel={() => setShowDisableConfirm(false)}
          onSubmit={(password) => disableMutation.mutate(password)}
          submitClassName="bg-red-900 hover:bg-red-800 text-foreground"
          submitLabel="비활성화"
        />
      )}
      {showRegenerateModal && (
        <ConfirmForm
          isPending={regenerateMutation.isPending}
          message="새로운 복구 코드를 생성하면 기존 복구 코드는 모두 무효화돼요. 계속하려면 비밀번호를 입력하세요."
          messageClassName="rounded-lg bg-yellow-900/20 border border-yellow-800 p-4 text-sm text-yellow-500"
          onCancel={() => setShowRegenerateModal(false)}
          onSubmit={(password) => regenerateMutation.mutate(password)}
          submitClassName="bg-brand hover:bg-brand/90 text-background"
          submitLabel="재생성"
        />
      )}
    </div>
  )
}

function ConfirmForm({
  onCancel,
  onSubmit,
  isPending,
  message,
  messageClassName,
  submitClassName,
  submitLabel,
}: ConfirmFormProps) {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!event.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(event.currentTarget)
    onSubmit(String(formData.get('password') ?? ''))
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className={messageClassName}>{message}</div>
      <input
        autoComplete="current-password"
        className="w-full rounded-lg border border-border-2 bg-surface-2 px-3 py-2 outline-none transition placeholder:text-foreground-subtle focus:border-transparent focus:ring-2 focus:ring-border-strong"
        disabled={isPending}
        maxLength={64}
        minLength={8}
        name="password"
        placeholder="비밀번호"
        required
        type="password"
      />
      <div className="flex gap-3">
        <button
          className={twMerge(
            'flex-1 rounded-lg px-4 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
            submitClassName,
          )}
          disabled={isPending}
          type="submit"
        >
          {isPending ? <Loader2 className="size-4 mx-auto animate-spin" /> : submitLabel}
        </button>
        <button
          className="flex-1 rounded-lg bg-surface-2 px-4 py-3 font-medium text-foreground transition hover:bg-surface-3"
          disabled={isPending}
          onClick={onCancel}
          type="button"
        >
          취소
        </button>
      </div>
    </form>
  )
}
