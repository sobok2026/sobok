'use client'

import AuditWorkspace from '../AuditWorkspace'
import { useProjectWorkspace } from '../ProjectWorkspaceContext'

export default function ProjectAuditPage() {
  const { organization, project } = useProjectWorkspace()

  return <AuditWorkspace organizationId={organization.id} projectId={project.id} />
}
