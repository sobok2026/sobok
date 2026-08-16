import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '마지막 불씨 | Emberhold',
    short_name: 'Emberhold',
    description: '생존자를 합치고 전선 명령을 내려 세 막, 열두 번의 혹한과 세 보스를 돌파하는 생존 전략 게임.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#07131e',
    theme_color: '#07131e',
    categories: ['games', 'strategy', 'entertainment'],
    screenshots: [
      {
        src: '/install-preview-narrow.webp',
        sizes: '750x1334',
        type: 'image/webp',
        form_factor: 'narrow',
        label: '모바일 화면에서 마지막 화로와 설원 요새를 마주하는 원정',
      },
      {
        src: '/emberhold-og.jpg',
        sizes: '1731x909',
        type: 'image/jpeg',
        form_factor: 'wide',
        label: '설원 요새와 마지막 화로를 지키는 3막 원정',
      },
    ],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
