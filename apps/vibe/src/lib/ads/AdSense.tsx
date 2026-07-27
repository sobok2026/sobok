'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useState } from 'react'

import { ADSENSE_ACCOUNT, ORIGIN } from '@/constants'

const PRODUCTION_HOSTNAME = new URL(ORIGIN).hostname

// The paid-report paths stay ad-free. checkout-return is where a buyer waits for something they have just
// paid for and reopen is reached from a one-time email link; an ad unit there only invites a misclick on a
// page whose single job is delivering the purchase. Measurement is unaffected — the container loads
// everywhere, and only the ad library is withheld.
const AD_FREE_PATH = /\/deep-type\/(?:checkout-return|reopen)(?:\/|$)/

export default function AdSense() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // The hostname is only knowable at runtime: `output: 'export'` bakes one set of HTML for localhost, CI and
    // production alike, and AdSense must never be requested from a non-production origin.
    if (window.location.hostname === PRODUCTION_HOSTNAME && !AD_FREE_PATH.test(pathname)) {
      setEnabled(true)
    }
  }, [pathname])

  // One-way latch: a client-side navigation into an ad-free path cannot unload a library the browser has
  // already evaluated, and the real payment flow arrives on checkout-return as a fresh document anyway
  // (PortOne redirects with `forceRedirect`), where the effect above has never run.
  if (!enabled) {
    return null
  }

  return (
    <Script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ACCOUNT}`}
      strategy="afterInteractive"
    />
  )
}
