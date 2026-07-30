'use client'

import type { GETV1MeResponse } from '@sobok/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { type SubmitEvent, useRef } from 'react'
import { toast } from 'sonner'

import PasswordInput from '@/components/PasswordInput'
import { useRouter } from '@/i18n/navigation'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'
import { ProblemDetailsError } from '@/utils/fetch-response'

export default function BBatonUnlinkSection() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const unlinkFormRef = useRef<HTMLFormElement | null>(null)

  const unlinkMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      await fetchAPIData<undefined>('/api/v1/me/adult-verification', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
    },
    onSuccess: () => {
      queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, (previous) => {
        if (!previous) {
          return previous
        }

        return {
          ...previous,
          adultVerification: {
            ...previous.adultVerification,
            status: 'unverified',
          },
        }
      })

      toast.success('연동이 해제됐어요')
      unlinkFormRef.current?.reset()
      router.refresh()
    },
    onError: (error) => {
      if (error instanceof ProblemDetailsError && error.status === 401) {
        router.refresh()
      }
    },
  })

  function handleUnlinkSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const password = String(formData.get('password') ?? '')

    unlinkMutation.mutate({ password })
  }

  return (
    <div className="pt-2 border-t border-border/80">
      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-surface/40 active:bg-surface/60">
            <div className="text-sm font-medium text-red-300">연동 해제</div>
            <ChevronDown className="size-4 text-foreground-subtle transition group-open:rotate-180" />
          </div>
        </summary>

        <div className="mt-2 rounded-xl border border-border bg-surface/20 p-4 space-y-3">
          <p className="text-sm text-foreground-muted">
            연동을 해제하면 인증 정보가 삭제되고 <span className="text-foreground-secondary">미인증</span> 상태로
            돌아가요. 성인 콘텐츠 이용이 제한될 수 있어요.
          </p>

          <form className="grid gap-3" onSubmit={handleUnlinkSubmit} ref={unlinkFormRef}>
            <div className="grid gap-1.5">
              <label className="text-sm text-foreground-secondary" htmlFor="bbaton-unlink-password">
                현재 비밀번호
              </label>
              <PasswordInput
                autoComplete="current-password"
                className="w-full rounded-md bg-surface-2 border border-border-strong px-3 py-2 pr-10 placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-border-strong focus:border-transparent disabled:bg-surface-3 disabled:text-foreground-muted"
                disabled={unlinkMutation.isPending}
                enterKeyHint="done"
                iconClassName="size-5 shrink-0 text-foreground-muted"
                id="bbaton-unlink-password"
                name="password"
                required
                toggleClassName="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-3"
                toggleLabel="비밀번호 표시"
              />
            </div>

            <button
              aria-disabled={unlinkMutation.isPending}
              className="w-full inline-flex justify-center rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-red-300 transition aria-disabled:opacity-60 hover:bg-red-950/20 active:bg-red-950/30"
              type="submit"
            >
              연동 해제하기
            </button>
          </form>
        </div>
      </details>
    </div>
  )
}
