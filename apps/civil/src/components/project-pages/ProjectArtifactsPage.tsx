'use client'

import ArtifactWorkspace from '../ArtifactWorkspace'
import { useProjectWorkspace } from '../ProjectWorkspaceContext'

export default function ProjectArtifactsPage() {
  const { organization, project } = useProjectWorkspace()

  return (
    <ArtifactWorkspace
      organizationId={organization.id}
      projectCoordinateReferenceSystem={project.coordinateReferenceSystem}
      projectId={project.id}
    />
  )
}
