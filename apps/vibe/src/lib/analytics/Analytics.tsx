'use client'

import { GoogleTagManager } from '@next/third-parties/google'
import Script from 'next/script'
import { useEffect, useState } from 'react'

import { ADSENSE_ACCOUNT, GTM_ID, GTM_SCRIPT_URL } from '@/constants'

import { isAnalyticsEnabled } from './browser'

export default function Analytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(isAnalyticsEnabled())
  }, [])

  return (
    enabled && (
      <>
        <GoogleTagManager gtmId={GTM_ID} gtmScriptUrl={GTM_SCRIPT_URL} />
        <Script
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}`}
          strategy="afterInteractive"
        />
      </>
    )
  )
}
