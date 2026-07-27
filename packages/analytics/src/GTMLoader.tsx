'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

// The app owns the container loader. Cloudflare's Google tag gateway is enabled on the zone as a PROXY only
// (`setUpTag` off), so it serves `/h8ou/*` but injects nothing into the HTML — verified against the live
// zone. Nothing else on the page loads GTM, so removing this component silently kills all measurement.
//
// The gateway is a zone-wide setting and cannot be scoped per subdomain, which is exactly why ownership sits
// here instead: every app on sobok.cc loads its container the same way, and the "exactly one loader per page"
// check in each runbook stays decidable from the source alone.
const GATEWAY_PATH = '/h8ou/gtm.js'

// Development never has the gateway path (it is an edge route), so it loads the container straight from
// Google. That is what makes GTM Preview and Tag Assistant able to attach to a localhost page at all.
//
// Pointing development at the live container is safe only because the container's GA4 measurement-ID lookup
// is keyed on Page Hostname with NO default value: an unregistered origin resolves to an empty tag id and the
// Google tag has nowhere to send a hit. That is a container-side invariant — any tag added without a hostname
// condition breaks it, and GA4 data filters are retroactive-proof and permanent.
const DEV_SCRIPT_URL = 'https://www.googletagmanager.com/gtm.js'

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production'

type Props = {
  /** GTM container id, e.g. `GTM-MH37D28N`. */
  containerId: string
  /** Origin the production build is served from. The gateway path only exists there. */
  productionOrigin: string
}

export default function GTMLoader({ containerId, productionOrigin }: Props) {
  // A production build is also what `wrangler dev` and any preview deployment run, and `output: 'export'`
  // bakes one set of HTML for all of them — so the production origin can only be confirmed at runtime.
  const [allowed, setAllowed] = useState(IS_DEVELOPMENT)

  useEffect(() => {
    if (!IS_DEVELOPMENT) {
      setAllowed(window.location.origin === productionOrigin)
    }
  }, [productionOrigin])

  if (!allowed || !containerId) {
    return null
  }

  const scriptUrl = IS_DEVELOPMENT ? DEV_SCRIPT_URL : `${productionOrigin}${GATEWAY_PATH}`

  return (
    <>
      {/* `gtm.start` must be queued before gtm.js evaluates, hence two tags in DOM order rather than one
          script that does both — this is the shape Google's own snippet produces. */}
      <Script id="gtm-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'})`}
      </Script>
      <Script id="gtm-loader" src={`${scriptUrl}?id=${encodeURIComponent(containerId)}`} strategy="afterInteractive" />
    </>
  )
}
