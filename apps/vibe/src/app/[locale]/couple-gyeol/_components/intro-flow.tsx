'use client'

import type { Locale } from '@sobok/domain/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { parseGyeolResultParam } from '../_lib/model'
import type { GyeolContent } from '../_lib/types'
import { IntroView } from './intro-view'

/**
 * The landing, and the one place that knows what a `?r=` on it means.
 *
 * Results used to live on this URL behind a query parameter, so links shared before the split still arrive here.
 * A readable one is forwarded to the route that now owns results; an unreadable one stays and gets the message
 * the intro already carries for it. Both cases are decided from the parameter alone, which is why the result
 * route hands its own invalid input back here rather than duplicating the copy.
 */
export function IntroFlow({ content, locale }: { content: GyeolContent; locale: Locale }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const shared = searchParams.get('r')
  const sharedResult = parseGyeolResultParam(shared)

  useEffect(() => {
    if (shared && sharedResult) {
      router.replace(`/${locale}/couple-gyeol/result?r=${encodeURIComponent(shared)}`)
    }
  }, [locale, router, shared, sharedResult])

  return <IntroView content={content} hasInvalidSharedResult={Boolean(shared) && !sharedResult} locale={locale} />
}
