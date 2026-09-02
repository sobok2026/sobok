import { type ReactNode, Suspense } from 'react'
import ProjectWorkspaceLayout from '@/components/ProjectWorkspaceLayout'

export default function ProjectLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={<p className="muted workspace-route-loading">프로젝트를 확인하는 중입니다…</p>}>
      <ProjectWorkspaceLayout>{children}</ProjectWorkspaceLayout>
    </Suspense>
  )
}
