'use client'

import { useCallback, useEffect, useState } from 'react'
import { listOrganizations, listProjects, type OrganizationSummary, type ProjectSummary } from '@/lib/api'

export type OrganizationWorkspaceState =
  | { kind: 'missing' }
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error' }
  | {
      kind: 'ready'
      organization: OrganizationSummary
      role: OrganizationSummary['role']
      projects: ProjectSummary[]
    }

type StoredState = { organizationId: string | null; value: OrganizationWorkspaceState }

export function useOrganizationWorkspace(organizationId: string | null): {
  state: OrganizationWorkspaceState
  reload: () => void
} {
  const [reloadVersion, setReloadVersion] = useState(0)
  const [stored, setStored] = useState<StoredState>({
    organizationId,
    value: organizationId ? { kind: 'loading' } : { kind: 'missing' },
  })

  useEffect(() => {
    if (!organizationId) {
      setStored({ organizationId: null, value: { kind: 'missing' } })
      return
    }

    let active = true
    setStored({ organizationId, value: { kind: 'loading' } })
    void Promise.all([listOrganizations(), listProjects(organizationId)])
      .then(([organizations, projects]) => {
        if (!active) return
        const organization = organizations.find((item) => item.id === organizationId)
        setStored({
          organizationId,
          value: organization
            ? { kind: 'ready', organization, role: projects.role, projects: projects.items }
            : { kind: 'not-found' },
        })
      })
      .catch(() => {
        if (active) setStored({ organizationId, value: { kind: 'error' } })
      })

    return () => {
      active = false
    }
  }, [organizationId, reloadVersion])

  const reload = useCallback(() => setReloadVersion((current) => current + 1), [])
  const state: OrganizationWorkspaceState =
    stored.organizationId === organizationId ? stored.value : organizationId ? { kind: 'loading' } : { kind: 'missing' }

  return { state, reload }
}
