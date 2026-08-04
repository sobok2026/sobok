'use client'

import type { ReactNode } from 'react'
import { accountLabel, useAccountLocale } from '@/lib/locale'

export function AccountShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const locale = useAccountLocale()

  return (
    <main className="page-shell">
      <a className="brand" href="/" aria-label={accountLabel(locale)}>
        <span className="brand-mark" aria-hidden="true">
          S
        </span>
        <span>{accountLabel(locale)}</span>
      </a>
      <section className={compact ? 'account-card account-card-compact' : 'account-card'}>{children}</section>
      <p className="trust-copy">하나의 계정으로 Sobok의 모든 서비스를 안전하게 이용하세요.</p>
    </main>
  )
}
