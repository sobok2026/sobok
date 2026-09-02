'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import {
  type ArtifactList,
  CivilApiError,
  createDelivery,
  type DeliveryDetail,
  type DeliveryKind,
  type DeliveryList,
  type DeliveryStatus,
  deliveryDownloadPath,
  getDelivery,
  listArtifacts,
  listDeliveries,
  reviewDelivery,
  submitDelivery,
  withdrawDelivery,
} from '@/lib/api'

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  assembling: '패키지 생성 중',
  ready: '제출 준비',
  submitted: '검토 중',
  changes_requested: '보완 요청',
  approved: '승인',
  failed: '생성 실패',
  withdrawn: '철회',
}

const KIND_LABELS: Record<DeliveryKind, string> = {
  survey: '측량성과',
  design: '설계성과',
  design_change: '변경설계',
  as_built: '준공성과',
}

const DOWNLOADABLE_STATUSES: ReadonlySet<DeliveryStatus> = new Set([
  'ready',
  'submitted',
  'changes_requested',
  'approved',
])
const WITHDRAWABLE_STATUSES: ReadonlySet<DeliveryStatus> = new Set(['assembling', 'ready', 'failed'])

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '산정 중'
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export default function DeliveryWorkspace({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const [deliveries, setDeliveries] = useState<DeliveryList | null>(null)
  const [artifacts, setArtifacts] = useState<ArtifactList | null>(null)
  const [detail, setDetail] = useState<DeliveryDetail | null>(null)
  const [loadingError, setLoadingError] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  const reload = useCallback(async () => {
    try {
      const [nextDeliveries, nextArtifacts] = await Promise.all([
        listDeliveries(organizationId, projectId),
        listArtifacts(organizationId, projectId),
      ])
      setDeliveries(nextDeliveries)
      setArtifacts(nextArtifacts)
      setLoadingError(false)
    } catch {
      setLoadingError(true)
    }
  }, [organizationId, projectId])

  useEffect(() => {
    void reload()
  }, [reload])

  const hasAssembling = deliveries?.items.some((item) => item.status === 'assembling') ?? false
  useEffect(() => {
    if (!hasAssembling) return
    const interval = window.setInterval(() => void reload(), 4000)
    return () => window.clearInterval(interval)
  }, [hasAssembling, reload])

  async function submitNewDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const artifactIds = form.getAll('artifactIds').map(String)
    if (artifactIds.length === 0) {
      setActionError('전자납품에 포함할 사용 가능한 파일을 하나 이상 선택해주세요.')
      return
    }
    setCreating(true)
    setActionError(null)
    try {
      await createDelivery(organizationId, projectId, {
        title: String(form.get('title') ?? '').trim(),
        deliveryKind: String(form.get('deliveryKind')) as DeliveryKind,
        vendorName: String(form.get('vendorName') ?? '').trim(),
        revision: String(form.get('revision') ?? '').trim(),
        artifactIds,
      })
      formElement.reset()
      await reload()
    } catch (error) {
      setActionError(
        error instanceof CivilApiError && error.status === 409
          ? '기관 또는 Workers Free 운영 한도에 맞춘 저장 용량을 초과했습니다.'
          : '전자납품 패키지를 만들지 못했습니다. 파일 상태와 권한을 확인해주세요.',
      )
    } finally {
      setCreating(false)
    }
  }

  async function openDetail(packageId: string) {
    setPendingId(packageId)
    setActionError(null)
    try {
      setDetail(await getDelivery(organizationId, projectId, packageId))
    } catch {
      setActionError('전자납품 상세 이력을 불러오지 못했습니다.')
    } finally {
      setPendingId(null)
    }
  }

  async function runAction(packageId: string, action: () => Promise<unknown>) {
    setPendingId(packageId)
    setActionError(null)
    try {
      await action()
      await reload()
      setDetail(await getDelivery(organizationId, projectId, packageId).catch(() => null))
    } catch (error) {
      setActionError(
        error instanceof CivilApiError && error.status === 409
          ? '현재 패키지 상태에서는 이 작업을 수행할 수 없습니다.'
          : '전자납품 상태를 변경하지 못했습니다.',
      )
    } finally {
      setPendingId(null)
    }
  }

  async function review(packageId: string, decision: 'changes_requested' | 'approved') {
    const note = (reviewNotes[packageId] ?? '').trim()
    if (!note) {
      setActionError('공식 검토 결정에는 검토 의견을 입력해주세요.')
      return
    }
    await runAction(packageId, () => reviewDelivery(organizationId, projectId, packageId, { decision, note }))
    setReviewNotes((current) => ({ ...current, [packageId]: '' }))
  }

  const availableArtifacts = artifacts?.items.filter((item) => item.status === 'available') ?? []

  return (
    <section className="delivery-panel" aria-labelledby="delivery-panel-title">
      <div className="artifact-heading">
        <div>
          <p className="eyebrow">IMMUTABLE DELIVERY PACKAGE</p>
          <h2 id="delivery-panel-title">전자납품</h2>
        </div>
        <button className="button button-quiet" onClick={() => void reload()} type="button">
          새로 고침
        </button>
      </div>
      <div className="security-notice">
        <strong>원본 파일 + manifest.json + 패키지 SHA-256</strong>
        <p>
          제출 패키지는 생성 시점의 파일명·revision·좌표계·바이트 크기·해시를 고정합니다. 제출 후 보완은 기존 패키지를
          수정하지 않고 새 revision으로 만들어야 합니다.
        </p>
      </div>
      {!deliveries && !loadingError ? <p className="muted">전자납품을 불러오는 중입니다…</p> : null}
      {loadingError ? <p className="error-text">전자납품을 불러오지 못했습니다.</p> : null}
      {actionError ? <p className="error-text action-error">{actionError}</p> : null}

      {deliveries ? (
        <div className="delivery-layout">
          <div className="delivery-main">
            <div className="delivery-list">
              {deliveries.items.length === 0 ? (
                <div className="empty-panel">
                  <strong>전자납품 패키지가 없습니다.</strong>
                  <p>검증 완료된 프로젝트 파일을 선택해 ZIP 성과품을 생성할 수 있습니다.</p>
                </div>
              ) : null}
              {deliveries.items.map((item) => (
                <article className="delivery-card" key={item.id}>
                  <div className="delivery-card-head">
                    <div>
                      <small>{KIND_LABELS[item.deliveryKind]}</small>
                      <h3>{item.title}</h3>
                      <p>
                        {item.vendorName} · {item.revision} · {item.artifactCount}개 파일 · {formatBytes(item.byteSize)}
                      </p>
                    </div>
                    <span className="delivery-status" data-status={item.status}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <div className="delivery-hashes">
                    {item.sha256 ? <code title={item.sha256}>ZIP {item.sha256.slice(0, 16)}…</code> : null}
                    {item.manifestSha256 ? (
                      <code title={item.manifestSha256}>MANIFEST {item.manifestSha256.slice(0, 16)}…</code>
                    ) : null}
                    {item.failureCode ? <span>{item.failureCode}</span> : null}
                  </div>
                  <div className="delivery-actions">
                    <button
                      className="button button-quiet"
                      disabled={pendingId === item.id}
                      onClick={() => void openDetail(item.id)}
                      type="button"
                    >
                      이력·목록
                    </button>
                    {DOWNLOADABLE_STATUSES.has(item.status) ? (
                      <a className="button button-dark" href={deliveryDownloadPath(organizationId, projectId, item.id)}>
                        ZIP 내려받기
                      </a>
                    ) : null}
                    {item.status === 'ready' && deliveries.canCreate ? (
                      <button
                        className="button button-accent"
                        disabled={pendingId === item.id}
                        onClick={() =>
                          void runAction(item.id, () => submitDelivery(organizationId, projectId, item.id, null))
                        }
                        type="button"
                      >
                        공식 제출
                      </button>
                    ) : null}
                    {WITHDRAWABLE_STATUSES.has(item.status) && deliveries.canCreate ? (
                      <button
                        className="button button-quiet danger-button"
                        disabled={pendingId === item.id}
                        onClick={() => {
                          if (window.confirm(`“${item.title}” 패키지를 철회하고 저장 객체를 삭제할까요?`)) {
                            void runAction(item.id, () => withdrawDelivery(organizationId, projectId, item.id))
                          }
                        }}
                        type="button"
                      >
                        철회
                      </button>
                    ) : null}
                  </div>
                  {item.status === 'submitted' && (deliveries.canReview || deliveries.canApprove) ? (
                    <div className="review-controls">
                      <label>
                        검토 의견
                        <textarea
                          maxLength={2000}
                          onChange={(event) =>
                            setReviewNotes((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                          placeholder="판정 근거와 보완 요구사항을 입력하세요."
                          value={reviewNotes[item.id] ?? ''}
                        />
                      </label>
                      <div>
                        {deliveries.canReview ? (
                          <button
                            className="button button-quiet"
                            disabled={pendingId === item.id}
                            onClick={() => void review(item.id, 'changes_requested')}
                            type="button"
                          >
                            보완 요청
                          </button>
                        ) : null}
                        {deliveries.canApprove ? (
                          <button
                            className="button button-accent"
                            disabled={pendingId === item.id}
                            onClick={() => void review(item.id, 'approved')}
                            type="button"
                          >
                            승인
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            {detail ? (
              <section className="delivery-detail" aria-labelledby="delivery-detail-title">
                <div className="delivery-card-head">
                  <div>
                    <p className="eyebrow">PACKAGE RECORD</p>
                    <h3 id="delivery-detail-title">{detail.item.title}</h3>
                  </div>
                  <button className="button button-quiet" onClick={() => setDetail(null)} type="button">
                    닫기
                  </button>
                </div>
                <div className="delivery-detail-grid">
                  <div>
                    <h4>포함 파일</h4>
                    <ol className="delivery-file-list">
                      {detail.items.map((item) => (
                        <li key={item.artifactId}>
                          <strong>{item.archivePath}</strong>
                          <span>
                            {item.revision} · {formatBytes(item.byteSize)} · {item.sha256.slice(0, 14)}…
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h4>상태 이력</h4>
                    <ol className="delivery-event-list">
                      {detail.events.map((event) => (
                        <li key={event.id}>
                          <strong>{STATUS_LABELS[event.toStatus]}</strong>
                          <span>{new Date(event.createdAt).toLocaleString('ko-KR')}</span>
                          {event.note ? <p>{event.note}</p> : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          {deliveries.canCreate ? (
            <form className="delivery-form" onSubmit={submitNewDelivery}>
              <h3>전자납품 패키지 만들기</h3>
              <label>
                납품 제목
                <input maxLength={160} name="title" placeholder="설계성과품 1차 납품" required />
              </label>
              <div className="form-grid two">
                <label>
                  납품 구분
                  <select defaultValue="design" name="deliveryKind">
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
                제출 업체
                <input maxLength={160} name="vendorName" placeholder="○○엔지니어링" required />
              </label>
              <fieldset className="delivery-picker">
                <legend>포함 파일</legend>
                {availableArtifacts.length === 0 ? (
                  <p>먼저 도면·파일 보관에서 검증 완료된 파일을 등록해주세요.</p>
                ) : null}
                {availableArtifacts.map((artifact) => (
                  <label key={artifact.id}>
                    <input name="artifactIds" type="checkbox" value={artifact.id} />
                    <span>
                      <strong>{artifact.fileName}</strong>
                      <small>
                        {artifact.kind} · {artifact.revision} · {formatBytes(artifact.byteSize)}
                      </small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <p className="form-note">최대 100개 파일, 원본 합계 1GB까지 하나의 무압축 ZIP으로 생성합니다.</p>
              <button
                className="button button-accent"
                disabled={creating || availableArtifacts.length === 0}
                type="submit"
              >
                {creating ? '패키지 요청 중…' : '패키지 생성'}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
