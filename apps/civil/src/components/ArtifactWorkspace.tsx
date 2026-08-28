'use client'

import { type FormEvent, useEffect, useState } from 'react'
import {
  type ArtifactList,
  type ArtifactSummary,
  artifactDownloadPath,
  CivilApiError,
  listArtifacts,
  uploadArtifact,
} from '@/lib/api'

type ArtifactState = { kind: 'loading' } | { kind: 'ready'; value: ArtifactList } | { kind: 'error' }

const STATUS_LABELS: Record<ArtifactSummary['status'], string> = {
  uploading: '업로드 중',
  quarantined: '보안 검사 중',
  available: '사용 가능',
  rejected: '반입 거부',
  deleted: '삭제됨',
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function uploadErrorMessage(error: unknown): string {
  if (!(error instanceof CivilApiError)) return '업로드를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'
  if (error.status === 409) return '저장 용량 또는 진행 중인 업로드 한도를 확인해주세요.'
  if (error.status === 413) return '파일은 최대 1 GB까지 업로드할 수 있습니다.'
  return '업로드를 완료하지 못했습니다. 파일과 권한을 확인해주세요.'
}

export default function ArtifactWorkspace({
  organizationId,
  projectId,
  projectName,
  onClose,
}: {
  organizationId: string
  projectId: string
  projectName: string
  onClose: () => void
}) {
  const [artifacts, setArtifacts] = useState<ArtifactState>({ kind: 'loading' })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setArtifacts({ kind: 'loading' })
    void listArtifacts(organizationId, projectId)
      .then((value) => {
        if (active) setArtifacts({ kind: 'ready', value })
      })
      .catch(() => {
        if (active) setArtifacts({ kind: 'error' })
      })
    return () => {
      active = false
    }
  }, [organizationId, projectId])

  const hasPendingInspection =
    artifacts.kind === 'ready' && artifacts.value.items.some((item) => item.status === 'quarantined')

  useEffect(() => {
    if (!hasPendingInspection) return
    let active = true
    const interval = window.setInterval(() => {
      void listArtifacts(organizationId, projectId)
        .then((value) => {
          if (active) setArtifacts({ kind: 'ready', value })
        })
        .catch(() => undefined)
    }, 5000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [hasPendingInspection, organizationId, projectId])

  async function submitArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const field = form.elements.namedItem('artifact')
    const file = field instanceof HTMLInputElement ? field.files?.[0] : undefined
    if (!file) return
    setUploading(true)
    setProgress(0)
    setUploadError(null)
    try {
      await uploadArtifact(organizationId, projectId, file, setProgress)
      const value = await listArtifacts(organizationId, projectId)
      setArtifacts({ kind: 'ready', value })
      form.reset()
    } catch (error) {
      setUploadError(uploadErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="artifact-panel" aria-labelledby="artifact-panel-title">
      <div className="artifact-heading">
        <div>
          <p className="eyebrow">PRIVATE ARTIFACTS</p>
          <h4 id="artifact-panel-title">{projectName} 업무자료</h4>
        </div>
        <button className="button button-quiet" onClick={onClose} type="button">
          닫기
        </button>
      </div>

      {artifacts.kind === 'loading' ? <p className="muted">업무자료를 불러오는 중입니다…</p> : null}
      {artifacts.kind === 'error' ? <p className="error-text">업무자료를 불러오지 못했습니다.</p> : null}
      {artifacts.kind === 'ready' ? (
        <>
          <div className="storage-summary">
            <div>
              <span>기관 저장 용량</span>
              <strong>
                {formatBytes(artifacts.value.storageUsedBytes)} / {formatBytes(artifacts.value.storageQuotaBytes)}
              </strong>
            </div>
            <progress max={artifacts.value.storageQuotaBytes} value={artifacts.value.storageUsedBytes}>
              {artifacts.value.storageUsedBytes / artifacts.value.storageQuotaBytes}
            </progress>
          </div>

          <div className="artifact-layout">
            <div className="artifact-list">
              {artifacts.value.items.length === 0 ? (
                <div className="empty-panel artifact-empty">
                  <strong>등록된 업무자료가 없습니다.</strong>
                  <p>원본 파일은 비공개 저장소에 보관되며 보안 검사를 통과한 뒤에만 내려받을 수 있습니다.</p>
                </div>
              ) : null}
              {artifacts.value.items.map((artifact) => (
                <article className="artifact-card" key={artifact.id}>
                  <div className="artifact-file">
                    <span aria-hidden="true">FILE</span>
                    <div>
                      <h5>{artifact.fileName}</h5>
                      <p>
                        {formatBytes(artifact.byteSize)} · {artifact.detectedMediaType ?? artifact.mediaType}
                      </p>
                    </div>
                  </div>
                  <div className="artifact-state">
                    <span data-status={artifact.status}>{STATUS_LABELS[artifact.status]}</span>
                    {artifact.sha256 ? <code title={artifact.sha256}>{artifact.sha256.slice(0, 12)}…</code> : null}
                    {artifact.rejectionCode ? <small>{artifact.rejectionCode}</small> : null}
                  </div>
                  {artifact.status === 'available' ? (
                    <a
                      className="button button-dark artifact-download"
                      href={artifactDownloadPath(organizationId, projectId, artifact.id)}
                    >
                      내려받기
                    </a>
                  ) : null}
                </article>
              ))}
            </div>

            {artifacts.value.canUpload ? (
              <form className="artifact-form" onSubmit={submitArtifact}>
                <h5>업무자료 올리기</h5>
                <p>최대 1 GB · 8 MB 분할 전송 · 서버 SHA-256 및 악성코드 검사</p>
                <label>
                  파일 선택
                  <input name="artifact" type="file" required disabled={uploading} />
                </label>
                {uploading ? (
                  <div className="upload-progress" aria-live="polite">
                    <progress max={100} value={progress} />
                    <span>{progress}% 전송됨</span>
                  </div>
                ) : null}
                {uploadError ? <p className="error-text">{uploadError}</p> : null}
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
