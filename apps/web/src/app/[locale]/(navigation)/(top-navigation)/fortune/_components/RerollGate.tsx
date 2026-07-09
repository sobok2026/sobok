'use client'

import type { GETV1MeResponse } from '@sobok/contracts'

import { X } from 'lucide-react'
import { useRef } from 'react'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import { hasAdultAccess } from '@/utils/adult-verification'

type Props = {
  me: GETV1MeResponse
  remaining: number
  onClose: () => void
  onGranted: () => void
}

export function RerollGate({ me, remaining, onClose, onGranted }: Props) {
  const grantedRef = useRef(false)
  const canAccess = hasAdultAccess(me)

  // 버튼을 누르면 리롤을 한 번 부여함.
  function handleReroll() {
    if (grantedRef.current) {
      return
    }

    grantedRef.current = true
    onGranted()
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold tracking-tight text-foreground">🎰 다시 뽑기</p>
          <p className="mt-1 text-xs text-foreground-muted">
            광고를 한 번 눌러서 새로고침 없이 다시 뽑아요. 오늘 <span className="tabular-nums">{remaining}</span>번
            남았어요.
          </p>
        </div>
        <button
          aria-label="닫기"
          className="rounded-lg border border-white/8 bg-white/5 p-1.5 text-foreground-muted transition hover:bg-white/10 hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        {canAccess ? (
          <button
            className="rounded-lg border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/12 active:brightness-90"
            onClick={handleReroll}
            type="button"
          >
            다시 뽑기
          </button>
        ) : (
          <AdultVerificationGate description="다시 뽑기는 성인 인증 후 이용할 수 있어요." />
        )}
      </div>
    </div>
  )
}
