'use client'

import { useState } from 'react'
import type { ProjectSummary } from '@/lib/api'
import ArtifactWorkspace from './ArtifactWorkspace'
import DeliveryWorkspace from './DeliveryWorkspace'

export default function ProjectWorkspace({
  organizationId,
  project,
  onClose,
}: {
  organizationId: string
  project: ProjectSummary
  onClose: () => void
}) {
  const [tab, setTab] = useState<'artifacts' | 'deliveries'>('artifacts')

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
        <button
          aria-selected={tab === 'artifacts'}
          aria-controls="civil-artifact-tabpanel"
          className={tab === 'artifacts' ? 'active' : ''}
          id="civil-artifact-tab"
          onClick={() => setTab('artifacts')}
          role="tab"
          type="button"
        >
          도면·파일 보관
        </button>
        <button
          aria-selected={tab === 'deliveries'}
          aria-controls="civil-delivery-tabpanel"
          className={tab === 'deliveries' ? 'active' : ''}
          id="civil-delivery-tab"
          onClick={() => setTab('deliveries')}
          role="tab"
          type="button"
        >
          전자납품
        </button>
      </div>
      {tab === 'artifacts' ? (
        <div aria-labelledby="civil-artifact-tab" id="civil-artifact-tabpanel" role="tabpanel">
          <ArtifactWorkspace
            organizationId={organizationId}
            projectId={project.id}
            projectCoordinateReferenceSystem={project.coordinateReferenceSystem}
          />
        </div>
      ) : (
        <div aria-labelledby="civil-delivery-tab" id="civil-delivery-tabpanel" role="tabpanel">
          <DeliveryWorkspace organizationId={organizationId} projectId={project.id} />
        </div>
      )}
    </section>
  )
}
