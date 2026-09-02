'use client'

import DeliveryWorkspace from '../DeliveryWorkspace'
import { useProjectWorkspace } from '../ProjectWorkspaceContext'

export default function ProjectDeliveriesPage() {
  const { organization, project } = useProjectWorkspace()

  return <DeliveryWorkspace organizationId={organization.id} projectId={project.id} />
}
