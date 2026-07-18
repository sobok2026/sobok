import type { Locale } from '@sobok/domain/locale'
import { SITE_NAME } from '@/constants'
import { OTHER_SERVICES } from '@/content/services'

export default function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="border-t border-border px-4 py-8 text-center text-xs text-foreground-subtle">
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-foreground-faint">
        {OTHER_SERVICES.map((service) => (
          <a className="hover:text-foreground" href={`${service.href}/${locale}`} key={service.href}>
            {service.name[locale]}
          </a>
        ))}
      </p>
      <p className="mt-2 text-foreground-faint">© 2026 {SITE_NAME[locale]} · zwds.sobok.cc</p>
    </footer>
  )
}
