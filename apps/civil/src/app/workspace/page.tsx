import type { Metadata } from 'next'
import OrganizationDirectory from '@/components/OrganizationDirectory'
import WorkspaceBreadcrumbs from '@/components/WorkspaceBreadcrumbs'

export const metadata: Metadata = {
  title: '기관 작업공간 — Civil',
  description: 'Civil 기관 작업공간을 선택하거나 새 기관을 만듭니다.',
}

export default function WorkspacePage() {
  return (
    <section className="workspace-page">
      <WorkspaceBreadcrumbs items={[{ label: '기관' }]} />
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">ORGANIZATIONS</p>
          <h1>내 기관</h1>
          <p>계정은 공유하지만 프로젝트 데이터와 역할은 기관 단위로 분리됩니다.</p>
        </div>
      </div>
      <OrganizationDirectory />
    </section>
  )
}
