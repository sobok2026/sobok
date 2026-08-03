import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import { SITE_NAME } from '@/constants'
import { HEADER_ISLAND } from './chrome'

/**
 * The paid funnel's header. It carries the wordmark and nothing else.
 *
 * The site header's other two affordances are both wrong here. The primary nav offers a buyer 오늘/연애 in the
 * middle of a purchase, and the locale switcher offers three locales the guardian report is not sold in — a
 * switch lands on an unpublished, `noindex` copy of the page with empty strings. The wordmark stays because a
 * page that asks for money has to say whose page it is.
 */
export default function FunnelHeader({ locale }: { locale: Locale }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 pt-[calc(0.5rem+var(--safe-area-top))] pl-[max(0.5rem,var(--safe-area-left))] pr-[max(0.5rem,var(--safe-area-right))] sm:fixed">
      <div className={`inline-flex items-center ${HEADER_ISLAND}`}>
        <Link
          className="relative shrink-0 text-sm font-semibold tracking-tight text-foreground before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']"
          href={`/${locale}`}
        >
          {SITE_NAME[locale]}
        </Link>
      </div>
    </header>
  )
}
