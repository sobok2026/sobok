import type { Locale } from '@sobok/domain/locale'

/**
 * Dynamic per-locale imports so each language's tables stay in their own chunk.
 * The Record is exhaustive over Locale, so adding a locale without a module
 * fails the type check instead of falling back silently.
 */
export function createLocaleLoaders<T>(loaders: Record<Locale, () => Promise<T>>): (locale: Locale) => Promise<T> {
  return (locale) => loaders[locale]()
}
