// The brand-level facts every sobok site states about itself. Each one used to be re-declared per app —
// four copies of the GTM container id, four of the AdSense publisher id, three of the X handle — and the
// copies had already started to disagree: vibe carried LEGAL_CONTACT_EMAIL twice (src/constants.ts and
// src/content/legal.ts) with nothing keeping the two equal, and stella was the only site whose
// Organization JSON-LD claimed the X profile.
//
// What stays in an app's own `constants.ts` is what genuinely differs per deployment: its ORIGIN, its
// THEME_COLOR, its Turnstile sitekey. Anything that is true of "sobok" rather than of one site belongs here.

/** Apex origin of the brand. Every site is a subdomain of it; per-site origins live in each app. */
export const SOBOK_ORIGIN = 'https://sobok.cc'

/**
 * One GTM container for all sobok sites. The container routes a hit to the right GA4 property by looking
 * up Page Hostname, so a new site needs a container-side lookup entry rather than a container of its own —
 * which is why this is a brand constant and the GA4 measurement id (vibe's `GA4_MEASUREMENT_ID`) is not.
 */
export const GTM_ID = 'GTM-MH37D28N'

/**
 * AdSense publisher id, declared both as a `google-adsense-account` meta tag and in the ad library URL.
 * Every site also serves the matching line in `public/ads.txt`; that file is static and cannot import, so
 * it stays the one copy this constant does not own.
 */
export const ADSENSE_ACCOUNT = 'ca-pub-5167766222238626'

export const SOBOK_X_URL = 'https://x.com/sobok_cc'
export const SOBOK_X_HANDLE = '@sobok_cc'

/**
 * The mailbox published on the legal and contact pages. Keep it one that is actually monitored — users and
 * AdSense reviewers both write to it.
 */
export const LEGAL_CONTACT_EMAIL = 'sobok2026@gmail.com'
