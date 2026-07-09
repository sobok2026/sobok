'use client'

import type { GETV1PointsDonationsMeRecipient } from '@sobok/contracts'

import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import { formatDistanceToNow, formatLocalDate, formatNumber } from '@sobok/std'
import { HeartHandshake, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import StatusState from '@/components/status/StatusState'
import { getErrorMessage } from '@/lib/error-message'

import useDeleteDonationMutation from './useDeleteDonationMutation'
import useMyDonationsInfiniteQuery from './useMyDonationsInfiniteQuery'

export default function DonationClient() {
  const locale = useLocale()
  const tErrors = useTranslations('Errors')
  const tDonation = useTranslations('Donation')
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMyDonationsInfiniteQuery(true)
  const deleteMutation = useDeleteDonationMutation()
  const items = data?.pages.flatMap((p) => p.items) ?? []

  const errorMessage = getErrorMessage(tErrors, error)

  return (
    <div className="max-w-3xl w-full mx-auto grid gap-4 p-6">
      <h2 className="sr-only">내 후원</h2>
      <p className="text-sm text-foreground-subtle">후원한 기록을 모아서 볼 수 있어요</p>

      {isLoading && <div className="w-full text-sm bg-surface animate-fade-in-fast h-20 rounded-2xl" />}
      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      {!isLoading && !errorMessage && items.length === 0 && (
        <StatusState
          className="min-h-64 py-8"
          description="작품 페이지에서 작가나 단체를 후원하면 여기에 기록돼요"
          icon={<HeartHandshake className="size-8" />}
          title="아직 후원 내역이 없어요"
        />
      )}

      {items.length > 0 && (
        <div className="rounded-3xl sm:border border-border/60 bg-overlay/40 overflow-hidden shadow-sm">
          <ul className="divide-y divide-border/60">
            {items.map((item) => {
              const createdAt = new Date(item.createdAt)
              const distanceLabel = formatDistanceToNow(createdAt, locale)
              const dateLabel = formatLocalDate(createdAt)

              return (
                <li className="p-4 sm:p-5 transition hover:bg-surface/40" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">후원</p>
                      <p
                        className="text-xs text-foreground-subtle"
                        title={createdAt.toLocaleString(LOCALE_LANGUAGE_TAGS[locale])}
                      >
                        {distanceLabel ? `${distanceLabel} · ${dateLabel}` : dateLabel}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground tabular-nums">
                          {formatNumber(item.totalAmount, locale)} 리보
                        </p>
                        <p className="text-xs text-foreground-subtle">대상 {item.recipients.length}곳</p>
                      </div>
                      <button
                        aria-label="후원 내역 삭제"
                        className="shrink-0 rounded-full p-2 text-foreground-subtle transition hover:bg-surface/60 hover:text-foreground"
                        onClick={() => {
                          const ok = window.confirm(tDonation('deleteConfirm'))
                          if (!ok) return
                          deleteMutation.mutate({ donationId: item.id })
                        }}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.recipients.length === 0 ? (
                      <span className="text-sm text-foreground-subtle">대상 정보가 없어요</span>
                    ) : (
                      item.recipients.map((recipient: GETV1PointsDonationsMeRecipient) => {
                        const recipientLabel = getRecipientDisplayLabel(recipient)
                        const recipientTypeLabel = getRecipientTypeLabel(recipient.type)

                        return (
                          <div
                            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/70 px-3 py-1 text-xs text-foreground-secondary"
                            key={`${item.id}-${recipient.type}-${recipient.value}`}
                            title={`${recipientTypeLabel} ${recipientLabel}`}
                          >
                            <span className="text-[11px] text-foreground-subtle">{recipientTypeLabel}</span>
                            <span className="max-w-48 truncate">{recipientLabel}</span>
                            <span className="text-[11px] text-brand/80 tabular-nums">
                              {formatNumber(recipient.amount, locale)} 리보
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-center">
          <button
            aria-disabled={!hasNextPage || isFetchingNextPage}
            className={twMerge(
              'rounded-xl border border-border/60 bg-overlay/40 px-4 py-2 text-sm font-semibold text-foreground transition',
              'hover:border-border-2 aria-disabled:opacity-50 aria-disabled:pointer-events-none',
            )}
            onClick={() => fetchNextPage()}
            type="button"
          >
            {isFetchingNextPage ? '불러오는 중...' : hasNextPage ? '더 보기' : '마지막이에요'}
          </button>
        </div>
      )}
    </div>
  )
}

function getRecipientDisplayLabel(recipient: { type: 'artist' | 'group'; value: string; label: string }) {
  const trimmedLabel = recipient.label.trim()
  const isGenericLabel = trimmedLabel === (recipient.type === 'artist' ? '작가' : '단체') || trimmedLabel === '그룹'
  if (trimmedLabel && !isGenericLabel) {
    return trimmedLabel
  }

  const normalized = recipient.value.trim().replace(/^(artist:|group:)/, '')
  return normalized ? normalized.replaceAll('_', ' ') : trimmedLabel
}

function getRecipientTypeLabel(type: 'artist' | 'group') {
  return type === 'artist' ? '작가' : '단체'
}
