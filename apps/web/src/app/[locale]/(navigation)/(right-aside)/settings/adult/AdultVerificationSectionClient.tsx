'use client'

import { authClient } from '@sobok/auth/client'
import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import { formatDistanceToNow } from '@sobok/std'
import { useMutation } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import BBatonButton from '@/svg/BBatonButton'

import AdultVerificationHelp from './AdultVerificationHelp'
import BBatonUnlinkSection from './BBatonUnlinkSection'

type Props = {
  initialVerification?: {
    adultFlag: boolean
    verifiedAt: Date | null
  }
}

export default function AdultVerificationSectionClient({ initialVerification }: Props) {
  const locale = useLocale()
  const verifiedAt = initialVerification?.verifiedAt
  const verifiedAtLabel = verifiedAt ? formatDistanceToNow(new Date(verifiedAt), locale) : null

  const status = useMemo(() => {
    if (!initialVerification) {
      return { label: '미인증', tone: 'zinc' }
    }
    if (initialVerification.adultFlag) {
      return { label: '성인', tone: 'green' }
    }
    return { label: '성인 아님', tone: 'red' }
  }, [initialVerification])

  // better-auth genericOAuth 연결 플로우 — BBaton 인가 페이지로 리다이렉트했다가 이 페이지로 돌아온다.
  const linkMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.oauth2.link({
        providerId: 'bbaton',
        callbackURL: `${window.location.pathname}${window.location.search}`,
      })

      if (error) {
        throw new Error(error.message)
      }
    },
    onError: (error) => {
      toast.warning(error.message || '인증을 시작할 수 없어요')
    },
  })

  function startVerification() {
    if (!linkMutation.isPending) {
      linkMutation.mutate()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-foreground-muted">현재 상태</div>
          <span
            className={twMerge(
              'inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium',
              status.tone === 'green'
                ? 'border-green-700/60 bg-green-950/40 text-green-300'
                : status.tone === 'red'
                  ? 'border-red-700/60 bg-red-950/40 text-red-300'
                  : 'border-border-2 bg-surface/40 text-foreground-secondary',
            )}
          >
            {status.label}
          </span>
        </div>
        {verifiedAtLabel && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-foreground-muted">마지막 인증</div>
            <div className="text-sm text-foreground" title={verifiedAt?.toLocaleString(LOCALE_LANGUAGE_TAGS[locale])}>
              {verifiedAtLabel}
            </div>
          </div>
        )}
      </div>
      <button
        aria-disabled={linkMutation.isPending}
        className="w-full overflow-hidden rounded transition aria-disabled:opacity-60 active:opacity-90"
        onClick={startVerification}
        title={initialVerification ? '비바톤으로 다시 인증하기' : '비바톤으로 인증하기'}
        type="button"
      >
        <BBatonButton className="h-12 w-full" />
      </button>

      <p className="text-sm text-foreground-muted">
        성인 콘텐츠를 안전하게 제공하기 위해 <span className="text-foreground">성인 여부 확인</span>이 필요할 수 있어요.
      </p>

      <AdultVerificationHelp />

      {initialVerification && <BBatonUnlinkSection />}
    </div>
  )
}
