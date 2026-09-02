import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  organizationWorkspaceHref,
  PROJECT_MODULES,
  type ProjectModule,
  projectModuleHref,
} from '@/lib/workspace-routes'
import type { ProjectRouteContext } from './ProjectWorkspaceContext'
import WorkspaceBreadcrumbs from './WorkspaceBreadcrumbs'

export default function ProjectWorkspaceShell({
  activeModule,
  organization,
  project,
  children,
}: ProjectRouteContext & { activeModule: ProjectModule; children: ReactNode }) {
  return (
    <section className="workspace-page">
      <WorkspaceBreadcrumbs
        items={[
          { label: '기관', href: '/workspace' },
          { label: organization.name, href: organizationWorkspaceHref(organization.id) },
          { label: project.name },
        ]}
      />
      <div className="project-workspace">
        <div className="project-workspace-heading">
          <div>
            <p className="eyebrow">PROJECT WORKSPACE · {project.code}</p>
            <h1>{project.name}</h1>
            <p>
              기준 좌표계 <code>{project.coordinateReferenceSystem}</code>
            </p>
          </div>
          <Link className="button button-quiet" href={organizationWorkspaceHref(organization.id)}>
            프로젝트 목록
          </Link>
        </div>
        <nav className="workspace-tabs" aria-label="프로젝트 업무">
          {PROJECT_MODULES.map((item) => (
            <Link
              aria-current={activeModule === item.id ? 'page' : undefined}
              className={activeModule === item.id ? 'active' : undefined}
              href={projectModuleHref(organization.id, project.id, item.id)}
              key={item.id}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="project-module">{children}</div>
      </div>
    </section>
  )
}
