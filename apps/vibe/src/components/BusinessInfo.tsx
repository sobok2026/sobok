import type { Locale } from '@sobok/domain/locale'

import { BUSINESS, BUSINESS_FIELD_ORDER, BUSINESS_INFO_LOOKUP_URL, BUSINESS_LABELS } from '@/content/business'

// Seller-identity disclosure (전자상거래법 §10). Rendered both in the sitewide Footer (compact) and on the
// standalone /business page. Values come from the single source in content/business.ts.
export default function BusinessInfo({
  locale,
  showHeading = true,
  className,
}: {
  locale: Locale
  showHeading?: boolean
  className?: string
}) {
  const labels = BUSINESS_LABELS[locale]

  return (
    <div className={className}>
      {showHeading ? <h2 className="mb-3 font-semibold text-page-ink">{labels.heading}</h2> : null}
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {BUSINESS_FIELD_ORDER.map((field) => (
          <div className="flex flex-wrap gap-x-2" key={field}>
            <dt className="shrink-0 text-page-ink-muted">{labels.fields[field]}</dt>
            <dd className="text-page-ink-soft">
              {field === 'email' ? (
                <a className="underline underline-offset-2 hover:text-page-ink" href={`mailto:${BUSINESS.email}`}>
                  {BUSINESS.email}
                </a>
              ) : field === 'mailOrderNumber' ? (
                <a
                  className="underline underline-offset-2 hover:text-page-ink"
                  href={BUSINESS_INFO_LOOKUP_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {BUSINESS[field]}
                </a>
              ) : (
                BUSINESS[field]
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
