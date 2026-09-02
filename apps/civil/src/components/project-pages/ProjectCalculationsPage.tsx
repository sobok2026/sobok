'use client'

import CalculationWorkspace from '../CalculationWorkspace'
import { useProjectWorkspace } from '../ProjectWorkspaceContext'

export default function ProjectCalculationsPage() {
  const { organization, project } = useProjectWorkspace()

  return (
    <CalculationWorkspace
      coordinateReferenceSystem={project.coordinateReferenceSystem}
      organizationId={organization.id}
      projectId={project.id}
    />
  )
}
