import { DEFAULT_LOCALE } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { SITE_NAME, THEME_COLOR } from '@/constants'

export const dynamic = 'force-static'

// The manifest is a single global file, so it uses the default-locale (ko) copy.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '나의 별자리',
    short_name: SITE_NAME[DEFAULT_LOCALE],
    description:
      '생년월일시로 나만의 탄생 별자리를 그려 보세요. 태양·달·상승 별자리부터 행성 배치와 하우스 원소 밸런스까지 별자리판에서 한눈에 봐요.',
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
