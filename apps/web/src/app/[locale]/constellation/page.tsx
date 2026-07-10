import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'

import Constellation from './Constellation'

export async function generateMetadata({ params }: PageProps<'/[locale]/constellation'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Constellation.meta' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ConstellationPage({ params }: PageProps<'/[locale]/constellation'>) {
  await getLocaleFromParams(params)
  return <Constellation />
}
