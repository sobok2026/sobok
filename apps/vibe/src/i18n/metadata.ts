import { DEFAULT_LOCALE, Locale } from '@sobok/domain/locale'

import { ORIGIN } from '@/constants'

import { getLocalizedPath } from './pathnames'

type Options = {
  description: string
  locale: Locale
  pathname: string
  title: string
}

export function buildLocalizedMetadata({ description, locale, pathname, title }: Options) {
  const languageEntries = Object.values(Locale).map((entryLocale) => [
    entryLocale,
    toAbsoluteUrl(getLocalizedPath(entryLocale, pathname)),
  ])

  return {
    alternates: {
      canonical: toAbsoluteUrl(getLocalizedPath(locale, pathname)),
      languages: {
        ...Object.fromEntries(languageEntries),
        'x-default': toAbsoluteUrl(getLocalizedPath(DEFAULT_LOCALE, pathname)),
      },
    },
    description,
    title,
  }
}

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, ORIGIN).toString()
}
