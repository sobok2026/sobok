import type { Metadata } from 'next'
import ProjectAuditPage from '@/components/project-pages/ProjectAuditPage'

export const metadata: Metadata = {
  title: '감사기록 — Civil',
  description: '프로젝트 권한, 설계, 계산과 납품의 감사 이벤트를 조회합니다.',
}

export default function AuditPage() {
  return <ProjectAuditPage />
}
