import type { MetadataRoute } from 'next'

import { buildManifest } from '@/lib/seo'

export const dynamic = 'force-static'

// The manifest is a single global file, so it uses the default-locale (ko) copy.
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest({
    name: '결타레 - 커플 케미 테스트',
    description: '결지수 테스트와 대화 유형 테스트로 커플 케미를 확인해보세요.',
  })
}
