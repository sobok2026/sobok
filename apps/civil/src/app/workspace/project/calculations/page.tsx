import type { Metadata } from 'next'
import ProjectCalculationsPage from '@/components/project-pages/ProjectCalculationsPage'

export const metadata: Metadata = {
  title: '계산·승인 — Civil',
  description: '공식 토공 계산과 결과 승인 이력을 관리합니다.',
}

export default function CalculationsPage() {
  return <ProjectCalculationsPage />
}
