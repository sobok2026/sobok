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

export type ArtifactKind = 'drawing' | 'survey' | 'calculation_input' | 'cost_basis' | 'deliverable' | 'supporting'

export type ArtifactSummary = {
  id: string
  fileName: string
  mediaType: string
  detectedMediaType: string | null
  detectedFormat: string | null
  byteSize: number
  sha256: string | null
  kind: ArtifactKind
  revision: string
  coordinateReferenceSystem: string | null
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number } | null
  previousArtifactId: string | null
  status: 'uploading' | 'verifying' | 'verification_failed' | 'available' | 'rejected' | 'deleted'
  rejectionCode: string | null
  verificationFailureCode: string | null
  createdAt: string
  verifiedAt: string | null
  availableAt: string | null
}

export type ArtifactList = {
  storageQuotaBytes: number
  storageUsedBytes: number
  canUpload: boolean
  items: ArtifactSummary[]
}

export type DeliveryKind = 'survey' | 'design' | 'design_change' | 'as_built'
export type DeliveryStatus =
  | 'assembling'
  | 'ready'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'failed'
  | 'withdrawn'

export type DeliverySummary = {
  id: string
  title: string
  deliveryKind: DeliveryKind
  vendorName: string
  revision: string
  status: DeliveryStatus
  byteSize: number | null
  sha256: string | null
  manifestSha256: string | null
  failureCode: string | null
  submittedAt: string | null
  reviewedAt: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  artifactCount: number
}

export type DeliveryList = {
  canCreate: boolean
  canReview: boolean
  canApprove: boolean
  items: DeliverySummary[]
}

export type DeliveryDetail = {
  item: Omit<DeliverySummary, 'artifactCount'> & { manifest: Record<string, unknown> | null }
  items: Array<{
    artifactId: string
    ordinal: number
    archivePath: string
    fileName: string
    mediaType: string
    byteSize: number
    sha256: string
    kind: ArtifactKind
    revision: string
    coordinateReferenceSystem: string | null
  }>
  events: Array<{
    id: number
    fromStatus: DeliveryStatus | null
    toStatus: DeliveryStatus
    note: string | null
    actorType: 'user' | 'system'
    actorUserId: string | null
    createdAt: string
  }>
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
  artifact: Pick<ArtifactSummary, 'id' | 'fileName' | 'mediaType' | 'byteSize' | 'kind' | 'revision' | 'status'>
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
  input: {
    file: File
    kind: ArtifactKind
    revision: string
    coordinateReferenceSystem: string | null
    boundingBox: ArtifactSummary['boundingBox']
    previousArtifactId: string | null
  },
  onProgress: (progress: number) => void,
): Promise<{ id: string; status: 'verifying' }> {
  const base = `${projectPath(organizationId, projectId)}/artifacts`
  const session = await civilFetch<ArtifactUploadSession>(`${base}/uploads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fileName: input.file.name,
      mediaType: input.file.type || 'application/octet-stream',
      byteSize: input.file.size,
      kind: input.kind,
      revision: input.revision,
      coordinateReferenceSystem: input.coordinateReferenceSystem,
      boundingBox: input.boundingBox,
      previousArtifactId: input.previousArtifactId,
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
      const part = input.file.slice(start, Math.min(start + session.upload.partSize, input.file.size))
      try {
        await retryArtifactPart(`${base}/${session.artifact.id}/uploads/${partNumber}`, part)
        uploadedBytes += part.size
        onProgress(Math.round((uploadedBytes / input.file.size) * 100))
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

export function deleteArtifact(organizationId: string, projectId: string, artifactId: string): Promise<null> {
  return civilFetch(`${projectPath(organizationId, projectId)}/artifacts/${encodeURIComponent(artifactId)}`, {
    method: 'DELETE',
  })
}

export function listDeliveries(organizationId: string, projectId: string): Promise<DeliveryList> {
  return civilFetch(`${projectPath(organizationId, projectId)}/deliveries`, { cache: 'no-store' })
}

export function getDelivery(organizationId: string, projectId: string, packageId: string): Promise<DeliveryDetail> {
  return civilFetch(`${projectPath(organizationId, projectId)}/deliveries/${encodeURIComponent(packageId)}`, {
    cache: 'no-store',
  })
}

export function createDelivery(
  organizationId: string,
  projectId: string,
  input: {
    title: string
    deliveryKind: DeliveryKind
    vendorName: string
    revision: string
    artifactIds: string[]
  },
): Promise<DeliverySummary> {
  return civilFetch(`${projectPath(organizationId, projectId)}/deliveries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function submitDelivery(
  organizationId: string,
  projectId: string,
  packageId: string,
  note: string | null,
): Promise<{ status: 'submitted' }> {
  return civilFetch(`${projectPath(organizationId, projectId)}/deliveries/${encodeURIComponent(packageId)}/submit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ note }),
  })
}

export function reviewDelivery(
  organizationId: string,
  projectId: string,
  packageId: string,
  input: { decision: 'changes_requested' | 'approved'; note: string },
): Promise<{ status: 'changes_requested' | 'approved' }> {
  return civilFetch(`${projectPath(organizationId, projectId)}/deliveries/${encodeURIComponent(packageId)}/review`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function withdrawDelivery(organizationId: string, projectId: string, packageId: string): Promise<null> {
  return civilFetch(`${projectPath(organizationId, projectId)}/deliveries/${encodeURIComponent(packageId)}`, {
    method: 'DELETE',
  })
}

export function deliveryDownloadPath(organizationId: string, projectId: string, packageId: string): string {
  return `/api${projectPath(organizationId, projectId)}/deliveries/${encodeURIComponent(packageId)}/download`
}
