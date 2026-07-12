import { DEFAULT_LOCALE } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { SITE_NAME, THEME_COLOR } from '@/constants'

export const dynamic = 'force-static'

// The manifest is a single global file, so it uses the default-locale (ko) copy.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '나의 별자리',
    short_name: SITE_NAME[DEFAULT_LOCALE],
    description: '상호작용 가능한 탄생 차트로 당신만의 우주를 탐험하세요.',
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
