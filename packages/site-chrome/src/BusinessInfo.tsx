import { BUSINESS, BUSINESS_FIELD_ORDER, BUSINESS_INFO_LOOKUP_URL, BUSINESS_LABELS } from '@sobok/brand/business'
import type { Locale } from '@sobok/domain/locale'

// Seller-identity disclosure (전자상거래법 §10). Rendered both in the sitewide Footer (compact) and on the
// standalone /business page, on every site that sells something. Values come from @sobok/brand/business.
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
      {showHeading ? <h2 className="mb-3 font-semibold text-foreground">{labels.heading}</h2> : null}
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {BUSINESS_FIELD_ORDER.map((field) => (
          <div className="flex flex-wrap gap-x-2" key={field}>
            <dt className="shrink-0 text-foreground-muted">{labels.fields[field]}</dt>
            <dd className="text-foreground-secondary">
              {field === 'email' ? (
                <a className="underline underline-offset-2 hover:text-foreground" href={`mailto:${BUSINESS.email}`}>
                  {BUSINESS.email}
                </a>
              ) : field === 'mailOrderNumber' ? (
                <a
                  className="underline underline-offset-2 hover:text-foreground"
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
