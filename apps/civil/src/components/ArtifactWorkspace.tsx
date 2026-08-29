'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import {
  type ArtifactKind,
  type ArtifactList,
  type ArtifactSummary,
  artifactDownloadPath,
  CivilApiError,
  deleteArtifact,
  listArtifacts,
  uploadArtifact,
} from '@/lib/api'

const STATUS_LABELS: Record<ArtifactSummary['status'], string> = {
  uploading: '업로드 중',
  verifying: '형식·무결성 확인 중',
  verification_failed: '검증 처리 실패',
  available: '사용 가능',
  rejected: '형식 불일치',
  deleted: '삭제됨',
}

const KIND_LABELS: Record<ArtifactKind, string> = {
  drawing: '설계도면',
  survey: '측량성과',
  calculation_input: '계산 입력',
  cost_basis: '단가·원가 근거',
  deliverable: '성과품',
  supporting: '참고자료',
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function uploadErrorMessage(error: unknown): string {
  if (!(error instanceof CivilApiError)) return '업로드를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'
  if (error.status === 409) return '저장 용량, 진행 중 업로드 또는 전자납품 참조 상태를 확인해주세요.'
  if (error.status === 413) return '파일은 최대 1GB까지 업로드할 수 있습니다.'
  if (error.status === 422) return '지원 형식과 입력한 도면 메타데이터를 확인해주세요.'
  return '업로드를 완료하지 못했습니다. 파일과 권한을 확인해주세요.'
}

export default function ArtifactWorkspace({
  organizationId,
  projectId,
  projectCoordinateReferenceSystem,
}: {
  organizationId: string
  projectId: string
  projectCoordinateReferenceSystem: string
}) {
  const [artifacts, setArtifacts] = useState<ArtifactList | null>(null)
  const [loadingError, setLoadingError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setArtifacts(await listArtifacts(organizationId, projectId))
      setLoadingError(false)
    } catch {
      setLoadingError(true)
    }
  }, [organizationId, projectId])

  useEffect(() => {
    void reload()
  }, [reload])

  const hasPendingVerification = artifacts?.items.some((item) => item.status === 'verifying') ?? false
  useEffect(() => {
    if (!hasPendingVerification) return
    const interval = window.setInterval(() => void reload(), 4000)
    return () => window.clearInterval(interval)
  }, [hasPendingVerification, reload])

  async function submitArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const field = formElement.elements.namedItem('artifact')
    const file = field instanceof HTMLInputElement ? field.files?.[0] : undefined
    if (!file) return
    const coordinates = ['minX', 'minY', 'maxX', 'maxY'].map((name) => String(form.get(name) ?? '').trim())
    const hasAnyCoordinate = coordinates.some(Boolean)
    if (hasAnyCoordinate && coordinates.some((value) => !value || !Number.isFinite(Number(value)))) {
      setActionError('공간 범위를 입력하려면 최소·최대 X/Y 네 값을 모두 입력해주세요.')
      return
    }
    const boundingBox = hasAnyCoordinate
      ? {
          minX: Number(coordinates[0]),
          minY: Number(coordinates[1]),
          maxX: Number(coordinates[2]),
          maxY: Number(coordinates[3]),
        }
      : null
    setUploading(true)
    setProgress(0)
    setActionError(null)
    try {
      await uploadArtifact(
        organizationId,
        projectId,
        {
          file,
          kind: String(form.get('kind')) as ArtifactKind,
          revision: String(form.get('revision') ?? '').trim(),
          coordinateReferenceSystem: String(form.get('coordinateReferenceSystem') ?? '').trim() || null,
          boundingBox,
          previousArtifactId: String(form.get('previousArtifactId') ?? '') || null,
        },
        setProgress,
      )
      formElement.reset()
      await reload()
    } catch (error) {
      setActionError(uploadErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  async function removeArtifact(artifact: ArtifactSummary) {
    if (!window.confirm(`“${artifact.fileName}” 파일을 비공개 저장소에서 삭제할까요?`)) return
    setDeletingId(artifact.id)
    setActionError(null)
    try {
      await deleteArtifact(organizationId, projectId, artifact.id)
      await reload()
    } catch (error) {
      setActionError(
        error instanceof CivilApiError && error.status === 409
          ? '전자납품 패키지에 포함된 파일은 해당 패키지를 철회하기 전까지 삭제할 수 없습니다.'
          : '파일을 삭제하지 못했습니다.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const availableArtifacts = artifacts?.items.filter((item) => item.status === 'available') ?? []

  return (
    <section className="artifact-panel" aria-labelledby="artifact-panel-title">
      <div className="artifact-heading">
        <div>
          <p className="eyebrow">PRIVATE R2 STORAGE</p>
          <h4 id="artifact-panel-title">도면·파일 보관</h4>
        </div>
        <button className="button button-quiet" onClick={() => void reload()} type="button">
          새로 고침
        </button>
      </div>

      <div className="security-notice">
        <strong>비공개 원본 · 강제 다운로드 · SHA-256</strong>
        <p>
          허용 확장자와 파일 시그니처 및 실제 크기를 확인합니다. 악성코드 검사는 제공하지 않으므로 내려받은 파일은
          신뢰할 수 있는 작성자와 별도 보안 절차를 통해 확인해야 합니다.
        </p>
      </div>

      {!artifacts && !loadingError ? <p className="muted">업무자료를 불러오는 중입니다…</p> : null}
      {loadingError ? <p className="error-text">업무자료를 불러오지 못했습니다.</p> : null}
      {artifacts ? (
        <>
          <div className="storage-summary">
            <div>
              <span>기관 저장 용량</span>
              <strong>
                {formatBytes(artifacts.storageUsedBytes)} / {formatBytes(artifacts.storageQuotaBytes)}
              </strong>
            </div>
            <progress max={artifacts.storageQuotaBytes} value={artifacts.storageUsedBytes} />
          </div>
          <div className="artifact-layout">
            <div className="artifact-list">
              {artifacts.items.length === 0 ? (
                <div className="empty-panel artifact-empty">
                  <strong>등록된 도면·파일이 없습니다.</strong>
                  <p>도면, 측량성과, 계산 입력과 원가 근거를 프로젝트 revision에 연결해 보관할 수 있습니다.</p>
                </div>
              ) : null}
              {artifacts.items.map((artifact) => (
                <article className="artifact-card" key={artifact.id}>
                  <div className="artifact-file">
                    <span aria-hidden="true">{artifact.detectedFormat?.toUpperCase() ?? 'FILE'}</span>
                    <div>
                      <h5>{artifact.fileName}</h5>
                      <p>
                        {KIND_LABELS[artifact.kind]} · {artifact.revision} · {formatBytes(artifact.byteSize)}
                      </p>
                      <small>
                        {artifact.coordinateReferenceSystem ?? '좌표계 없음'}
                        {artifact.previousArtifactId ? ' · 이전 revision 연결됨' : ''}
                      </small>
                    </div>
                  </div>
                  <div className="artifact-state">
                    <span data-status={artifact.status}>{STATUS_LABELS[artifact.status]}</span>
                    {artifact.sha256 ? <code title={artifact.sha256}>{artifact.sha256.slice(0, 14)}…</code> : null}
                    {artifact.rejectionCode ? <small>{artifact.rejectionCode}</small> : null}
                    {artifact.verificationFailureCode ? <small>{artifact.verificationFailureCode}</small> : null}
                  </div>
                  <div className="artifact-actions">
                    {artifact.status === 'available' ? (
                      <a
                        className="button button-dark artifact-download"
                        href={artifactDownloadPath(organizationId, projectId, artifact.id)}
                      >
                        내려받기
                      </a>
                    ) : null}
                    {['available', 'rejected', 'verification_failed'].includes(artifact.status) ? (
                      <button
                        className="button button-quiet"
                        disabled={deletingId === artifact.id}
                        onClick={() => void removeArtifact(artifact)}
                        type="button"
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            {artifacts.canUpload ? (
              <form className="artifact-form" onSubmit={submitArtifact}>
                <h5>도면·파일 올리기</h5>
                <p>최대 1GB · 8MB 분할 전송 · 형식 시그니처와 SHA-256 확인</p>
                <label>
                  파일
                  <input
                    accept=".csv,.docx,.dwg,.dxf,.geojson,.hwp,.hwpx,.ifc,.json,.landxml,.las,.laz,.pdf,.tif,.tiff,.txt,.xls,.xlsx,.xml,.zip"
                    disabled={uploading}
                    name="artifact"
                    required
                    type="file"
                  />
                </label>
                <div className="form-grid two">
                  <label>
                    자료 구분
                    <select defaultValue="drawing" name="kind">
                      {Object.entries(KIND_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Revision
                    <input defaultValue="R1" maxLength={64} name="revision" required />
                  </label>
                </div>
                <label>
                  좌표계
                  <input
                    defaultValue={projectCoordinateReferenceSystem}
                    maxLength={64}
                    name="coordinateReferenceSystem"
                  />
                </label>
                <label>
                  이전 파일 revision
                  <select defaultValue="" name="previousArtifactId">
                    <option value="">최초 revision</option>
                    {availableArtifacts.map((artifact) => (
                      <option key={artifact.id} value={artifact.id}>
                        {artifact.fileName} · {artifact.revision}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend>공간 범위 · 선택</legend>
                  <div className="form-grid two">
                    <input aria-label="최소 X" name="minX" placeholder="min X" type="number" step="any" />
                    <input aria-label="최소 Y" name="minY" placeholder="min Y" type="number" step="any" />
                    <input aria-label="최대 X" name="maxX" placeholder="max X" type="number" step="any" />
                    <input aria-label="최대 Y" name="maxY" placeholder="max Y" type="number" step="any" />
                  </div>
                </fieldset>
                {uploading ? (
                  <div className="upload-progress" aria-live="polite">
                    <progress max={100} value={progress} />
                    <span>{progress}% 전송됨</span>
                  </div>
                ) : null}
                {actionError ? <p className="error-text">{actionError}</p> : null}
                <button className="button button-accent" disabled={uploading} type="submit">
                  {uploading ? '업로드 중…' : '업로드 시작'}
                </button>
              </form>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  )
}
