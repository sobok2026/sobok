import { Locale } from '../locale'
import type { BirthplaceCatalog } from './model'

type GeneratedCatalogModule = {
  GENERATED_BIRTHPLACE_CATALOG: BirthplaceCatalog
}

const LOADERS = {
  [Locale.KO]: () => import('./ko.generated'),
  [Locale.EN]: () => import('./en.generated'),
  [Locale.JA]: () => import('./ja.generated'),
  [Locale.ZH]: () => import('./zh.generated'),
} satisfies Record<Locale, () => Promise<GeneratedCatalogModule>>

const catalogPromises = new Map<Locale, Promise<BirthplaceCatalog>>()

/** Loads exactly one locale chunk on demand and retries cleanly after a transient failure. */
export function loadBirthplaceCatalog(locale: Locale): Promise<BirthplaceCatalog> {
  const cached = catalogPromises.get(locale)

  if (cached) {
    return cached
  }

  const promise = LOADERS[locale]().then(({ GENERATED_BIRTHPLACE_CATALOG }) => {
    if (GENERATED_BIRTHPLACE_CATALOG.locale !== locale) {
      throw new Error(`Loaded ${GENERATED_BIRTHPLACE_CATALOG.locale} catalog for ${locale}`)
    }

    return GENERATED_BIRTHPLACE_CATALOG
  })

  catalogPromises.set(locale, promise)
  promise.catch(() => catalogPromises.delete(locale))
  return promise
}
