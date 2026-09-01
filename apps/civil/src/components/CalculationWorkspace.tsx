'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { actOnCalculationApproval, type CalculationList, createEarthworkCalculation, listCalculations } from '@/lib/api'

const APPROVAL_LABELS = {
  draft: '초안',
  submitted: '승인 검토 중',
  changes_requested: '보완 요청',
  approved: '공식 승인',
  superseded: '대체됨',
} as const

function parseStation(value: string): number {
  const match = /^(\d+)\+(\d+(?:\.\d+)?)$/u.exec(value)
  return match ? Number(match[1]) * 1000 + Number(match[2]) : Number(value)
}

function parseSections(value: string) {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [station = '', cutArea = '', fillArea = ''] = line.split(/[\t, ]+/u)
      return { station: parseStation(station), cutArea: Number(cutArea), fillArea: Number(fillArea) }
    })
}

export default function CalculationWorkspace({
  organizationId,
  projectId,
  coordinateReferenceSystem,
}: {
  organizationId: string
  projectId: string
  coordinateReferenceSystem: string
}) {
  const [calculations, setCalculations] = useState<CalculationList | null>(null)
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setCalculations(await listCalculations(organizationId, projectId))
  }, [organizationId, projectId])

  useEffect(() => {
    void reload().catch(() => setError('계산 이력을 불러오지 못했습니다.'))
  }, [reload])

  const hasPending = calculations?.items.some((item) => ['queued', 'running'].includes(item.job.status)) ?? false
  useEffect(() => {
    if (!hasPending) return
    const interval = window.setInterval(() => void reload(), 3000)
    return () => window.clearInterval(interval)
  }, [hasPending, reload])

  async function submitCalculation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const sections = parseSections(String(form.get('sections') ?? ''))
    if (
      sections.length < 2 ||
      sections.some(
        (section, index) =>
          !Number.isFinite(section.station) ||
          !Number.isFinite(section.cutArea) ||
          !Number.isFinite(section.fillArea) ||
          section.station < 0 ||
          section.cutArea < 0 ||
          section.fillArea < 0 ||
          (index > 0 && section.station <= (sections[index - 1]?.station ?? -1)),
      )
    ) {
      setError('측점은 증가해야 하며 절토·성토 단면적은 0 이상의 숫자여야 합니다.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createEarthworkCalculation(organizationId, projectId, { coordinateReferenceSystem, sections })
      formElement.reset()
      await reload()
    } catch {
      setError('토공량 계산을 요청하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function approve(resultId: string, action: 'submit' | 'request_changes' | 'approve') {
    if (action !== 'submit' && !approvalNotes[resultId]?.trim()) {
      setError('보완 요청과 공식 승인에는 의견을 입력해주세요.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await actOnCalculationApproval(organizationId, projectId, resultId, {
        action,
        note: approvalNotes[resultId]?.trim() || null,
      })
      setApprovalNotes((current) => ({ ...current, [resultId]: '' }))
      await reload()
    } catch {
      setError('현재 승인 상태 또는 역할에서는 이 작업을 수행할 수 없습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="calculation-panel" aria-labelledby="calculation-title">
      <div className="artifact-heading">
        <div>
          <p className="eyebrow">SERVER-AUTHORITATIVE RESULT</p>
          <h4 id="calculation-title">토공량 계산·공식 승인</h4>
        </div>
        <button className="button button-quiet" onClick={() => void reload()} type="button">
          새로 고침
        </button>
      </div>
      <p className="panel-description">
        측점별 절토·성토 단면적을 양단면평균법으로 계산합니다. 입력·알고리즘·결과 해시와 승인 이력을 보존합니다.
      </p>
      {error ? <p className="error-text action-error">{error}</p> : null}
      <div className="calculation-layout">
        <div className="calculation-list">
          {!calculations ? <p className="muted">계산 이력을 불러오는 중입니다…</p> : null}
          {calculations?.items.length === 0 ? <p className="muted">계산 이력이 없습니다.</p> : null}
          {calculations?.items.map((item) => {
            const approvalStatus = item.approval?.status ?? null
            return (
              <article className="calculation-card" key={item.job.id}>
                <div className="calculation-card-head">
                  <div>
                    <small>{item.job.algorithmVersion}</small>
                    <h5>평균단면법 토공량</h5>
                    <p>{new Date(item.job.queuedAt).toLocaleString('ko-KR')}</p>
                  </div>
                  <span data-status={item.job.status}>{item.job.status}</span>
                </div>
                {item.result ? (
                  <>
                    <dl className="calculation-totals">
                      <div>
                        <dt>절토</dt>
                        <dd>{item.result.output.totals.cutVolume.toLocaleString()} m³</dd>
                      </div>
                      <div>
                        <dt>성토</dt>
                        <dd>{item.result.output.totals.fillVolume.toLocaleString()} m³</dd>
                      </div>
                      <div>
                        <dt>순토량</dt>
                        <dd>{item.result.output.totals.netVolume.toLocaleString()} m³</dd>
                      </div>
                    </dl>
                    <div className="calculation-evidence">
                      <code title={item.job.inputHash}>INPUT {item.job.inputHash.slice(0, 16)}…</code>
                      <code title={item.result.outputHash}>OUTPUT {item.result.outputHash.slice(0, 16)}…</code>
                    </div>
                    <div className="approval-box">
                      <strong>{approvalStatus ? APPROVAL_LABELS[approvalStatus] : '미제출'}</strong>
                      {item.approval?.note ? <p>{item.approval.note}</p> : null}
                      <textarea
                        aria-label="승인 의견"
                        maxLength={4000}
                        onChange={(event) =>
                          setApprovalNotes((current) => ({ ...current, [item.result?.id ?? '']: event.target.value }))
                        }
                        placeholder="검토·승인 의견"
                        value={approvalNotes[item.result.id] ?? ''}
                      />
                      <div>
                        {calculations.canCreate && (!approvalStatus || approvalStatus === 'changes_requested') ? (
                          <button
                            className="button button-dark"
                            disabled={saving}
                            onClick={() => void approve(item.result!.id, 'submit')}
                            type="button"
                          >
                            승인 제출
                          </button>
                        ) : null}
                        {calculations.canReview && approvalStatus === 'submitted' ? (
                          <button
                            className="button button-quiet"
                            disabled={saving}
                            onClick={() => void approve(item.result!.id, 'request_changes')}
                            type="button"
                          >
                            보완 요청
                          </button>
                        ) : null}
                        {calculations.canApprove && approvalStatus === 'submitted' ? (
                          <button
                            className="button button-accent"
                            disabled={saving}
                            onClick={() => void approve(item.result!.id, 'approve')}
                            type="button"
                          >
                            공식 승인
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className={item.job.status === 'failed' ? 'error-text' : 'muted'}>
                    {item.job.status === 'failed'
                      ? `계산 실패: ${item.job.failureCode ?? 'unknown'}`
                      : '계산 처리 중입니다.'}
                  </p>
                )}
              </article>
            )
          })}
        </div>
        {calculations?.canCreate ? (
          <form className="calculation-form" onSubmit={submitCalculation}>
            <h5>평균단면법 계산</h5>
            <p>
              한 줄에 <code>측점 절토면적 성토면적</code>을 입력합니다. 탭·쉼표·공백을 사용할 수 있습니다.
            </p>
            <label>
              좌표계
              <input disabled value={coordinateReferenceSystem} />
            </label>
            <label>
              횡단 성과
              <textarea
                name="sections"
                placeholder={'0+000\t0\t0\n0+020\t12.4\t0\n0+040\t28.7\t3.2'}
                required
                rows={12}
              />
            </label>
            <button className="button button-accent" disabled={saving} type="submit">
              서버 계산 요청
            </button>
          </form>
        ) : null}
      </div>
    </section>
  )
}
