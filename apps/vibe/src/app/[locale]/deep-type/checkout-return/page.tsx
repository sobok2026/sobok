import { isLocale } from '@sobok/domain/locale'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AgeGate from '@/components/AgeGate'
import { DEEP_TYPE_CHECKOUT_RETURN } from '@/content/deep-type-checkout-return'
import { buildLocalizedMetadata } from '@/i18n/metadata'

import { getDeepTypeContent } from '../_lib/content'
import { CheckoutReturnView } from './_components/checkout-return-view'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/deep-type/checkout-return'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) {
    return {}
  }
  const copy = DEEP_TYPE_CHECKOUT_RETURN[locale]
  return {
    ...buildLocalizedMetadata({
      description: copy.metadata.description,
      locale,
      pathname: '/deep-type/checkout-return',
      title: copy.metadata.title,
    }),
    robots: { follow: false, index: false },
  }
}

export default async function DeepTypeCheckoutReturnPage({ params }: PageProps<'/[locale]/deep-type/checkout-return'>) {
  const { locale } = await params
  if (!isLocale(locale)) {
    notFound()
  }

  const content = await getDeepTypeContent(locale)
  return (
    <AgeGate locale={locale}>
      <CheckoutReturnView content={content} copy={DEEP_TYPE_CHECKOUT_RETURN[locale]} locale={locale} />
    </AgeGate>
  )
}
