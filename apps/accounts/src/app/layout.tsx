import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: '소복 계정',
  description: 'Sobok 서비스에서 함께 사용하는 안전한 통합 계정',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
