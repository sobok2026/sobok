import { getLocale } from '@sobok/site-i18n/server'
import Footer from '@/components/Footer'

/** Informational and legal documents keep the complete footer and its sibling-document navigation. */
export default async function DocLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)

  return (
    <>
      {children}
      <Footer locale={locale} />
    </>
  )
}
