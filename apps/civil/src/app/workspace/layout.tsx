import type { ReactNode } from 'react'
import CivilHeader from '@/components/CivilHeader'
import WorkspaceSessionBoundary from '@/components/WorkspaceSessionBoundary'

export default function WorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="civil-shell">
      <CivilHeader workspace />
      <main className="workspace-main">
        <WorkspaceSessionBoundary>{children}</WorkspaceSessionBoundary>
      </main>
    </div>
  )
}
