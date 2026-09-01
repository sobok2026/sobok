import './globals.css'

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

const title = '검색 가능한 사람'
const description = '평범한 정보가 한 사람의 현실을 대신하기 시작하는 1인칭 인터랙티브 웹 작품.'

export const metadata: Metadata = {
  title,
  description,
  applicationName: title,
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#050505',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
