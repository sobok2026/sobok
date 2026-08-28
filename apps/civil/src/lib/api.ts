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

export type ArtifactSummary = {
  id: string
  fileName: string
  mediaType: string
  detectedMediaType: string | null
  byteSize: number
  sha256: string | null
  status: 'uploading' | 'quarantined' | 'available' | 'rejected' | 'deleted'
  rejectionCode: string | null
  createdAt: string
  scannedAt: string | null
  availableAt: string | null
}

export type ArtifactList = {
  storageQuotaBytes: number
  storageUsedBytes: number
  canUpload: boolean
  items: ArtifactSummary[]
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

function projectPath(organizationId: string, projectId: string): string {
  return `/organizations/${encodeURIComponent(organizationId)}/projects/${encodeURIComponent(projectId)}`
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

export function listArtifacts(organizationId: string, projectId: string): Promise<ArtifactList> {
  return civilFetch(`${projectPath(organizationId, projectId)}/artifacts`, { cache: 'no-store' })
}

type ArtifactUploadSession = {
  artifact: Pick<ArtifactSummary, 'id' | 'fileName' | 'mediaType' | 'byteSize' | 'status'>
  upload: { partSize: number; partCount: number; expiresAt: string }
}

async function retryArtifactPart(path: string, body: Blob): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await civilFetch(path, { method: 'PUT', body })
      return
    } catch (error) {
      lastError = error
      if (error instanceof CivilApiError && error.status < 500 && error.status !== 409) throw error
      if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
  throw lastError
}

export async function uploadArtifact(
  organizationId: string,
  projectId: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<{ id: string; status: 'quarantined' }> {
  const base = `${projectPath(organizationId, projectId)}/artifacts`
  const session = await civilFetch<ArtifactUploadSession>(`${base}/uploads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mediaType: file.type || 'application/octet-stream',
      byteSize: file.size,
    }),
  })

  let failure: unknown
  let nextPart = 1
  let uploadedBytes = 0
  let completionStarted = false
  const uploadNext = async () => {
    while (!failure) {
      const partNumber = nextPart
      nextPart += 1
      if (partNumber > session.upload.partCount) return
      const start = (partNumber - 1) * session.upload.partSize
      const part = file.slice(start, Math.min(start + session.upload.partSize, file.size))
      try {
        await retryArtifactPart(`${base}/${session.artifact.id}/uploads/${partNumber}`, part)
        uploadedBytes += part.size
        onProgress(Math.round((uploadedBytes / file.size) * 100))
      } catch (error) {
        failure = error
      }
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(3, session.upload.partCount) }, () => uploadNext()))
    if (failure) throw failure
    completionStarted = true
    return await civilFetch(`${base}/${session.artifact.id}/complete`, { method: 'POST' })
  } catch (error) {
    if (!completionStarted) {
      await civilFetch(`${base}/${session.artifact.id}/upload`, { method: 'DELETE' }).catch(() => undefined)
    }
    throw error
  }
}

export function artifactDownloadPath(organizationId: string, projectId: string, artifactId: string): string {
  return `/api${projectPath(organizationId, projectId)}/artifacts/${encodeURIComponent(artifactId)}/download`
}
