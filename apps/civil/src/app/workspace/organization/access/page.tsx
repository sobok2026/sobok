import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrganizationAccessPage from '@/components/OrganizationAccessPage'

export const metadata: Metadata = {
  title: '참여자·권한 — Civil',
  description: 'Civil 기관 구성원과 프로젝트별 역할을 관리합니다.',
}

export default function AccessPage() {
  return (
    <Suspense fallback={<p className="muted workspace-route-loading">기관 권한을 확인하는 중입니다…</p>}>
      <OrganizationAccessPage />
    </Suspense>
  )
}
