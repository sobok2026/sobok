import type { Metadata } from 'next'
import ProjectDeliveriesPage from '@/components/project-pages/ProjectDeliveriesPage'

export const metadata: Metadata = {
  title: '전자납품 — Civil',
  description: '검증된 원본과 manifest로 구성한 전자납품 패키지를 관리합니다.',
}

export default function DeliveriesPage() {
  return <ProjectDeliveriesPage />
}
