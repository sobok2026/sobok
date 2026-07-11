'use client'

import { GoogleTagManager } from '@next/third-parties/google'
import { useEffect, useState } from 'react'

import { GTM_ID } from '@/constants'

import { isAnalyticsEnabled } from './browser'

export default function Analytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(isAnalyticsEnabled())
  }, [])

  return enabled && <GoogleTagManager gtmId={GTM_ID} />
}
