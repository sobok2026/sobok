'use client'

import { isLocale, LOCALE_NATIVE_NAMES, LOCALES, type Locale } from '@sobok/domain/locale'
import { usePathname } from 'next/navigation'

type Props = {
  label: string
  locale: Locale
}

// Every label always reserves its semibold width via an invisible bold twin stacked in the
// same grid cell, so toggling the active locale's weight never shifts the row (CLS-free).
function Label({ name }: { name: string }) {
  return (
    <span className="grid justify-items-center">
      <span className="col-start-1 row-start-1">{name}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-semibold">
        {name}
      </span>
    </span>
  )
}

export default function LocaleSwitcher({ label, locale }: Props) {
  const pathname = usePathname()

  function hrefFor(nextLocale: Locale): string {
    const segments = pathname.split('/')

    if (isLocale(segments[1] ?? '')) {
      segments[1] = nextLocale
    } else {
      segments.splice(1, 0, nextLocale)
    }

    return segments.join('/') || `/${nextLocale}`
  }

  return (
    <nav aria-label={label} className="flex items-center gap-2.5 text-xs">
      {LOCALES.map((entry) =>
        entry === locale ? (
          <span key={entry} aria-current="page" className="font-semibold text-page-ink">
            <Label name={LOCALE_NATIVE_NAMES[entry]} />
          </span>
        ) : (
          <a
            key={entry}
            href={hrefFor(entry)}
            hrefLang={entry}
            lang={entry}
            onClick={(event) => {
              event.preventDefault()
              window.location.assign(`${hrefFor(entry)}${window.location.search}${window.location.hash}`)
            }}
            className="relative text-page-ink-muted transition-colors before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] hover:text-page-ink"
          >
            <Label name={LOCALE_NATIVE_NAMES[entry]} />
          </a>
        ),
      )}
    </nav>
  )
}
