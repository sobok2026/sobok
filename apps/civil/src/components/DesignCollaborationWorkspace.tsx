'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import {
  type ArtifactSummary,
  createDesignReview,
  createDesignRevision,
  type DesignReviewArea,
  type DesignReviewResult,
  type DesignRevisionDetail,
  type DesignRevisionInput,
  type DesignRevisionStatus,
  type DesignRevisionSummary,
  type DesignTransition,
  type DesignWorkType,
  decideDesignReview,
  getDesignRevision,
  listArtifacts,
  listCalculations,
  listDesignRevisions,
  respondDesignReview,
  transitionDesignRevision,
  updateDesignRevision,
} from '@/lib/api'

const STATUS_LABELS: Record<DesignRevisionStatus, string> = {
  draft: '작성 중',
  submitted: '제출',
  under_review: '검토 중',
  changes_requested: '보완 요청',
  awaiting_approval: '승인 대기',
  approved: '승인',
  finalized: '확정',
}

const WORK_TYPE_LABELS: Record<DesignWorkType, string> = {
  original: '원안',
  change: '변경',
  as_built: '준공',
}

const AREA_LABELS: Record<DesignReviewArea, string> = {
  drawing: '도면',
  quantity: '수량',
  price: '단가',
  unit_cost: '일위대가',
  cost_calculation: '원가계산',
  external_agency: '관계기관',
}

const RESULT_LABELS: Record<DesignReviewResult, string> = {
  unreviewed: '미검토',
  compliant: '적합',
  changes_required: '보완',
  not_applicable: '해당 없음',
}

function nullableText(form: FormData, name: string): string | null {
  return String(form.get(name) ?? '').trim() || null
}

function nullableInteger(form: FormData, name: string): number | null {
  const value = String(form.get(name) ?? '').trim()
  return value ? Number(value) : null
}

function revisionInput(form: FormData): DesignRevisionInput {
  return {
    title: String(form.get('title') ?? '').trim(),
    reason: nullableText(form, 'reason'),
    legalBasis: nullableText(form, 'legalBasis'),
    documentNumber: nullableText(form, 'documentNumber'),
    scheduleImpactDays: nullableInteger(form, 'scheduleImpactDays'),
    costImpactAmount: nullableInteger(form, 'costImpactAmount'),
    baseDrawingArtifactId: nullableText(form, 'baseDrawingArtifactId'),
    newDrawingArtifactId: nullableText(form, 'newDrawingArtifactId'),
    baseCalculationResultId: nullableText(form, 'baseCalculationResultId'),
    newCalculationResultId: nullableText(form, 'newCalculationResultId'),
  }
}

function availableTransitions(detail: DesignRevisionDetail): Array<{ action: DesignTransition; label: string }> {
  const status = detail.item.status
  const transitions: Array<{ action: DesignTransition; label: string }> = []
  if (detail.canContribute && (status === 'draft' || status === 'changes_requested')) {
    transitions.push({ action: 'submit', label: status === 'draft' ? '설계 제출' : '보완본 재제출' })
  }
  if (detail.canReview && status === 'submitted') transitions.push({ action: 'start_review', label: '검토 시작' })
  if (detail.canReview && status === 'under_review') {
    transitions.push({ action: 'request_changes', label: '보완 요청' })
    transitions.push({ action: 'request_approval', label: '승인 상신' })
  }
  if (detail.canApprove && status === 'awaiting_approval') transitions.push({ action: 'approve', label: '승인' })
  if (detail.canApprove && status === 'approved') transitions.push({ action: 'finalize', label: '확정·잠금' })
  return transitions
}

export default function DesignCollaborationWorkspace({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const [revisions, setRevisions] = useState<DesignRevisionSummary[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([])
  const [calculationResults, setCalculationResults] = useState<Array<{ id: string; label: string }>>([])
  const [detail, setDetail] = useState<DesignRevisionDetail | null>(null)
  const [capabilities, setCapabilities] = useState({ canContribute: false, canReview: false, canApprove: false })
  const [transitionNote, setTransitionNote] = useState('')
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [designs, artifactList, calculations] = await Promise.all([
      listDesignRevisions(organizationId, projectId),
      listArtifacts(organizationId, projectId),
      listCalculations(organizationId, projectId),
    ])
    setRevisions(designs.items)
    setCapabilities({
      canContribute: designs.canContribute,
      canReview: designs.canReview,
      canApprove: designs.canApprove,
    })
    setArtifacts(artifactList.items.filter((item) => item.status === 'available' && item.kind === 'drawing'))
    setCalculationResults(
      calculations.items.flatMap((item) =>
        item.result
          ? [
              {
                id: item.result.id,
                label: `${item.job.kind} · ${item.result.outputHash.slice(0, 12)}…`,
              },
            ]
          : [],
      ),
    )
  }, [organizationId, projectId])

  useEffect(() => {
    let active = true
    setLoading(true)
    reload()
      .catch(() => {
        if (active) setError('설계협업 자료를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reload])

  async function refreshDetail(revisionId: string) {
    const value = await getDesignRevision(organizationId, projectId, revisionId)
    setDetail(value)
  }

  async function createRevision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true)
    setError(null)
    try {
      const created = await createDesignRevision(organizationId, projectId, {
        workType: String(form.get('workType')) as DesignWorkType,
        ...revisionInput(form),
      })
      formElement.reset()
      await reload()
      await refreshDetail(created.id)
    } catch {
      setError('설계회차를 만들지 못했습니다. 연결한 도면과 계산 결과를 확인해주세요.')
    } finally {
      setSaving(false)
    }
  }

  async function saveRevision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail) return
    setSaving(true)
    setError(null)
    try {
      await updateDesignRevision(
        organizationId,
        projectId,
        detail.item.id,
        revisionInput(new FormData(event.currentTarget)),
      )
      await Promise.all([reload(), refreshDetail(detail.item.id)])
    } catch {
      setError('작성 중 또는 보완 요청 상태에서만 설계회차를 수정할 수 있습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function transition(action: DesignTransition) {
    if (!detail) return
    setSaving(true)
    setError(null)
    try {
      await transitionDesignRevision(organizationId, projectId, detail.item.id, {
        action,
        note: transitionNote.trim() || null,
      })
      setTransitionNote('')
      await Promise.all([reload(), refreshDetail(detail.item.id)])
    } catch {
      setError(
        action === 'request_approval'
          ? '미검토 또는 보완 항목이 남아 있으면 승인 상신할 수 없습니다.'
          : '현재 상태 또는 역할에서는 이 전이를 수행할 수 없습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function addReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true)
    setError(null)
    try {
      await createDesignReview(organizationId, projectId, detail.item.id, {
        area: String(form.get('area')) as DesignReviewArea,
        item: String(form.get('item') ?? '').trim(),
        comment: nullableText(form, 'comment'),
      })
      formElement.reset()
      await refreshDetail(detail.item.id)
    } catch {
      setError('검토 중 상태에서만 체크리스트를 추가할 수 있습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function decideReview(reviewId: string, result: DesignReviewResult) {
    if (!detail) return
    setSaving(true)
    setError(null)
    try {
      await decideDesignReview(organizationId, projectId, detail.item.id, reviewId, {
        result,
        comment: reviewNotes[reviewId]?.trim() || null,
      })
      await refreshDetail(detail.item.id)
    } catch {
      setError('검토 항목 판정을 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function respondReview(reviewId: string) {
    if (!detail) return
    const response = responses[reviewId]?.trim()
    if (!response) {
      setError('보완 답변을 입력해주세요.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await respondDesignReview(organizationId, projectId, detail.item.id, reviewId, response)
      await refreshDetail(detail.item.id)
    } catch {
      setError('보완 답변을 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const transitions = detail ? availableTransitions(detail) : []
  const editable = detail?.canContribute && ['draft', 'changes_requested'].includes(detail.item.status)

  return (
    <section className="collaboration-panel" aria-labelledby="collaboration-title">
      <div className="artifact-heading">
        <div>
          <p className="eyebrow">CONTROLLED DESIGN REVISION</p>
          <h2 id="collaboration-title">설계협업·변경관리</h2>
        </div>
        <button className="button button-quiet" onClick={() => void reload()} type="button">
          새로 고침
        </button>
      </div>
      <p className="panel-description">
        원안·변경·준공 회차를 제출하고 검토·보완·승인합니다. 확정 시 전체 메타데이터와 체크리스트를 해시한 불변
        스냅샷으로 잠급니다.
      </p>
      {loading ? <p className="muted">설계회차를 불러오는 중입니다…</p> : null}
      {error ? <p className="error-text action-error">{error}</p> : null}
      {!loading ? (
        <div className="collaboration-layout">
          <div className="revision-list">
            {revisions.length === 0 ? <p className="muted">등록된 설계회차가 없습니다.</p> : null}
            {revisions.map((revision) => (
              <article className="revision-card" key={revision.id}>
                <div>
                  <small>
                    {WORK_TYPE_LABELS[revision.workType]} {revision.revisionNumber}차
                  </small>
                  <h3>{revision.title}</h3>
                  <p>
                    검토 {revision.reviewCount}건 · 미해결 {revision.unresolvedReviewCount}건
                  </p>
                </div>
                <span data-status={revision.status}>{STATUS_LABELS[revision.status]}</span>
                <button className="button button-quiet" onClick={() => void refreshDetail(revision.id)} type="button">
                  열기
                </button>
              </article>
            ))}
          </div>
          {capabilities.canContribute ? (
            <form className="revision-form" onSubmit={createRevision}>
              <h3>새 설계회차</h3>
              <RevisionFields artifacts={artifacts} calculationResults={calculationResults} />
              <label>
                구분
                <select defaultValue="original" name="workType">
                  {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button-accent" disabled={saving} type="submit">
                설계회차 만들기
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {detail ? (
        <section className="revision-detail">
          <div className="delivery-card-head">
            <div>
              <p className="eyebrow">REVISION RECORD</p>
              <h3>
                {WORK_TYPE_LABELS[detail.item.workType]} {detail.item.revisionNumber}차 · {detail.item.title}
              </h3>
            </div>
            <button className="button button-quiet" onClick={() => setDetail(null)} type="button">
              닫기
            </button>
          </div>
          <div className="revision-status-bar">
            <span data-status={detail.item.status}>{STATUS_LABELS[detail.item.status]}</span>
            {detail.finalization ? <code>FINAL {detail.finalization.snapshotHash}</code> : null}
          </div>
          {editable ? (
            <form className="revision-edit-form" key={detail.item.id} onSubmit={saveRevision}>
              <RevisionFields artifacts={artifacts} calculationResults={calculationResults} initial={detail.item} />
              <button className="button button-dark" disabled={saving} type="submit">
                기본정보 저장
              </button>
            </form>
          ) : null}
          {transitions.length > 0 ? (
            <div className="transition-controls">
              <label>
                상태변경 메모
                <textarea
                  maxLength={4000}
                  onChange={(event) => setTransitionNote(event.target.value)}
                  value={transitionNote}
                />
              </label>
              <div>
                {transitions.map((item) => (
                  <button
                    className={
                      item.action === 'finalize' || item.action === 'approve'
                        ? 'button button-accent'
                        : 'button button-dark'
                    }
                    disabled={saving}
                    key={item.action}
                    onClick={() => void transition(item.action)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="review-section">
            <h4>검토 체크리스트</h4>
            {detail.reviews.length === 0 ? <p className="muted">검토항목이 없습니다.</p> : null}
            {detail.reviews.map((review) => (
              <article className="review-row" key={review.id}>
                <div>
                  <small>{AREA_LABELS[review.area]}</small>
                  <strong>{review.item}</strong>
                  <span data-result={review.result}>{RESULT_LABELS[review.result]}</span>
                  {review.comment ? <p>{review.comment}</p> : null}
                  {review.response ? <blockquote>{review.response}</blockquote> : null}
                </div>
                {detail.canReview && detail.item.status === 'under_review' ? (
                  <div className="review-action-box">
                    <textarea
                      aria-label={`${review.item} 검토 의견`}
                      maxLength={4000}
                      onChange={(event) =>
                        setReviewNotes((current) => ({ ...current, [review.id]: event.target.value }))
                      }
                      value={reviewNotes[review.id] ?? review.comment ?? ''}
                    />
                    <div>
                      {(['compliant', 'changes_required', 'not_applicable'] as const).map((result) => (
                        <button
                          className="button button-quiet"
                          disabled={saving}
                          key={result}
                          onClick={() => void decideReview(review.id, result)}
                          type="button"
                        >
                          {RESULT_LABELS[result]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {detail.canContribute && ['under_review', 'changes_requested'].includes(detail.item.status) ? (
                  <div className="review-action-box">
                    <textarea
                      aria-label={`${review.item} 보완 답변`}
                      maxLength={4000}
                      onChange={(event) => setResponses((current) => ({ ...current, [review.id]: event.target.value }))}
                      value={responses[review.id] ?? review.response ?? ''}
                    />
                    <button
                      className="button button-dark"
                      disabled={saving}
                      onClick={() => void respondReview(review.id)}
                      type="button"
                    >
                      답변 저장
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
            {detail.canReview && detail.item.status === 'under_review' ? (
              <form className="review-create-form" onSubmit={addReview}>
                <select aria-label="검토 분야" defaultValue="drawing" name="area">
                  {Object.entries(AREA_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input aria-label="검토 항목" maxLength={240} name="item" placeholder="검토 항목" required />
                <input aria-label="초기 검토 의견" maxLength={4000} name="comment" placeholder="검토 의견 · 선택" />
                <button className="button button-dark" disabled={saving} type="submit">
                  검토항목 추가
                </button>
              </form>
            ) : null}
          </div>
          <div className="revision-history">
            <h4>상태 이력</h4>
            {detail.events.map((event) => (
              <div key={event.id}>
                <strong>{STATUS_LABELS[event.toStatus]}</strong>
                <span>{new Date(event.createdAt).toLocaleString('ko-KR')}</span>
                {event.note ? <p>{event.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}

function RevisionFields({
  artifacts,
  calculationResults,
  initial,
}: {
  artifacts: ArtifactSummary[]
  calculationResults: Array<{ id: string; label: string }>
  initial?: Partial<DesignRevisionDetail['item']>
}) {
  return (
    <>
      <label>
        업무명
        <input defaultValue={initial?.title ?? ''} maxLength={160} name="title" required />
      </label>
      <label>
        변경사유
        <textarea defaultValue={initial?.reason ?? ''} maxLength={4000} name="reason" />
      </label>
      <label>
        법적·기술적 근거
        <textarea defaultValue={initial?.legalBasis ?? ''} maxLength={4000} name="legalBasis" />
      </label>
      <div className="form-grid two">
        <label>
          문서번호
          <input defaultValue={initial?.documentNumber ?? ''} maxLength={120} name="documentNumber" />
        </label>
        <label>
          공기 영향(일)
          <input defaultValue={initial?.scheduleImpactDays ?? ''} name="scheduleImpactDays" type="number" />
        </label>
      </div>
      <label>
        사업비 영향(원)
        <input defaultValue={initial?.costImpactAmount ?? ''} name="costImpactAmount" type="number" />
      </label>
      <div className="form-grid two">
        <LinkSelect
          label="당초 도면"
          name="baseDrawingArtifactId"
          initial={initial?.baseDrawingArtifactId}
          options={artifacts.map((artifact) => ({
            id: artifact.id,
            label: `${artifact.fileName} · ${artifact.revision}`,
          }))}
        />
        <LinkSelect
          label="변경 도면"
          name="newDrawingArtifactId"
          initial={initial?.newDrawingArtifactId}
          options={artifacts.map((artifact) => ({
            id: artifact.id,
            label: `${artifact.fileName} · ${artifact.revision}`,
          }))}
        />
        <LinkSelect
          label="당초 계산결과"
          name="baseCalculationResultId"
          initial={initial?.baseCalculationResultId}
          options={calculationResults}
        />
        <LinkSelect
          label="변경 계산결과"
          name="newCalculationResultId"
          initial={initial?.newCalculationResultId}
          options={calculationResults}
        />
      </div>
    </>
  )
}

function LinkSelect({
  label,
  name,
  initial,
  options,
}: {
  label: string
  name: string
  initial?: string | null
  options: Array<{ id: string; label: string }>
}) {
  return (
    <label>
      {label}
      <select defaultValue={initial ?? ''} name={name}>
        <option value="">연결 안 함</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
