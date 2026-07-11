import { PUBLIC_LOCALES } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'

import Constellation from './Constellation'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}/`,
      languages: {
        ...Object.fromEntries(PUBLIC_LOCALES.map((entry) => [entry, `/${entry}/`])),
        'x-default': '/',
      },
    },
  }
}

export default async function ConstellationPage({ params }: PageProps<'/[locale]'>) {
  await getLocaleFromParams(params)
  return <Constellation />
}
