'use client'

import { isLocale, LOCALE_LANGUAGE_TAGS, LOCALE_NATIVE_NAMES, LOCALES, type Locale } from '@sobok/domain/locale'
import { usePathname } from 'next/navigation'

type Props = {
  label: string
  locale: Locale
}

function LocaleLabel({ name }: { name: string }) {
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
          <span aria-current="page" className="font-semibold text-foreground" key={entry}>
            <LocaleLabel name={LOCALE_NATIVE_NAMES[entry]} />
          </span>
        ) : (
          <a
            className="relative text-foreground-muted/80 transition-colors before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] hover:text-foreground"
            href={hrefFor(entry)}
            hrefLang={LOCALE_LANGUAGE_TAGS[entry]}
            key={entry}
            lang={LOCALE_LANGUAGE_TAGS[entry]}
            onClick={(event) => {
              event.preventDefault()
              window.location.assign(`${hrefFor(entry)}${window.location.search}${window.location.hash}`)
            }}
          >
            <LocaleLabel name={LOCALE_NATIVE_NAMES[entry]} />
          </a>
        ),
      )}
    </nav>
  )
}
