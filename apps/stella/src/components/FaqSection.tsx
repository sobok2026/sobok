import type { Locale } from '@sobok/domain/locale'
import SiteFaqSection from '@sobok/site-chrome/faq-section'
import { FAQ, type FaqPageKey } from '@/content/faq'

export default function FaqSection({ locale, page }: { locale: Locale; page: FaqPageKey }) {
  const content = FAQ[locale]

  return <SiteFaqSection heading={content.heading} items={content[page]} />
}
