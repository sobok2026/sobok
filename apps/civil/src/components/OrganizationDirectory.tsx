'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'
import { createOrganization, listOrganizations, type OrganizationSummary } from '@/lib/api'
import { organizationWorkspaceHref } from '@/lib/workspace-routes'

type DirectoryState = { kind: 'loading' } | { kind: 'ready'; items: OrganizationSummary[] } | { kind: 'error' }

export default function OrganizationDirectory() {
  const [state, setState] = useState<DirectoryState>({ kind: 'loading' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(false)

  useEffect(() => {
    let active = true
    void listOrganizations()
      .then((items) => {
        if (active) setState({ kind: 'ready', items })
      })
      .catch(() => {
        if (active) setState({ kind: 'error' })
      })
    return () => {
      active = false
    }
  }, [])

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
      setState((current) =>
        current.kind === 'ready'
          ? { kind: 'ready', items: [...current.items, item] }
          : { kind: 'ready', items: [item] },
      )
      formElement.reset()
    } catch {
      setCreateError(true)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="organization-layout">
      <div className="organization-list">
        {state.kind === 'loading' ? <p className="muted">기관을 불러오는 중입니다…</p> : null}
        {state.kind === 'error' ? <p className="error-text">기관을 불러오지 못했습니다.</p> : null}
        {state.kind === 'ready' && state.items.length === 0 ? (
          <div className="empty-panel compact-empty-panel">
            <strong>아직 소속된 기관이 없습니다.</strong>
            <p>오른쪽 양식에서 첫 기관 작업공간을 만들 수 있습니다.</p>
          </div>
        ) : null}
        {state.kind === 'ready'
          ? state.items.map((organization) => (
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
                <Link className="button button-quiet" href={organizationWorkspaceHref(organization.id)}>
                  프로젝트
                </Link>
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
  )
}
