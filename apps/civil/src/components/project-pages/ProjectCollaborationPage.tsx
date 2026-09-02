'use client'

import DesignCollaborationWorkspace from '../DesignCollaborationWorkspace'
import { useProjectWorkspace } from '../ProjectWorkspaceContext'

export default function ProjectCollaborationPage() {
  const { organization, project } = useProjectWorkspace()

  return <DesignCollaborationWorkspace organizationId={organization.id} projectId={project.id} />
}
