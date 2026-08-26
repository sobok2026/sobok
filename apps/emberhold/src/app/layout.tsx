import './globals.css'

import FontStylesheets from '@sobok/typography/stylesheets'
import type { Metadata, Viewport } from 'next'

const title = '마지막 불씨 | Emberhold'
const description = '생존자를 합치고 전선 명령을 내려 세 막, 열두 번의 혹한과 세 보스를 돌파하는 생존 전략 게임.'

export const metadata: Metadata = {
  metadataBase: new URL('https://emberhold.sobok.cc'),
  title,
  description,
  applicationName: 'Emberhold',
  appleWebApp: {
    capable: true,
    title: 'Emberhold',
    statusBarStyle: 'black-translucent',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title,
    description,
    type: 'website',
    images: [
      {
        url: '/emberhold-og.jpg',
        width: 1731,
        height: 909,
        alt: '설원 요새의 마지막 화로를 지키는 Emberhold 원정대',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/emberhold-og.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#07131e',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <FontStylesheets includeKoreanHanWebfont={false} locale="ko" />
      <body>{children}</body>
    </html>
  )
}
