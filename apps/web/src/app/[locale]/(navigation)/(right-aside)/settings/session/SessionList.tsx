'use client'

import { authClient } from '@sobok/auth/client'
import type { Locale } from '@sobok/domain/locale'
import { formatDistanceToNow } from '@sobok/std'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Loader2, LogOut, Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { QueryKeys } from '@/lib/react-query/query-keys'

export type SessionRow = {
  id: string
  token: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  userAgent: string | null
  isCurrent: boolean
}

type Props = {
  sessions: SessionRow[]
}

export default function SessionList({ sessions }: Props) {
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()

  const revokeSingleMutation = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await authClient.revokeSession({ token })

      if (error) {
        throw new Error(error.message)
      }

      return { clearedCurrentSession: false }
    },
    onSuccess: handleSuccess,
  })

  const revokeOthersMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.revokeOtherSessions()

      if (error) {
        throw new Error(error.message)
      }

      return { clearedCurrentSession: false }
    },
    onSuccess: handleSuccess,
  })

  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.revokeSessions()

      if (error) {
        throw new Error(error.message)
      }

      return { clearedCurrentSession: true }
    },
    onSuccess: handleSuccess,
  })

  function handleSuccess(data: { clearedCurrentSession: boolean }) {
    if (data.clearedCurrentSession) {
      clearMeCache(queryClient)
    }

    toast.success(data.clearedCurrentSession ? '모든 기기에서 로그아웃했어요' : '선택한 기기에서 로그아웃했어요')
    queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
    router.refresh()
  }

  function handleRevokeSession(token: string) {
    if (!confirm('이 기기에서 로그아웃할까요?')) {
      return
    }

    revokeSingleMutation.mutate(token)
  }

  function handleRevokeOthers() {
    if (!confirm('이 기기를 제외한 다른 기기에서 모두 로그아웃할까요?')) {
      return
    }

    revokeOthersMutation.mutate()
  }

  function handleRevokeAll() {
    if (!confirm('모든 기기에서 로그아웃할까요? 지금 사용 중인 기기에서도 다시 로그인해야 해요.')) {
      return
    }

    revokeAllMutation.mutate()
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-6 text-center">
          <p className="text-sm text-foreground-secondary">로그인 중인 기기가 없어요</p>
        </div>
        <SessionHint />
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          className="flex items-center gap-2 rounded-lg border border-border-2 px-3 py-2 text-sm text-foreground transition hover:border-border-strong hover:bg-surface-2 disabled:opacity-50"
          disabled={revokeOthersMutation.isPending}
          onClick={handleRevokeOthers}
          type="button"
        >
          {revokeOthersMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          다른 기기 로그아웃
        </button>
        <button
          className="flex items-center gap-2 rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
          disabled={revokeAllMutation.isPending}
          onClick={handleRevokeAll}
          type="button"
        >
          {revokeAllMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          모두 로그아웃
        </button>
      </div>

      <div className="grid gap-2 sm:gap-3">
        {sessions.map((session) => {
          const { createdLabel, deviceLabel, expiresLabel, icon, lastUsedLabel } = formatSessionInfo(session, locale)

          return (
            <div
              className="flex items-center justify-between rounded-lg border border-border bg-surface/50 p-4"
              key={session.id}
            >
              <div className="flex items-center gap-3">
                <div className="text-foreground-muted">{icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 font-medium text-foreground">{deviceLabel}</span>
                    {session.isCurrent && (
                      <span className="shrink-0 rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                        현재
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-subtle">
                    <span
                      className="text-foreground-muted"
                      title={`마지막 사용: ${dayjs(session.updatedAt).format('YYYY년 M월 D일 HH:mm')}`}
                    >
                      {lastUsedLabel} 사용
                    </span>
                    <span>•</span>
                    <span title={`로그인 시작: ${dayjs(session.createdAt).format('YYYY년 M월 D일 HH:mm')}`}>
                      {createdLabel} 로그인
                    </span>
                    <span>•</span>
                    <span title={`자동 로그아웃: ${dayjs(session.expiresAt).format('YYYY년 M월 D일 HH:mm')}`}>
                      {expiresLabel} 자동 로그아웃
                    </span>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  className="rounded-lg p-2 text-foreground-muted transition hover:bg-surface-2 hover:text-red-400 disabled:opacity-50"
                  disabled={revokeSingleMutation.isPending}
                  onClick={() => handleRevokeSession(session.token)}
                  title="로그아웃"
                  type="button"
                >
                  {revokeSingleMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <SessionHint />
    </div>
  )
}

function clearMeCache(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.setQueryData(QueryKeys.me, null)
  queryClient.removeQueries({
    queryKey: QueryKeys.me,
    predicate: (query) => query.queryKey.length > 1,
  })
}

function formatSessionInfo(session: SessionRow, locale: Locale) {
  const deviceLabel = describeUserAgent(session.userAgent)
  const lastUsedLabel = formatDistanceToNow(session.updatedAt, locale)
  const createdLabel = formatDistanceToNow(session.createdAt, locale)
  const expiresAt = dayjs(session.expiresAt)
  const hoursUntilExpiry = expiresAt.diff(dayjs(), 'hour')

  let expiresLabel = '곧'

  if (hoursUntilExpiry >= 24) {
    expiresLabel = `${Math.floor(hoursUntilExpiry / 24)}일 후`
  } else if (hoursUntilExpiry >= 1) {
    expiresLabel = `${hoursUntilExpiry}시간 후`
  }

  const icon = getDeviceIcon(deviceLabel)

  return {
    createdLabel,
    deviceLabel,
    expiresLabel,
    icon,
    lastUsedLabel,
  }
}

// userAgent 문자열에서 기기/브라우저를 간단히 요약한다 — 정확한 파싱보다 알아볼 수 있는 라벨이 목적.
function describeUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return '알 수 없는 기기'
  }

  const ua = userAgent.toLowerCase()

  let os: string | null = null

  if (ua.includes('iphone')) {
    os = 'iPhone'
  } else if (ua.includes('ipad')) {
    os = 'iPad'
  } else if (ua.includes('android')) {
    os = 'Android'
  } else if (ua.includes('mac os')) {
    os = 'macOS'
  } else if (ua.includes('windows')) {
    os = 'Windows'
  } else if (ua.includes('linux')) {
    os = 'Linux'
  }

  let browser: string | null = null

  if (ua.includes('edg/')) {
    browser = 'Edge'
  } else if (ua.includes('chrome/')) {
    browser = 'Chrome'
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox'
  } else if (ua.includes('safari/')) {
    browser = 'Safari'
  }

  if (os && browser) {
    return `${os} · ${browser}`
  }

  return os ?? browser ?? '알 수 없는 기기'
}

function getDeviceIcon(deviceName: string) {
  const name = deviceName.toLowerCase()

  if (name.includes('iphone') || name.includes('android') || name.includes('mobile')) {
    return <Smartphone className="size-5" />
  }

  if (name.includes('tablet') || name.includes('ipad')) {
    return <Tablet className="size-5" />
  }

  return <Monitor className="size-5" />
}

function SessionHint() {
  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <h4 className="mb-2 text-sm font-medium text-foreground-secondary">알아두세요</h4>
      <ul className="space-y-1 text-xs text-foreground-muted">
        <li>• 로그인 중인 모든 기기가 여기에 보여요</li>
        <li>• 다른 기기를 로그아웃 시켜도, 그 기기에서 최대 5분 동안은 계속 사용할 수 있어요</li>
      </ul>
    </div>
  )
}
