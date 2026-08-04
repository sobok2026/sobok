'use client'

import { SOBOK_ACCOUNT_LABELS, type SobokAccountLocale } from '@sobok/auth/contracts'
import { useEffect, useState } from 'react'

function browserLocale(): SobokAccountLocale {
  const language = navigator.language.toLowerCase()
  if (language.startsWith('ja')) return 'ja'
  if (language.startsWith('zh')) return 'zh'
  if (language.startsWith('en')) return 'en'
  return 'ko'
}

export function useAccountLocale(): SobokAccountLocale {
  const [locale, setLocale] = useState<SobokAccountLocale>('ko')
  useEffect(() => setLocale(browserLocale()), [])
  return locale
}

export function accountLabel(locale: SobokAccountLocale): string {
  return SOBOK_ACCOUNT_LABELS[locale]
}
