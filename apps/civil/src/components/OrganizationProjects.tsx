'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { useOrganizationWorkspace } from '@/hooks/useOrganizationWorkspace'
import { createProject, type OrganizationSummary } from '@/lib/api'
import { organizationAccessHref, projectModuleHref } from '@/lib/workspace-routes'
import WorkspaceBreadcrumbs from './WorkspaceBreadcrumbs'

const PROJECT_WRITE_ROLES: ReadonlySet<OrganizationSummary['role']> = new Set(['owner', 'administrator', 'designer'])

export default function OrganizationProjects() {
  const organizationId = useSearchParams().get('organizationId')
  const { state, reload } = useOrganizationWorkspace(organizationId)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(false)

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organizationId || state.kind !== 'ready') return

    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setCreating(true)
    setCreateError(false)
    try {
      await createProject(organizationId, {
        code: String(form.get('code') ?? '').trim(),
        name: String(form.get('name') ?? '').trim(),
        coordinateReferenceSystem: String(form.get('coordinateReferenceSystem') ?? '').trim(),
      })
      formElement.reset()
      reload()
    } catch {
      setCreateError(true)
    } finally {
      setCreating(false)
    }
  }

  if (state.kind === 'loading') {
    return <p className="muted workspace-route-loading">기관과 프로젝트를 불러오는 중입니다…</p>
  }

  if (state.kind !== 'ready') {
    return (
      <section className="workspace-page">
        <WorkspaceBreadcrumbs items={[{ label: '기관', href: '/workspace' }, { label: '프로젝트' }]} />
        <div className="empty-panel workspace-route-error">
          <strong>{state.kind === 'error' ? '기관 정보를 불러오지 못했습니다.' : '기관을 찾을 수 없습니다.'}</strong>
          <p>
            {state.kind === 'error' ? '잠시 후 다시 시도해주세요.' : '기관 목록에서 접근할 기관을 다시 선택해주세요.'}
          </p>
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

  const { organization, projects, role } = state

  return (
    <section className="workspace-page">
      <WorkspaceBreadcrumbs items={[{ label: '기관', href: '/workspace' }, { label: organization.name }]} />
      <div className="workspace-page-header">
        <div>
          <p className="eyebrow">PROJECTS · {organization.slug}</p>
          <h1>{organization.name}</h1>
          <p>프로젝트를 선택해 설계협업·계산·파일·납품·감사 업무로 이동합니다.</p>
        </div>
        <Link className="button button-quiet" href={organizationAccessHref(organization.id)}>
          참여자·권한 관리
        </Link>
      </div>
      <div className="project-layout workspace-project-layout">
        <div className="project-list">
          {projects.length === 0 ? <p className="muted">등록된 프로젝트가 없습니다.</p> : null}
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div>
                <small>{project.code}</small>
                <h2>{project.name}</h2>
              </div>
              <div className="project-card-meta">
                <span>{project.status}</span>
                <code>{project.coordinateReferenceSystem}</code>
                <Link
                  className="button button-dark"
                  href={projectModuleHref(organization.id, project.id, 'collaboration')}
                >
                  작업공간 열기
                </Link>
              </div>
            </article>
          ))}
        </div>
        {PROJECT_WRITE_ROLES.has(role) ? (
          <form className="project-form" onSubmit={submitProject}>
            <h2>프로젝트 만들기</h2>
            <label>
              사업 코드
              <input name="code" maxLength={48} placeholder="CE-2026-001" required />
            </label>
            <label>
              사업명
              <input name="name" maxLength={160} placeholder="농로 포장공사" required />
            </label>
            <label>
              좌표계
              <input name="coordinateReferenceSystem" maxLength={64} defaultValue="EPSG:5186" required />
            </label>
            {createError ? <p className="error-text">프로젝트를 만들지 못했습니다.</p> : null}
            <button className="button button-dark" disabled={creating} type="submit">
              {creating ? '만드는 중…' : '프로젝트 만들기'}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  )
}
