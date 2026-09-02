import type { Metadata } from 'next'
import ProjectArtifactsPage from '@/components/project-pages/ProjectArtifactsPage'

export const metadata: Metadata = {
  title: '도면·파일 — Civil',
  description: '프로젝트 원본 파일과 검증 상태 및 무결성 해시를 관리합니다.',
}

export default function ArtifactsPage() {
  return <ProjectArtifactsPage />
}
