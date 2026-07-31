import type { Locale } from '@sobok/domain/locale'

export type SobokServiceId = 'stella' | 'zwds' | 'vibe'

export type SobokService = {
  id: SobokServiceId
  href: string
  name: Record<Locale, string>
}

/**
 * The public catalogue of sobok's consumer sites, and the single place each site's display name is
 * written. Every name used to exist three times — once as the site's own `SITE_NAME` and once inside each
 * sibling's cross-link table — so a rename had to land in three apps at once to stay consistent.
 */
export const SOBOK_SERVICES = {
  stella: {
    id: 'stella',
    href: 'https://stella.sobok.cc',
    name: { ko: '별무리', en: 'Stella', ja: '星屑', zh: '星黛洛' },
  },
  zwds: {
    id: 'zwds',
    href: 'https://zwds.sobok.cc',
    name: { ko: '자미원', en: 'Ziwei', ja: '紫微垣', zh: '紫微垣' },
  },
  vibe: {
    id: 'vibe',
    href: 'https://vibe.sobok.cc',
    name: { ko: '결타레', en: 'vibe', ja: 'vibe', zh: 'vibe' },
  },
} satisfies Record<SobokServiceId, SobokService>

// Footer order. Declared once so every site lists its siblings in the same sequence rather than in
// whatever order its own table happened to be written in.
const ORDER: readonly SobokServiceId[] = ['stella', 'zwds', 'vibe']

/** The sibling sites a footer cross-links to: the catalogue in canonical order, minus the site itself. */
export function otherServices(self: SobokServiceId): readonly SobokService[] {
  return ORDER.filter((id) => id !== self).map((id) => SOBOK_SERVICES[id])
}
