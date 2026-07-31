import Link from 'next/link'

type PersonalizeCardProps = {
  /** The primary CTA copy, linking back to the home page's birth form. */
  cta: string
  hint: string
  homeHref: string
  title: string
}

/** The "personalize your reading" pitch shown by every reading page without a saved birth. */
export function PersonalizeCard({ cta, hint, homeHref, title }: PersonalizeCardProps) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-foreground-secondary">{title}</p>
      <p className="mx-auto mt-1 text-xs leading-relaxed text-foreground-subtle">{hint}</p>
      <Link
        className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white active:scale-[0.98] motion-reduce:active:scale-100"
        href={homeHref}
      >
        {cta}
      </Link>
    </div>
  )
}
