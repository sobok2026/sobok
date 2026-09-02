export type ProjectModule = 'collaboration' | 'calculations' | 'artifacts' | 'deliveries' | 'audit'

export const PROJECT_MODULES: ReadonlyArray<{ id: ProjectModule; label: string; path: string }> = [
  { id: 'collaboration', label: '설계협업', path: '/workspace/project/collaboration' },
  { id: 'calculations', label: '계산·승인', path: '/workspace/project/calculations' },
  { id: 'artifacts', label: '도면·파일', path: '/workspace/project/artifacts' },
  { id: 'deliveries', label: '전자납품', path: '/workspace/project/deliveries' },
  { id: 'audit', label: '감사기록', path: '/workspace/project/audit' },
]

function withQuery(path: string, values: Record<string, string>): string {
  return `${path}?${new URLSearchParams(values)}`
}

export function organizationWorkspaceHref(organizationId: string): string {
  return withQuery('/workspace/organization', { organizationId })
}

export function organizationAccessHref(organizationId: string): string {
  return withQuery('/workspace/organization/access', { organizationId })
}

export function projectModuleHref(
  organizationId: string,
  projectId: string,
  module: ProjectModule = 'collaboration',
): string {
  const route = PROJECT_MODULES.find((item) => item.id === module)
  if (!route) throw new Error(`Unknown Civil project module: ${module}`)
  return withQuery(route.path, { organizationId, projectId })
}
