'use client'

import type { ReactNode } from 'react'
import { civilAuthClient } from '@/lib/auth-client'
import AccountControls from './AccountControls'

export default function WorkspaceSessionBoundary({ children }: { children: ReactNode }) {
  const { data: session, isPending } = civilAuthClient.useSession()

  if (isPending) {
    return <p className="muted workspace-route-loading">계정 정보를 확인하는 중입니다…</p>
  }

  if (!session) {
    return (
      <section className="workspace-page">
        <div className="empty-panel workspace-sign-in-panel">
          <div>
            <strong>로그인 후 Civil 작업공간을 이용할 수 있습니다.</strong>
            <p>소복 계정은 인증만 담당하며 기관 역할과 프로젝트 권한은 Civil에서 별도로 관리됩니다.</p>
          </div>
          <AccountControls />
        </div>
      </section>
    )
  }

  return children
}
