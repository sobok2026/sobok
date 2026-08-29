import FontStylesheets from '@sobok/typography/stylesheets'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Civil — 검증 가능한 토목 계산 플랫폼',
  description: '기관별로 격리된 수량·토공 계산의 입력, 알고리즘 버전, 결과 해시와 승인 이력을 관리합니다.',
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
