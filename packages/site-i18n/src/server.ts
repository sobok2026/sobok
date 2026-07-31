import type { Locale } from '@sobok/domain/locale'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { routing } from './routing'

/**
 * Validate the `[locale]` segment and narrow it, registering it for the request in the same step.
 *
 * Both halves matter and neither is optional. Without the `hasLocale` guard an unknown segment renders a
 * page in the default locale at a URL that should not exist; without `setRequestLocale` a statically
 * rendered page cannot reach the request locale at all. Every page and layout under `[locale]` starts here.
 */
export async function getLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  return locale
}
