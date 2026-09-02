'use client'

import { createContext, type ReactNode, useContext } from 'react'
import type { OrganizationSummary, ProjectSummary } from '@/lib/api'

export type ProjectRouteContext = {
  organization: OrganizationSummary
  project: ProjectSummary
}

const ProjectContext = createContext<ProjectRouteContext | null>(null)

export function ProjectWorkspaceProvider({ value, children }: { value: ProjectRouteContext; children: ReactNode }) {
  return <ProjectContext value={value}>{children}</ProjectContext>
}

export function useProjectWorkspace(): ProjectRouteContext {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('Project workspace must be rendered inside ProjectWorkspaceProvider')
  return context
}
