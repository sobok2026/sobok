'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { useOrganizationWorkspace } from '@/hooks/useOrganizationWorkspace'
import { organizationWorkspaceHref, PROJECT_MODULES, type ProjectModule } from '@/lib/workspace-routes'
import { ProjectWorkspaceProvider } from './ProjectWorkspaceContext'
import ProjectWorkspaceShell from './ProjectWorkspaceShell'
import WorkspaceBreadcrumbs from './WorkspaceBreadcrumbs'

export default function ProjectWorkspaceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')
  const projectId = searchParams.get('projectId')
  const { state, reload } = useOrganizationWorkspace(organizationId)

  if (state.kind === 'loading') {
    return <p className="muted workspace-route-loading">프로젝트 작업공간을 불러오는 중입니다…</p>
  }

  const project = state.kind === 'ready' ? state.projects.find((item) => item.id === projectId) : null

  if (state.kind !== 'ready' || !project) {
    const backHref = organizationId ? organizationWorkspaceHref(organizationId) : '/workspace'
    return (
      <section className="workspace-page">
        <WorkspaceBreadcrumbs items={[{ label: '기관', href: '/workspace' }, { label: '프로젝트 작업공간' }]} />
        <div className="empty-panel workspace-route-error">
          <strong>
            {state.kind === 'error' ? '프로젝트 정보를 불러오지 못했습니다.' : '프로젝트를 찾을 수 없습니다.'}
          </strong>
          <p>
            {state.kind === 'error'
              ? '잠시 후 다시 시도해주세요.'
              : '기관의 프로젝트 목록에서 접근할 프로젝트를 다시 선택해주세요.'}
          </p>
          {state.kind === 'error' ? (
            <button className="button button-dark" onClick={reload} type="button">
              다시 시도
            </button>
          ) : (
            <Link className="button button-dark" href={backHref}>
              프로젝트 목록으로
            </Link>
          )}
        </div>
      </section>
    )
  }

  const activeModule: ProjectModule = PROJECT_MODULES.find((item) => item.path === pathname)?.id ?? 'collaboration'
  const context = { organization: state.organization, project }

  return (
    <ProjectWorkspaceProvider value={context}>
      <ProjectWorkspaceShell activeModule={activeModule} {...context}>
        {children}
      </ProjectWorkspaceShell>
    </ProjectWorkspaceProvider>
  )
}
