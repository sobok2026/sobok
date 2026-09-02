import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrganizationProjects from '@/components/OrganizationProjects'

export const metadata: Metadata = {
  title: '프로젝트 — Civil',
  description: '기관의 Civil 프로젝트를 만들고 프로젝트 작업공간으로 이동합니다.',
}

export default function OrganizationPage() {
  return (
    <Suspense fallback={<p className="muted workspace-route-loading">기관을 확인하는 중입니다…</p>}>
      <OrganizationProjects />
    </Suspense>
  )
}
