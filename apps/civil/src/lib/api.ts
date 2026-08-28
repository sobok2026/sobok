export type OrganizationSummary = {
  id: string
  name: string
  slug: string
  role: 'owner' | 'administrator' | 'approver' | 'reviewer' | 'designer' | 'contractor' | 'viewer'
  projectCount: number
  createdAt: string
}

export type ProjectSummary = {
  id: string
  organizationId: string
  code: string
  name: string
  status: 'planning' | 'design' | 'review' | 'approved' | 'closed'
  coordinateReferenceSystem: string
  createdAt: string
  updatedAt: string
}

type OrganizationListResponse = { items: OrganizationSummary[] }

export class CivilApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'CivilApiError'
    this.status = status
  }
}

async function civilFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...init?.headers,
    },
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'title' in payload && typeof payload.title === 'string'
        ? payload.title
        : `HTTP ${response.status}`
    throw new CivilApiError(response.status, message)
  }
  return payload as T
}

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  const response = await civilFetch<OrganizationListResponse>('/organizations', { cache: 'no-store' })
  return response.items
}

export function createOrganization(input: { name: string; slug: string }): Promise<OrganizationSummary> {
  return civilFetch<OrganizationSummary>('/organizations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function listProjects(organizationId: string): Promise<{
  role: OrganizationSummary['role']
  items: ProjectSummary[]
}> {
  return civilFetch(`/organizations/${encodeURIComponent(organizationId)}/projects`, { cache: 'no-store' })
}

export function createProject(
  organizationId: string,
  input: { code: string; name: string; coordinateReferenceSystem: string },
): Promise<ProjectSummary> {
  return civilFetch(`/organizations/${encodeURIComponent(organizationId)}/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}
