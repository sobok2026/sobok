import type { MetadataRoute } from 'next'

import { buildManifest } from '@/lib/seo'

export const dynamic = 'force-static'

// The manifest is a single global file, so it uses the default-locale (ko) copy.
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest({
    name: '나의 자미두수 명반',
    description:
      '생년월일시로 나만의 자미두수 명반을 그려 보세요. 명궁과 14주성부터 사화와 대한 흐름까지 열두 궁 명반에서 한눈에 봐요.',
  })
}
