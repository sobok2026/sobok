import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'

import { BUSINESS_LABELS } from '@/content/business'
import { COMMERCE } from '@/content/commerce'
import { LEGAL } from '@/content/legal'

// Pre-purchase transaction-terms disclosure (전자상거래법 §13 + 상품정보제공고시). Rendered on the deep-type
// landing so product, price, delivery, and withdrawal terms are visible on the audit URL without completing
// the funnel, and reachable at a glance for a PG reviewer.
export default function CommerceNotice({ locale, className }: { locale: Locale; className?: string }) {
  const content = COMMERCE[locale]
  const nav = LEGAL[locale].nav

  return (
    <section
      className={`rounded-3xl border border-page-border bg-page-surface p-5 text-left text-sm sm:p-6 ${className ?? ''}`}
    >
      <h2 className="font-bold text-page-ink">{content.heading}</h2>
      <p className="mt-1 text-page-ink/56 text-xs">{content.intro}</p>
      <dl className="mt-4 grid gap-y-2">
        {content.rows.map((row) => (
          <div className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-0.5 sm:grid-cols-[8rem_1fr]" key={row.label}>
            <dt className="text-page-ink/45">{row.label}</dt>
            <dd className="text-page-ink/78 leading-6">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-page-ink/50 text-xs">
        <span className="text-page-ink/40">{content.policyLinksLabel}:</span>
        <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${locale}/terms`}>
          {nav.terms}
        </Link>
        <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${locale}/refund`}>
          {nav.refund}
        </Link>
        <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${locale}/privacy`}>
          {nav.privacy}
        </Link>
        <Link className="underline underline-offset-2 hover:text-page-ink" href={`/${locale}/business`}>
          {BUSINESS_LABELS[locale].heading}
        </Link>
      </p>
    </section>
  )
}
