'use client'

import type { POSTV1MeExportBody, POSTV1MeExportResponse } from '@sobok/contracts'
import { LOCALE_LANGUAGE_TAGS } from '@sobok/domain/locale'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Bookmark, Check, Clock, Download, Library, Loader2, ShieldCheck, Star } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import { getProblemMessage } from '@/lib/error-message'
import { downloadBlob } from '@/utils/download'
import type { ProblemDetailsError } from '@/utils/fetch-response'

import { exportUserData } from './api'

type DataCounts = {
  history: number
  bookmarks: number
  ratings: number
  libraries: number
  censorships: number
}

type DataType = 'bookmarks' | 'censorships' | 'history' | 'libraries' | 'ratings'

type Props = {
  counts: DataCounts | null
}

const DATA_CONFIG: Record<DataType, { label: string; icon: ReactNode }> = {
  history: { label: '기록', icon: <Clock className="size-5" /> },
  bookmarks: { label: '북마크', icon: <Bookmark className="size-5" /> },
  ratings: { label: '별점', icon: <Star className="size-5" /> },
  libraries: { label: '서재', icon: <Library className="size-5" /> },
  censorships: { label: '검열 설정', icon: <ShieldCheck className="size-5" /> },
}

const ALL_TYPES = Object.keys(DATA_CONFIG) as DataType[]
const DATA_TYPE_VALUES = new Set<string>(ALL_TYPES)

export default function DataExportSectionClient({ counts }: Props) {
  const locale = useLocale()
  const tErrors = useTranslations('Errors')

  const exportMutation = useMutation<POSTV1MeExportResponse, ProblemDetailsError, POSTV1MeExportBody>({
    mutationFn: exportUserData,

    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `sobok-${dayjs().format('YYYY-MM-DD')}.json`)
      toast.success('데이터를 성공적으로 내보냈어요')
    },

    onError: (error) => {
      if (error.status === 400) {
        toast.warning(getProblemMessage(tErrors, error.problem))
      }
    },

    meta: {
      suppressGlobalErrorToastForStatuses: [400],
    },
  })

  const isPending = exportMutation.isPending

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (isPending) {
      return
    }

    const formData = new FormData(e.currentTarget)
    const selectedTypes = new Set(formData.getAll('types').filter(isDataType))

    if (selectedTypes.size === 0) {
      toast.warning('내보낼 데이터를 선택해 주세요')
      return
    }

    exportMutation.mutate({
      password: String(formData.get('password') ?? ''),
      includeHistory: selectedTypes.has('history'),
      includeBookmarks: selectedTypes.has('bookmarks'),
      includeRatings: selectedTypes.has('ratings'),
      includeLibraries: selectedTypes.has('libraries'),
      includeCensorships: selectedTypes.has('censorships'),
    })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <fieldset className="space-y-3">
        <legend className="text-sm text-foreground-muted">내보낼 데이터를 선택하세요</legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {ALL_TYPES.map((type) => (
            <label
              className={twMerge(
                'flex items-center gap-2 p-3 rounded-lg border-2 transition text-left cursor-pointer',
                'border-border-2 bg-surface-2/30 hover:border-border-strong',
                'has-[input:checked]:border-brand has-[input:checked]:bg-brand/10',
                'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60',
              )}
              key={type}
            >
              <input
                className="peer sr-only"
                defaultChecked
                disabled={isPending}
                name="types"
                type="checkbox"
                value={type}
              />
              <span
                aria-hidden
                className={twMerge(
                  'size-4 shrink-0 rounded border-2 transition-all flex items-center justify-center',
                  'border-border-strong bg-surface-2 peer-checked:border-brand peer-checked:[&>svg]:opacity-100',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                )}
              >
                <Check className="size-3 text-brand opacity-0 transition" />
              </span>
              <span className="text-foreground-muted transition peer-checked:text-brand">{DATA_CONFIG[type].icon}</span>
              <span className="flex-1 min-w-0 text-sm font-medium truncate">{DATA_CONFIG[type].label}</span>
              {counts && (
                <span className="text-xs text-foreground-subtle shrink-0">
                  {counts[type].toLocaleString(LOCALE_LANGUAGE_TAGS[locale])}
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <label className="text-sm text-foreground-muted" htmlFor="export-password">
          비밀번호 확인
        </label>
        <input
          autoCapitalize="off"
          autoComplete="current-password"
          autoCorrect="off"
          className={twMerge(
            'w-full p-3 py-2 bg-surface-2 border-2 border-border-strong rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
            'placeholder-foreground-subtle',
          )}
          disabled={isPending}
          enterKeyHint="done"
          id="export-password"
          name="password"
          placeholder="현재 비밀번호"
          required
          spellCheck={false}
          type="password"
        />
      </div>
      <button
        className={twMerge(
          'w-full px-4 py-2 bg-brand hover:bg-brand/90 disabled:bg-surface-3',
          'rounded-lg font-medium transition text-background',
          'flex items-center justify-center gap-2',
        )}
        disabled={isPending}
        type="submit"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        다운로드
      </button>
    </form>
  )
}

function isDataType(value: FormDataEntryValue): value is DataType {
  return typeof value === 'string' && DATA_TYPE_VALUES.has(value)
}
