'use client'

import { type FormEvent, useEffect, useState } from 'react'
import {
  createOrganization,
  createProject,
  listOrganizations,
  listProjects,
  type OrganizationSummary,
  type ProjectSummary,
} from '@/lib/api'
import { civilAuthClient } from '@/lib/auth-client'
import AccessWorkspace from './AccessWorkspace'
import ProjectWorkspace from './ProjectWorkspace'

type OrganizationState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'ready'; items: OrganizationSummary[] }
  | { kind: 'error' }

type ProjectState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'ready'; role: OrganizationSummary['role']; items: ProjectSummary[] }
  | { kind: 'error' }

const PROJECT_WRITE_ROLES: ReadonlySet<OrganizationSummary['role']> = new Set(['owner', 'administrator', 'designer'])

export default function OrganizationWorkspace() {
  const { data: session, isPending } = civilAuthClient.useSession()
  const userId = session?.user.id
  const [organizations, setOrganizations] = useState<OrganizationState>({ kind: 'idle' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(false)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectState>({ kind: 'idle' })
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null)
  const [creatingProject, setCreatingProject] = useState(false)
  const [projectError, setProjectError] = useState(false)

  useEffect(() => {
    if (isPending || !userId) {
      setOrganizations({ kind: 'idle' })
      return
    }
    let active = true
    setOrganizations({ kind: 'loading' })
    void listOrganizations()
      .then((items) => {
        if (active) setOrganizations({ kind: 'ready', items })
      })
      .catch(() => {
        if (active) setOrganizations({ kind: 'error' })
      })
    return () => {
      active = false
    }
  }, [isPending, userId])

  useEffect(() => {
    if (!userId || !selectedOrganizationId) {
      setProjects({ kind: 'idle' })
      return
    }
    let active = true
    setProjects({ kind: 'loading' })
    void listProjects(selectedOrganizationId)
      .then((result) => {
        if (active) setProjects({ kind: 'ready', ...result })
      })
      .catch(() => {
        if (active) setProjects({ kind: 'error' })
      })
    return () => {
      active = false
    }
  }, [selectedOrganizationId, userId])

  async function submitOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const name = String(form.get('name') ?? '').trim()
    const slug = String(form.get('slug') ?? '')
      .trim()
      .toLowerCase()
    if (!name || !slug) return
    setCreating(true)
    setCreateError(false)
    try {
      const item = await createOrganization({ name, slug })
      setOrganizations((current) =>
        current.kind === 'ready'
          ? { kind: 'ready', items: [...current.items, item] }
          : { kind: 'ready', items: [item] },
      )
      setSelectedOrganizationId(item.id)
      setSelectedProject(null)
      formElement.reset()
    } catch {
      setCreateError(true)
    } finally {
      setCreating(false)
    }
  }

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrganizationId) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setCreatingProject(true)
    setProjectError(false)
    try {
      const item = await createProject(selectedOrganizationId, {
        code: String(form.get('code') ?? '').trim(),
        name: String(form.get('name') ?? '').trim(),
        coordinateReferenceSystem: String(form.get('coordinateReferenceSystem') ?? '').trim(),
      })
      setProjects((current) =>
        current.kind === 'ready'
          ? { ...current, items: [...current.items, item] }
          : { kind: 'ready', role: 'owner', items: [item] },
      )
      setOrganizations((current) =>
        current.kind === 'ready'
          ? {
              kind: 'ready',
              items: current.items.map((organization) =>
                organization.id === selectedOrganizationId
                  ? { ...organization, projectCount: organization.projectCount + 1 }
                  : organization,
              ),
            }
          : current,
      )
      formElement.reset()
    } catch {
      setProjectError(true)
    } finally {
      setCreatingProject(false)
    }
  }

  return (
    <section className="organization-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ORGANIZATIONS</p>
          <h2>내 기관</h2>
        </div>
        <p>계정은 공유하지만 모든 프로젝트 데이터와 권한은 기관 단위로 분리됩니다.</p>
      </div>

      {!session && !isPending ? (
        <div className="empty-panel">
          <strong>로그인 후 기관 작업공간을 만들 수 있습니다.</strong>
          <p>소복 계정은 인증만 담당하고 Civil의 역할과 프로젝트 권한은 별도로 관리됩니다.</p>
        </div>
      ) : null}

      {session ? (
        <div className="organization-layout">
          <div className="organization-list">
            {organizations.kind === 'loading' ? <p className="muted">기관을 불러오는 중입니다…</p> : null}
            {organizations.kind === 'error' ? <p className="error-text">기관을 불러오지 못했습니다.</p> : null}
            {organizations.kind === 'ready' && organizations.items.length === 0 ? (
              <p className="muted">아직 소속된 기관이 없습니다.</p>
            ) : null}
            {organizations.kind === 'ready'
              ? organizations.items.map((organization) => (
                  <article className="organization-card" key={organization.id}>
                    <div>
                      <small>{organization.slug}</small>
                      <h3>{organization.name}</h3>
                    </div>
                    <dl>
                      <div>
                        <dt>역할</dt>
                        <dd>{organization.role}</dd>
                      </div>
                      <div>
                        <dt>프로젝트</dt>
                        <dd>{organization.projectCount}</dd>
                      </div>
                    </dl>
                    <button
                      className="button button-quiet"
                      onClick={() => {
                        setSelectedOrganizationId(organization.id)
                        setSelectedProject(null)
                      }}
                      type="button"
                    >
                      프로젝트
                    </button>
                  </article>
                ))
              : null}
          </div>
          <form className="organization-form" onSubmit={submitOrganization}>
            <h3>기관 작업공간 만들기</h3>
            <label>
              기관명
              <input name="name" maxLength={120} placeholder="예: 소복건설기술" required />
            </label>
            <label>
              기관 식별자
              <input name="slug" maxLength={48} pattern="[a-z0-9-]+" placeholder="sobok-engineering" required />
            </label>
            {createError ? <p className="form-error">기관을 만들지 못했습니다. 식별자를 확인해주세요.</p> : null}
            <button className="button button-accent" disabled={creating} type="submit">
              {creating ? '만드는 중…' : '기관 만들기'}
            </button>
          </form>
        </div>
      ) : null}

      {session && selectedOrganizationId ? (
        <section className="project-panel" aria-labelledby="project-panel-title">
          <div className="project-panel-heading">
            <div>
              <p className="eyebrow">PROJECTS</p>
              <h3 id="project-panel-title">프로젝트</h3>
            </div>
            <button
              className="button button-quiet"
              onClick={() => {
                setSelectedOrganizationId(null)
                setSelectedProject(null)
              }}
              type="button"
            >
              닫기
            </button>
          </div>
          {projects.kind === 'loading' ? <p className="muted">프로젝트를 불러오는 중입니다…</p> : null}
          {projects.kind === 'error' ? <p className="error-text">프로젝트를 불러오지 못했습니다.</p> : null}
          {projects.kind === 'ready' ? (
            <>
              <div className="project-layout">
                <div className="project-list">
                  {projects.items.length === 0 ? <p className="muted">등록된 프로젝트가 없습니다.</p> : null}
                  {projects.items.map((project) => (
                    <article className="project-card" key={project.id}>
                      <div>
                        <small>{project.code}</small>
                        <h4>{project.name}</h4>
                      </div>
                      <div className="project-card-meta">
                        <span>{project.status}</span>
                        <code>{project.coordinateReferenceSystem}</code>
                        <button
                          className="button button-dark"
                          onClick={() => setSelectedProject(project)}
                          type="button"
                        >
                          작업공간 열기
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {PROJECT_WRITE_ROLES.has(projects.role) ? (
                  <form className="project-form" onSubmit={submitProject}>
                    <h4>프로젝트 만들기</h4>
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
                    {projectError ? <p className="error-text">프로젝트를 만들지 못했습니다.</p> : null}
                    <button className="button button-dark" disabled={creatingProject} type="submit">
                      {creatingProject ? '만드는 중…' : '프로젝트 만들기'}
                    </button>
                  </form>
                ) : null}
              </div>
              <AccessWorkspace organizationId={selectedOrganizationId} projects={projects.items} />
            </>
          ) : null}
        </section>
      ) : null}

      {session && selectedOrganizationId && selectedProject ? (
        <ProjectWorkspace
          onClose={() => setSelectedProject(null)}
          organizationId={selectedOrganizationId}
          project={selectedProject}
        />
      ) : null}
    </section>
  )
}
