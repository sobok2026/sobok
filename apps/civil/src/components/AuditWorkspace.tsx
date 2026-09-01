'use client'

import { useCallback, useEffect, useState } from 'react'
import { type AuditEvent, listAuditEvents } from '@/lib/api'

function detailText(detail: Record<string, unknown>): string {
  const entries = Object.entries(detail)
  if (entries.length === 0) return '추가 정보 없음'
  return entries
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)}`,
    )
    .join(' · ')
}

export default function AuditWorkspace({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const reload = useCallback(async () => {
    const value = await listAuditEvents(organizationId, projectId)
    setEvents(value.items)
  }, [organizationId, projectId])

  useEffect(() => {
    let active = true
    setLoading(true)
    reload()
      .then(() => {
        if (active) setError(false)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reload])

  async function loadMore() {
    const before = events.at(-1)?.id
    if (!before) return
    setLoadingMore(true)
    try {
      const value = await listAuditEvents(organizationId, projectId, before)
      setEvents((current) => [...current, ...value.items])
    } catch {
      setError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section className="audit-panel" aria-labelledby="audit-title">
      <div className="artifact-heading">
        <div>
          <p className="eyebrow">APPEND-ONLY AUDIT TRAIL</p>
          <h4 id="audit-title">프로젝트 감사기록</h4>
        </div>
        <button className="button button-quiet" onClick={() => void reload()} type="button">
          새로 고침
        </button>
      </div>
      <p className="panel-description">
        설계·파일·계산·전자납품·권한 변경의 사용자, 시각, 대상과 해시 근거를 확인합니다.
      </p>
      {loading ? <p className="muted">감사기록을 불러오는 중입니다…</p> : null}
      {error ? <p className="error-text action-error">감사기록을 불러오지 못했습니다.</p> : null}
      {!loading ? (
        <div className="audit-list">
          {events.length === 0 ? <p className="muted">기록된 프로젝트 이벤트가 없습니다.</p> : null}
          {events.map((event) => (
            <article className="audit-row" key={event.id}>
              <div>
                <strong>{event.action}</strong>
                <span>
                  {event.actorType === 'system' ? '시스템' : event.actorName || event.actorEmail || event.actorUserId} ·{' '}
                  {new Date(event.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <code>
                {event.targetType} · {event.targetId}
              </code>
              <p>{detailText(event.detail)}</p>
              <small>request {event.requestId}</small>
            </article>
          ))}
          {events.length >= 50 ? (
            <button
              className="button button-quiet"
              disabled={loadingMore}
              onClick={() => void loadMore()}
              type="button"
            >
              {loadingMore ? '불러오는 중…' : '이전 기록 더 보기'}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
