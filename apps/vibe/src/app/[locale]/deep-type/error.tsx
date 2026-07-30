'use client'

import { DEFAULT_LOCALE, isLocale, type Locale } from '@sobok/domain/locale'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { cn } from '@/utils/cn'
import { FOCUS_CLASS_NAME } from '../../../components/focus'

const COPY = {
  ko: { retry: '다시 시도', title: '문제가 생겼어요' },
  en: { retry: 'Try again', title: 'Something went wrong' },
  ja: { retry: 'もう一度試す', title: '問題が発生しました' },
  zh: { retry: '重试', title: '出现了问题' },
} satisfies Record<Locale, { retry: string; title: string }>

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DeepTypeError({ error, reset }: Props) {
  const params = useParams<{ locale: string }>()
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  const copy = COPY[locale]

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-page-bg px-safe py-16 text-center text-page-ink">
      <h1 className="break-keep font-black text-2xl leading-tight">{copy.title}</h1>
      {error.digest && <p className="mt-2 text-page-ink/50 text-xs">{error.digest}</p>}

      <button
        className={cn(
          'mt-9 inline-flex min-h-13 items-center justify-center rounded-full bg-page-ink px-6 font-black text-sm text-white transition-colors hover:bg-page-ink/92',
          FOCUS_CLASS_NAME,
        )}
        onClick={reset}
        type="button"
      >
        {copy.retry}
      </button>
    </main>
  )
}
