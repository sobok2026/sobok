import { DEFAULT_LOCALE, Locale } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { ORIGIN } from '@/constants'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}`])),
    'x-default': `${ORIGIN}/`,
  }

  const todayLanguages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/today`])),
    'x-default': `${ORIGIN}/today`,
  }

  const loveLanguages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/love`])),
    'x-default': `${ORIGIN}/love`,
  }

  const aboutLanguages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/about`])),
    'x-default': `${ORIGIN}/about`,
  }

  const contactLanguages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/contact`])),
    'x-default': `${ORIGIN}/contact`,
  }

  const termsLanguages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/terms`])),
    'x-default': `${ORIGIN}/terms`,
  }

  const privacyLanguages = {
    ...Object.fromEntries(Object.values(Locale).map((locale) => [locale, `${ORIGIN}/${locale}/privacy`])),
    'x-default': `${ORIGIN}/privacy`,
  }

  return [
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: locale === DEFAULT_LOCALE ? 1 : 0.8,
      alternates: { languages },
    })),
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/today`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: locale === DEFAULT_LOCALE ? 0.9 : 0.7,
      alternates: { languages: todayLanguages },
    })),
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/love`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: locale === DEFAULT_LOCALE ? 0.8 : 0.6,
      alternates: { languages: loveLanguages },
    })),
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: locale === DEFAULT_LOCALE ? 0.5 : 0.4,
      alternates: { languages: aboutLanguages },
    })),
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.4,
      alternates: { languages: contactLanguages },
    })),
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      alternates: { languages: termsLanguages },
    })),
    ...Object.values(Locale).map((locale) => ({
      url: `${ORIGIN}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      alternates: { languages: privacyLanguages },
    })),
  ]
}
