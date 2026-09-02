'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useOrganizationWorkspace } from '@/hooks/useOrganizationWorkspace'
import { organizationWorkspaceHref } from '@/lib/workspace-routes'
import AccessWorkspace from './AccessWorkspace'
import WorkspaceBreadcrumbs from './WorkspaceBreadcrumbs'

export default function OrganizationAccessPage() {
  const organizationId = useSearchParams().get('organizationId')
  const { state, reload } = useOrganizationWorkspace(organizationId)

  if (state.kind === 'loading') {
    return <p className="muted workspace-route-loading">기관 권한 정보를 준비하는 중입니다…</p>
  }

  if (state.kind !== 'ready') {
    return (
      <section className="workspace-page">
        <WorkspaceBreadcrumbs items={[{ label: '기관', href: '/workspace' }, { label: '참여자·권한' }]} />
        <div className="empty-panel workspace-route-error">
          <strong>{state.kind === 'error' ? '기관 정보를 불러오지 못했습니다.' : '기관을 찾을 수 없습니다.'}</strong>
          <p>기관 목록에서 접근할 기관을 다시 선택해주세요.</p>
          {state.kind === 'error' ? (
            <button className="button button-dark" onClick={reload} type="button">
              다시 시도
            </button>
          ) : (
            <Link className="button button-dark" href="/workspace">
              기관 목록으로
            </Link>
          )}
        </div>
      </section>
    )
  }

  const { organization, projects } = state

  return (
    <section className="workspace-page">
      <WorkspaceBreadcrumbs
        items={[
          { label: '기관', href: '/workspace' },
          { label: organization.name, href: organizationWorkspaceHref(organization.id) },
          { label: '참여자·권한' },
        ]}
      />
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">ACCESS CONTROL · {organization.slug}</p>
          <h1>참여자·권한</h1>
          <p>기관 관리 역할과 프로젝트별 실무 역할을 독립적으로 관리합니다.</p>
        </div>
        <Link className="button button-quiet" href={organizationWorkspaceHref(organization.id)}>
          프로젝트로 돌아가기
        </Link>
      </div>
      <AccessWorkspace organizationId={organization.id} projects={projects} />
    </section>
  )
}
