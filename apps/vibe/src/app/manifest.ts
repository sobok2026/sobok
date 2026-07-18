import { DEFAULT_LOCALE } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { SITE_NAME, THEME_COLOR } from '@/constants'

export const dynamic = 'force-static'

// The manifest is a single global file, so it uses the default-locale (ko) copy.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '결타레 - 커플 케미 테스트',
    short_name: SITE_NAME[DEFAULT_LOCALE],
    description: '결지수 테스트와 대화 유형 테스트로 커플 케미를 확인해보세요.',
    id: '/',
    start_url: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    lang: DEFAULT_LOCALE,
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
