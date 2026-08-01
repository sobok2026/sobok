import { DEFAULT_LOCALE } from '@sobok/domain/locale'
import type { MetadataRoute } from 'next'

import { SITE_NAME } from '@/constants'
import { ko } from '@/i18n/messages/ko'
import { buildManifest } from '@/lib/seo'

export const dynamic = 'force-static'

// The manifest is a single global file, so it uses the default-locale (ko) copy.
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest({
    name: SITE_NAME[DEFAULT_LOCALE],
    description: ko.Constellation.meta.description,
    protocolHandlers: [{ protocol: 'web+stella', url: '/?protocol=web+stella&url=%s' }],
  })
}
