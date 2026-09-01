'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { ProjectSummary } from '@/lib/api'

const panelLoading = () => <p className="muted workspace-loading">업무 화면을 불러오는 중입니다…</p>
const ArtifactWorkspace = dynamic(() => import('./ArtifactWorkspace'), { loading: panelLoading })
const AuditWorkspace = dynamic(() => import('./AuditWorkspace'), { loading: panelLoading })
const CalculationWorkspace = dynamic(() => import('./CalculationWorkspace'), { loading: panelLoading })
const DeliveryWorkspace = dynamic(() => import('./DeliveryWorkspace'), { loading: panelLoading })
const DesignCollaborationWorkspace = dynamic(() => import('./DesignCollaborationWorkspace'), {
  loading: panelLoading,
})

type WorkspaceTab = 'collaboration' | 'calculations' | 'artifacts' | 'deliveries' | 'audit'

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'collaboration', label: '설계협업' },
  { id: 'calculations', label: '계산·승인' },
  { id: 'artifacts', label: '도면·파일' },
  { id: 'deliveries', label: '전자납품' },
  { id: 'audit', label: '감사기록' },
]

export default function ProjectWorkspace({
  organizationId,
  project,
  onClose,
}: {
  organizationId: string
  project: ProjectSummary
  onClose: () => void
}) {
  const [tab, setTab] = useState<WorkspaceTab>('collaboration')

  return (
    <section className="project-workspace" aria-labelledby="project-workspace-title">
      <div className="project-workspace-heading">
        <div>
          <p className="eyebrow">PROJECT WORKSPACE · {project.code}</p>
          <h3 id="project-workspace-title">{project.name}</h3>
          <p>
            기준 좌표계 <code>{project.coordinateReferenceSystem}</code>
          </p>
        </div>
        <button className="button button-quiet" onClick={onClose} type="button">
          작업공간 닫기
        </button>
      </div>
      <div className="workspace-tabs" role="tablist" aria-label="프로젝트 업무">
        {TABS.map((item) => (
          <button
            aria-controls={`civil-${item.id}-tabpanel`}
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            id={`civil-${item.id}-tab`}
            key={item.id}
            onClick={() => setTab(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div aria-labelledby={`civil-${tab}-tab`} id={`civil-${tab}-tabpanel`} role="tabpanel">
        {tab === 'collaboration' ? (
          <DesignCollaborationWorkspace organizationId={organizationId} projectId={project.id} />
        ) : null}
        {tab === 'calculations' ? (
          <CalculationWorkspace
            coordinateReferenceSystem={project.coordinateReferenceSystem}
            organizationId={organizationId}
            projectId={project.id}
          />
        ) : null}
        {tab === 'artifacts' ? (
          <ArtifactWorkspace
            organizationId={organizationId}
            projectCoordinateReferenceSystem={project.coordinateReferenceSystem}
            projectId={project.id}
          />
        ) : null}
        {tab === 'deliveries' ? <DeliveryWorkspace organizationId={organizationId} projectId={project.id} /> : null}
        {tab === 'audit' ? <AuditWorkspace organizationId={organizationId} projectId={project.id} /> : null}
      </div>
    </section>
  )
}
