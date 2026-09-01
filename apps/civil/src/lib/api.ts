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

export type OrganizationRole = OrganizationSummary['role']
export type ManagedOrganizationRole = 'owner' | 'administrator' | 'viewer'
export type ProjectRole = 'approver' | 'reviewer' | 'designer' | 'contractor' | 'viewer'

export type OrganizationMember = {
  userId: string
  name: string
  email: string
  role: OrganizationRole
  createdAt: string
  updatedAt: string
}

export type ProjectMember = {
  userId: string
  name: string
  email: string
  role: OrganizationRole
  createdAt: string
  updatedAt: string
}

export type DesignWorkType = 'original' | 'change' | 'as_built'
export type DesignRevisionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'awaiting_approval'
  | 'approved'
  | 'finalized'
export type DesignReviewArea = 'drawing' | 'quantity' | 'price' | 'unit_cost' | 'cost_calculation' | 'external_agency'
export type DesignReviewResult = 'unreviewed' | 'compliant' | 'changes_required' | 'not_applicable'
export type DesignTransition =
  | 'submit'
  | 'start_review'
  | 'request_changes'
  | 'request_approval'
  | 'approve'
  | 'finalize'

export type DesignRevisionSummary = {
  id: string
  workType: DesignWorkType
  revisionNumber: number
  title: string
  status: DesignRevisionStatus
  reason: string | null
  documentNumber: string | null
  scheduleImpactDays: number | null
  costImpactAmount: number | null
  createdByUserId: string
  submittedAt: string | null
  approvedAt: string | null
  finalizedAt: string | null
  createdAt: string
  updatedAt: string
  reviewCount: number
  unresolvedReviewCount: number
}

export type DesignRevisionDetail = {
  role: OrganizationRole
  canContribute: boolean
  canReview: boolean
  canApprove: boolean
  item: Omit<DesignRevisionSummary, 'reviewCount' | 'unresolvedReviewCount'> & {
    legalBasis: string | null
    baseDrawingArtifactId: string | null
    newDrawingArtifactId: string | null
    baseCalculationResultId: string | null
    newCalculationResultId: string | null
  }
  reviews: Array<{
    id: string
    area: DesignReviewArea
    item: string
    result: DesignReviewResult
    comment: string | null
    response: string | null
    reviewedByUserId: string | null
    respondedByUserId: string | null
    reviewedAt: string | null
    respondedAt: string | null
    createdAt: string
    updatedAt: string
  }>
  events: Array<{
    id: number
    fromStatus: DesignRevisionStatus | null
    toStatus: DesignRevisionStatus
    note: string | null
    actorType: 'user' | 'system'
    actorUserId: string | null
    createdAt: string
  }>
  finalization: { id: string; snapshotHash: string; finalizedByUserId: string; createdAt: string } | null
}

export type DesignRevisionInput = {
  title: string
  reason: string | null
  legalBasis: string | null
  documentNumber: string | null
  scheduleImpactDays: number | null
  costImpactAmount: number | null
  baseDrawingArtifactId: string | null
  newDrawingArtifactId: string | null
  baseCalculationResultId: string | null
  newCalculationResultId: string | null
}

export type EarthworkInput = {
  coordinateReferenceSystem: string
  sections: Array<{ station: number; cutArea: number; fillArea: number }>
}

export type CalculationSummary = {
  job: {
    id: string
    kind: string
    status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
    algorithmVersion: string
    input: EarthworkInput
    inputHash: string
    failureCode: string | null
    requestedByUserId: string
    queuedAt: string
    startedAt: string | null
    completedAt: string | null
  }
  result: {
    id: string
    jobId: string
    revision: number
    output: {
      coordinateReferenceSystem: string
      unitSystem: 'SI'
      totals: { cutVolume: number; fillVolume: number; netVolume: number }
      segments: Array<unknown>
    }
    outputHash: string
    unitSystem: string
    coordinateReferenceSystem: string
    createdAt: string
  } | null
  approval: {
    id: string
    resultId: string
    status: 'draft' | 'submitted' | 'changes_requested' | 'approved' | 'superseded'
    note: string | null
    actedByUserId: string
    actedAt: string
  } | null
}

export type CalculationList = {
  role: OrganizationRole
  canCreate: boolean
  canReview: boolean
  canApprove: boolean
  items: CalculationSummary[]
}

export type AuditEvent = {
  id: string
  actorType: 'user' | 'system'
  actorUserId: string | null
  actorName: string | null
  actorEmail: string | null
  action: string
  targetType: string
  targetId: string
  requestId: string
  detail: Record<string, unknown>
  createdAt: string
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

export function listOrganizationMembers(organizationId: string): Promise<{
  actorRole: OrganizationRole
  canManage: boolean
  items: OrganizationMember[]
}> {
  return civilFetch(`/organizations/${encodeURIComponent(organizationId)}/members`, { cache: 'no-store' })
}

export function saveOrganizationMember(
  organizationId: string,
  input: { email: string; role: ManagedOrganizationRole },
): Promise<OrganizationMember> {
  return civilFetch(`/organizations/${encodeURIComponent(organizationId)}/members`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updateOrganizationMember(
  organizationId: string,
  userId: string,
  role: ManagedOrganizationRole,
): Promise<{ role: ManagedOrganizationRole }> {
  return civilFetch(`/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ role }),
  })
}

export function deleteOrganizationMember(organizationId: string, userId: string): Promise<null> {
  return civilFetch(`/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

export function listProjectMembers(
  organizationId: string,
  projectId: string,
): Promise<{
  canManage: boolean
  items: ProjectMember[]
}> {
  return civilFetch(`${projectPath(organizationId, projectId)}/members`, { cache: 'no-store' })
}

export function saveProjectMember(
  organizationId: string,
  projectId: string,
  input: { userId: string; role: ProjectRole },
): Promise<{ userId: string; role: ProjectRole }> {
  return civilFetch(`${projectPath(organizationId, projectId)}/members`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function deleteProjectMember(organizationId: string, projectId: string, userId: string): Promise<null> {
  return civilFetch(`${projectPath(organizationId, projectId)}/members/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

export function listDesignRevisions(
  organizationId: string,
  projectId: string,
): Promise<{
  role: OrganizationRole
  canContribute: boolean
  canReview: boolean
  canApprove: boolean
  items: DesignRevisionSummary[]
}> {
  return civilFetch(`${projectPath(organizationId, projectId)}/design-revisions`, { cache: 'no-store' })
}

export function createDesignRevision(
  organizationId: string,
  projectId: string,
  input: DesignRevisionInput & { workType: DesignWorkType },
): Promise<DesignRevisionDetail['item']> {
  return civilFetch(`${projectPath(organizationId, projectId)}/design-revisions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function getDesignRevision(
  organizationId: string,
  projectId: string,
  revisionId: string,
): Promise<DesignRevisionDetail> {
  return civilFetch(`${projectPath(organizationId, projectId)}/design-revisions/${encodeURIComponent(revisionId)}`, {
    cache: 'no-store',
  })
}

export function updateDesignRevision(
  organizationId: string,
  projectId: string,
  revisionId: string,
  input: DesignRevisionInput,
): Promise<DesignRevisionDetail['item']> {
  return civilFetch(`${projectPath(organizationId, projectId)}/design-revisions/${encodeURIComponent(revisionId)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function transitionDesignRevision(
  organizationId: string,
  projectId: string,
  revisionId: string,
  input: { action: DesignTransition; note: string | null },
): Promise<{ status: DesignRevisionStatus }> {
  return civilFetch(
    `${projectPath(organizationId, projectId)}/design-revisions/${encodeURIComponent(revisionId)}/transition`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
}

export function createDesignReview(
  organizationId: string,
  projectId: string,
  revisionId: string,
  input: { area: DesignReviewArea; item: string; comment: string | null },
): Promise<DesignRevisionDetail['reviews'][number]> {
  return civilFetch(
    `${projectPath(organizationId, projectId)}/design-revisions/${encodeURIComponent(revisionId)}/reviews`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
}

export function decideDesignReview(
  organizationId: string,
  projectId: string,
  revisionId: string,
  reviewId: string,
  input: { result: DesignReviewResult; comment: string | null },
): Promise<{ result: DesignReviewResult }> {
  return civilFetch(
    `${projectPath(organizationId, projectId)}/design-revisions/${encodeURIComponent(revisionId)}/reviews/${encodeURIComponent(reviewId)}`,
    { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) },
  )
}

export function respondDesignReview(
  organizationId: string,
  projectId: string,
  revisionId: string,
  reviewId: string,
  response: string,
): Promise<{ response: string }> {
  return civilFetch(
    `${projectPath(organizationId, projectId)}/design-revisions/${encodeURIComponent(revisionId)}/reviews/${encodeURIComponent(reviewId)}/response`,
    { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ response }) },
  )
}

export function listCalculations(organizationId: string, projectId: string): Promise<CalculationList> {
  return civilFetch(`${projectPath(organizationId, projectId)}/calculations`, { cache: 'no-store' })
}

export function createEarthworkCalculation(
  organizationId: string,
  projectId: string,
  input: EarthworkInput,
): Promise<{ id: string; status: 'queued' }> {
  return civilFetch(`${projectPath(organizationId, projectId)}/calculations/earthwork-average-end-area`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function actOnCalculationApproval(
  organizationId: string,
  projectId: string,
  resultId: string,
  input: { action: 'submit' | 'request_changes' | 'approve'; note: string | null },
): Promise<{ id: string; status: string; actedAt: string }> {
  return civilFetch(`${projectPath(organizationId, projectId)}/results/${encodeURIComponent(resultId)}/approval`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function listAuditEvents(
  organizationId: string,
  projectId: string,
  before?: string,
): Promise<{ role: OrganizationRole; items: AuditEvent[] }> {
  const query = new URLSearchParams({ limit: '50' })
  if (before) query.set('before', before)
  return civilFetch(`${projectPath(organizationId, projectId)}/audit-events?${query}`, { cache: 'no-store' })
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
