import type { Metadata } from 'next'
import ProjectCollaborationPage from '@/components/project-pages/ProjectCollaborationPage'

export const metadata: Metadata = {
  title: '설계협업 — Civil',
  description: '설계 revision의 제출, 검토, 보완, 승인과 확정 이력을 관리합니다.',
}

export default function CollaborationPage() {
  return <ProjectCollaborationPage />
}
