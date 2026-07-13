'use client'

import { authClient } from '@sobok/auth/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import PasswordInput from '@/components/PasswordInput'
import { useRouter } from '@/i18n/navigation'
import { handleUnauthorizedError } from '@/lib/react-query/auth-state'

import { clearPasswordChangeInputValidity, clearPasswordChangeValidity, getPasswordChangeInput } from './password-form'

const toggleClassName = 'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-3'
const toggleIconClassName = 'size-5 shrink-0 text-foreground-muted'

export default function PasswordChangeForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement | null>(null)

  const changePasswordMutation = useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const { error } = await authClient.changePassword({ ...input, revokeOtherSessions: true })

      if (error) {
        throw new Error(error.message)
      }
    },

    onSuccess: () => {
      resetForm()
      handleUnauthorizedError(queryClient)
      toast.success('비밀번호가 변경됐어요')
      router.replace('/auth/login')
    },

    onError: (error) => {
      resetForm()
      toast.warning(error.message || '비밀번호를 변경할 수 없어요')
    },
  })

  const isPending = changePasswordMutation.isPending

  function resetForm() {
    formRef.current?.reset()
    clearPasswordChangeValidity(formRef.current)
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const formElement = e.currentTarget
    clearPasswordChangeValidity(formElement)

    if (!formElement.reportValidity()) {
      return
    }

    const formData = new FormData(formElement)
    const currentPassword = String(formData.get('currentPassword') ?? '')
    const newPassword = String(formData.get('newPassword') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    if (newPassword !== confirmPassword) {
      const confirmPasswordInput = getPasswordChangeInput(formElement, 'confirmPassword')
      confirmPasswordInput?.setCustomValidity('새 비밀번호가 일치하지 않아요')
      confirmPasswordInput?.focus()
      confirmPasswordInput?.reportValidity()
      toast.warning('새 비밀번호가 일치하지 않아요')
      return
    }

    if (currentPassword === newPassword) {
      const newPasswordInput = getPasswordChangeInput(formElement, 'newPassword')
      newPasswordInput?.setCustomValidity('현재 비밀번호와 새 비밀번호가 같아요')
      newPasswordInput?.focus()
      newPasswordInput?.reportValidity()
      toast.warning('현재 비밀번호와 새 비밀번호가 같아요')
      return
    }

    changePasswordMutation.mutate({ currentPassword, newPassword })
  }

  return (
    <form
      className={twMerge(
        'grid gap-6',
        '[&_label]:block [&_label]:mb-1.5 [&_label]:text-sm [&_label]:font-medium [&_label]:text-foreground-secondary',
        '[&_input]:w-full [&_input]:rounded-md [&_input]:bg-surface-2 [&_input]:border [&_input]:border-border-strong',
        '[&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-foreground-subtle [&_input]:focus:outline-none [&_input]:focus:ring-2',
        '[&_input]:focus:ring-border-strong [&_input]:focus:border-transparent [&_input]:disabled:bg-surface-3',
        '[&_input]:disabled:text-foreground-muted [&_input]:disabled:border-border-strong [&_input]:disabled:cursor-not-allowed',
        '[&_input]:aria-invalid:border-red-700 [&_input]:aria-invalid:focus:ring-red-700',
      )}
      name="password-change"
      onInput={(e) => clearPasswordChangeInputValidity(formRef.current, e.target)}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div>
        <label htmlFor="currentPassword">현재 비밀번호</label>
        <PasswordInput
          autoComplete="current-password"
          disabled={isPending}
          enterKeyHint="next"
          iconClassName={toggleIconClassName}
          id="currentPassword"
          name="currentPassword"
          placeholder="현재 비밀번호를 입력하세요"
          required
          toggleClassName={toggleClassName}
          toggleLabel="비밀번호 표시"
        />
      </div>
      <div>
        <label htmlFor="newPassword">새 비밀번호</label>
        <PasswordInput
          autoComplete="new-password"
          disabled={isPending}
          enterKeyHint="next"
          iconClassName={toggleIconClassName}
          id="newPassword"
          minLength={8}
          name="newPassword"
          placeholder="새 비밀번호를 입력하세요"
          required
          toggleClassName={toggleClassName}
          toggleLabel="비밀번호 표시"
        />
        <p className="mt-1.5 text-xs text-foreground-muted">8자 이상의 비밀번호를 입력해주세요</p>
      </div>

      <div>
        <label htmlFor="confirmPassword">새 비밀번호 확인</label>
        <PasswordInput
          autoComplete="new-password"
          disabled={isPending}
          enterKeyHint="done"
          iconClassName={toggleIconClassName}
          id="confirmPassword"
          minLength={8}
          name="confirmPassword"
          placeholder="새 비밀번호를 다시 입력하세요"
          required
          toggleClassName={toggleClassName}
          toggleLabel="비밀번호 표시"
        />
      </div>

      <div className="rounded-lg border border-border bg-surface/60 p-4 text-sm text-foreground-muted">
        비밀번호를 변경하면 현재 기기를 포함한 모든 로그인 세션이 종료돼요
      </div>

      <button
        className={twMerge(
          'group border-2 border-brand font-medium rounded-xl mt-2',
          'focus:outline-none focus:ring-3 focus:ring-border-strong disabled:border-border-strong disabled:text-foreground-subtle',
        )}
        disabled={isPending}
        type="submit"
      >
        <div
          className={twMerge(
            'p-2 flex justify-center bg-surface rounded-xl hover:bg-surface-2 transition active:bg-surface',
            'group-disabled:bg-surface-2 group-disabled:cursor-not-allowed',
          )}
        >
          {isPending ? <Loader2 className="text-foreground-subtle size-6 p-0.5 animate-spin" /> : '비밀번호 변경'}
        </div>
      </button>
    </form>
  )
}
