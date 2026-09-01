'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import {
  CivilApiError,
  deleteOrganizationMember,
  deleteProjectMember,
  listOrganizationMembers,
  listProjectMembers,
  type ManagedOrganizationRole,
  type OrganizationMember,
  type ProjectMember,
  type ProjectRole,
  type ProjectSummary,
  saveOrganizationMember,
  saveProjectMember,
  updateOrganizationMember,
} from '@/lib/api'

const ORGANIZATION_ROLE_LABELS: Record<ManagedOrganizationRole, string> = {
  owner: '소유자',
  administrator: '관리자',
  viewer: '기관 구성원',
}

const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  approver: '승인자',
  reviewer: '검토자',
  designer: '설계자',
  contractor: '업체 담당자',
  viewer: '열람자',
}

export default function AccessWorkspace({
  organizationId,
  projects,
}: {
  organizationId: string
  projects: ProjectSummary[]
}) {
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [actorRole, setActorRole] = useState<OrganizationMember['role'] | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [requestedProjectId, setRequestedProjectId] = useState('')
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [projectCanManage, setProjectCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedProjectId = projects.some((project) => project.id === requestedProjectId)
    ? requestedProjectId
    : (projects[0]?.id ?? '')

  const reloadOrganization = useCallback(async () => {
    const value = await listOrganizationMembers(organizationId)
    setMembers(value.items)
    setActorRole(value.actorRole)
    setCanManage(value.canManage)
  }, [organizationId])

  const reloadProject = useCallback(async () => {
    if (!selectedProjectId) {
      setProjectMembers([])
      setProjectCanManage(false)
      return
    }
    const value = await listProjectMembers(organizationId, selectedProjectId)
    setProjectMembers(value.items)
    setProjectCanManage(value.canManage)
  }, [organizationId, selectedProjectId])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([reloadOrganization(), reloadProject()])
      .catch(() => {
        if (active) setError('참여자 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadOrganization, reloadProject])

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true)
    setError(null)
    try {
      await saveOrganizationMember(organizationId, {
        email: String(form.get('email') ?? '').trim(),
        role: String(form.get('role')) as ManagedOrganizationRole,
      })
      formElement.reset()
      await reloadOrganization()
    } catch (reason) {
      setError(
        reason instanceof CivilApiError && reason.status === 404
          ? '해당 이메일로 Civil에 로그인한 계정을 찾지 못했습니다.'
          : '기관 참여자를 저장하지 못했습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function changeOrganizationRole(userId: string, role: ManagedOrganizationRole) {
    setSaving(true)
    setError(null)
    try {
      await updateOrganizationMember(organizationId, userId, role)
      await reloadOrganization()
    } catch (reason) {
      setError(
        reason instanceof CivilApiError && reason.status === 409
          ? '기관에는 최소 한 명의 소유자가 남아 있어야 합니다.'
          : '기관 역할을 변경하지 못했습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeMember(userId: string, name: string) {
    if (!window.confirm(`${name} 참여자를 기관에서 제외할까요? 프로젝트 배정도 함께 해제됩니다.`)) return
    setSaving(true)
    setError(null)
    try {
      await deleteOrganizationMember(organizationId, userId)
      await Promise.all([reloadOrganization(), reloadProject()])
    } catch (reason) {
      setError(
        reason instanceof CivilApiError && reason.status === 409
          ? '마지막 기관 소유자는 제외할 수 없습니다.'
          : '기관 참여자를 제외하지 못했습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function assignProjectMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProjectId) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true)
    setError(null)
    try {
      await saveProjectMember(organizationId, selectedProjectId, {
        userId: String(form.get('userId')),
        role: String(form.get('role')) as ProjectRole,
      })
      await reloadProject()
    } catch {
      setError('프로젝트 역할을 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function removeProjectAssignment(userId: string) {
    if (!selectedProjectId) return
    setSaving(true)
    setError(null)
    try {
      await deleteProjectMember(organizationId, selectedProjectId, userId)
      await reloadProject()
    } catch {
      setError('프로젝트 배정을 해제하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="access-panel" aria-labelledby="access-panel-title">
      <div className="artifact-heading">
        <div>
          <p className="eyebrow">TENANT ACCESS CONTROL</p>
          <h4 id="access-panel-title">참여자·권한</h4>
        </div>
        <button
          className="button button-quiet"
          onClick={() => void Promise.all([reloadOrganization(), reloadProject()])}
          type="button"
        >
          새로 고침
        </button>
      </div>
      <p className="panel-description">
        기관 역할은 관리 범위를, 프로젝트 역할은 설계·검토·승인 권한을 결정합니다. 사용자는 먼저 Civil에 한 번
        로그인해야 이메일로 배정할 수 있습니다.
      </p>
      {loading ? <p className="muted">참여자를 불러오는 중입니다…</p> : null}
      {error ? <p className="error-text action-error">{error}</p> : null}
      {!loading ? (
        <div className="access-layout">
          <div className="access-card">
            <h5>기관 구성원</h5>
            <div className="member-list">
              {members.map((member) => (
                <article className="member-row" key={member.userId}>
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                  </div>
                  {canManage &&
                  ['owner', 'administrator', 'viewer'].includes(member.role) &&
                  (actorRole === 'owner' || member.role === 'viewer') ? (
                    <select
                      aria-label={`${member.name} 기관 역할`}
                      disabled={saving}
                      onChange={(event) =>
                        void changeOrganizationRole(member.userId, event.target.value as ManagedOrganizationRole)
                      }
                      value={member.role}
                    >
                      {Object.entries(ORGANIZATION_ROLE_LABELS)
                        .filter(([value]) => actorRole === 'owner' || value === 'viewer')
                        .map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <span>{member.role}</span>
                  )}
                  {canManage && (actorRole === 'owner' || member.role === 'viewer') ? (
                    <button
                      className="button button-quiet danger-button"
                      disabled={saving}
                      onClick={() => void removeMember(member.userId, member.name)}
                      type="button"
                    >
                      제외
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
            {canManage ? (
              <form className="inline-access-form" onSubmit={addMember}>
                <label>
                  Civil 계정 이메일
                  <input name="email" type="email" maxLength={320} required />
                </label>
                <label>
                  기관 역할
                  <select defaultValue="viewer" name="role">
                    {Object.entries(ORGANIZATION_ROLE_LABELS)
                      .filter(([value]) => actorRole === 'owner' || value === 'viewer')
                      .map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
                <button className="button button-dark" disabled={saving} type="submit">
                  구성원 저장
                </button>
              </form>
            ) : null}
          </div>

          <div className="access-card">
            <h5>프로젝트 배정</h5>
            <label className="standalone-label">
              프로젝트
              <select onChange={(event) => setRequestedProjectId(event.target.value)} value={selectedProjectId}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="member-list">
              {projectMembers.length === 0 ? <p className="muted">배정된 참여자가 없습니다.</p> : null}
              {projectMembers.map((member) => (
                <article className="member-row" key={member.userId}>
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                  </div>
                  <span>{PROJECT_ROLE_LABELS[member.role as ProjectRole] ?? member.role}</span>
                  {projectCanManage ? (
                    <button
                      className="button button-quiet danger-button"
                      disabled={saving}
                      onClick={() => void removeProjectAssignment(member.userId)}
                      type="button"
                    >
                      배정 해제
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
            {projectCanManage && selectedProjectId ? (
              <form className="inline-access-form" onSubmit={assignProjectMember}>
                <label>
                  기관 구성원
                  <select name="userId" required>
                    {members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name} · {member.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  프로젝트 역할
                  <select defaultValue="viewer" name="role">
                    {Object.entries(PROJECT_ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button button-dark" disabled={saving || members.length === 0} type="submit">
                  프로젝트 배정
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
