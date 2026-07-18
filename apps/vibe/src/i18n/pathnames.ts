import type { Locale } from '@sobok/domain/locale'
import type { Route } from 'next'

export function getLocalizedPath(locale: Locale, pathname = '/') {
  const normalizedPath = pathname === '/' ? '' : pathname

  return `/${locale}${normalizedPath}` as Route
}
