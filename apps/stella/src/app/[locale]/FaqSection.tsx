import type { Locale } from '@sobok/domain/locale'

import { FAQ, type FaqPageKey } from './faq'

// Server-rendered so the Q&A ships in the initial HTML: crawlable, keyword-rich,
// and mirrored by the FAQPage JSON-LD. Native <details> keeps it accessible and
// works with JavaScript disabled.
export default function Faq({ locale, page }: { locale: Locale; page: FaqPageKey }) {
  const content = FAQ[locale]
  const items = content[page]

  return (
    <section aria-labelledby="faq-heading" className="border-t border-border px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground" id="faq-heading">
          {content.heading}
        </h2>
        <div className="mt-8 flex flex-col gap-3">
          {items.map((item) => (
            <details
              className="group rounded-2xl border border-border bg-surface px-5 py-4 open:bg-surface-2"
              key={item.q}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="shrink-0 text-lg text-foreground-muted transition-transform motion-reduce:transition-none group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-foreground-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
