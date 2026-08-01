import { otherServices, SOBOK_SERVICES, type SobokServiceId } from '@sobok/brand/services'
import type { Locale } from '@sobok/domain/locale'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = {
  locale: Locale
  /** Which site this is: picks the name, the domain line, and which siblings to cross-link. */
  service: SobokServiceId
  /**
   * In-site links, in display order. Paths are relative to the locale root — '' for home — because every
   * site's set differs (vibe alone has /refund) and the order is editorial.
   */
  links: readonly { path: string; label: string }[]
  /** Between the nav and the sibling-site row. vibe puts its 사업자정보 block here. */
  extra?: ReactNode
  /** Bottom padding, which differs with whether the site floats a bottom nav over the page. */
  className?: string
}

export default function Footer({ className, extra, links, locale, service }: Props) {
  const self = SOBOK_SERVICES[service]
  const domain = new URL(self.href).hostname

  return (
    <footer
      className={`border-t border-border px-4 pt-8 text-center text-xs text-foreground-muted ${className ?? 'pb-[calc(2rem+var(--safe-area-bottom))]'}`}
    >
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {links.map(({ label, path }) => (
          <Link className="hover:text-foreground" href={`/${locale}${path}`} key={path}>
            {label}
          </Link>
        ))}
      </nav>

      {extra}

      {/* Plain <a>, not <Link>: these are separate origins, so there is no client route to prefetch. */}
      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {otherServices(service).map((sibling) => (
          <a className="hover:text-foreground" href={`${sibling.href}/${locale}`} key={sibling.href}>
            {sibling.name[locale]}
          </a>
        ))}
      </p>

      <p className="mt-2">
        © 2026 {self.name[locale]} · {domain}
      </p>
    </footer>
  )
}
