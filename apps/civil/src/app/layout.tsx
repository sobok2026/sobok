import FontStylesheets from '@sobok/typography/stylesheets'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Civil — 공간기반 토목업무 플랫폼',
  description: '도면, 수량, 토공, 단가, 내역과 전자납품을 하나의 검증 가능한 흐름으로 관리합니다.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4f2ec',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <FontStylesheets locale="ko" />
      <body>{children}</body>
    </html>
  )
}
