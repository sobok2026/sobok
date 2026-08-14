import { getLocale } from '@sobok/site-i18n/server'
import Footer from '@/components/Footer'

/** The locale home is Stella's storefront, so it keeps the complete site footer. */
export default async function HomeLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale(params)

  return (
    <>
      {children}
      <Footer locale={locale} />
    </>
  )
}
