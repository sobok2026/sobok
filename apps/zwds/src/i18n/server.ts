import type { Locale } from '@sobok/domain/locale'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { routing } from './routing'

export async function getLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  return locale
}
