import type { Locale } from '@sobok/domain/locale'
import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import type { Messages } from './messages'
import { routing } from './routing'

/**
 * Build the module `next-intl/plugin` loads for every request.
 *
 * The catalogue itself stays in the app: each site's messages are its own, and their Korean shape is what
 * types `t()` through the `next-intl.d.ts` augmentation. What is shared is the resolution — fall back to
 * the default locale rather than throw, since `requestLocale` is undefined for the not-found route and any
 * path Next renders outside a matched `[locale]` segment.
 */
export function createRequestConfig(getMessages: (locale: Locale) => Messages) {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

    return {
      locale,
      messages: getMessages(locale),
    }
  })
}
