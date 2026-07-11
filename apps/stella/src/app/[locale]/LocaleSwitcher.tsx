import { LOCALE_NATIVE_NAMES, PUBLIC_LOCALES, type PublicLocale } from '@sobok/domain/locale'

type Props = {
  label: string
  locale: PublicLocale
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

// Plain anchors on purpose: each locale is a separate static page, and a full
// navigation swaps <html lang>, messages, and metadata in one step.
export default function LocaleSwitcher({ label, locale }: Props) {
  return (
    <nav
      aria-label={label}
      className="absolute right-3 top-[calc(0.75rem+var(--safe-area-top))] z-20 flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs backdrop-blur-md"
    >
      {PUBLIC_LOCALES.map((entry) =>
        entry === locale ? (
          <span key={entry} aria-current="page" className="font-semibold text-[#c9a8ff]">
            <Label name={LOCALE_NATIVE_NAMES[entry]} />
          </span>
        ) : (
          <a
            key={entry}
            href={`/${entry}/`}
            hrefLang={entry}
            lang={entry}
            className="text-slate-300/80 transition-colors hover:text-slate-100"
          >
            <Label name={LOCALE_NATIVE_NAMES[entry]} />
          </a>
        ),
      )}
    </nav>
  )
}
