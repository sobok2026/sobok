import type { Locale } from '@sobok/domain/locale'
import SiteFaqSection from '@sobok/site-chrome/faq-section'
import { FAQ } from '@/content/faq'

export default function FaqSection({ locale }: { locale: Locale }) {
  const content = FAQ[locale]

  return <SiteFaqSection heading={content.heading} items={content.items} />
}
