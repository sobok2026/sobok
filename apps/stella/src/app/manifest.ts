import { DEFAULT_LOCALE } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { SITE_NAME, THEME_COLOR } from '@/constants'
import { ko } from '@/i18n/messages/ko'

export const dynamic = 'force-static'

// The manifest is a single global file, so it uses the default-locale (ko) copy.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME[DEFAULT_LOCALE],
    short_name: SITE_NAME[DEFAULT_LOCALE],
    description: ko.Constellation.meta.description,
    id: '/',
    start_url: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    lang: DEFAULT_LOCALE,
    protocol_handlers: [
      {
        protocol: 'web+stella',
        url: '/?protocol=web+stella&url=%s',
      },
    ],
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
