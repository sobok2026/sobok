import './globals.css'

import type { Metadata, Viewport } from 'next'
import { KO } from '@/content/ko'

export const metadata: Metadata = {
  title: KO.meta.title,
  description: KO.meta.description,
  applicationName: KO.brand,
  openGraph: {
    title: KO.meta.title,
    description: KO.meta.description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: KO.meta.title,
    description: KO.meta.description,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow pinch-zoom (WCAG 1.4.4). The canvas sets touch-action:none, so drags on the play surface stay safe.
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0e1a38',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
