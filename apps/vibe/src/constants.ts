import { Locale } from '@sobok/domain/locale'

export const ADSENSE_ACCOUNT = 'ca-pub-5167766222238626' // keep in sync with public/ads.txt
export const ORIGIN = 'https://vibe.sobok.cc'
// Shared across all four sobok sites; the container routes to the right GA4 property by Page Hostname.
// The app loads it itself (see GTMLoader) — Cloudflare's Google tag gateway proxies `/h8ou/*` but injects
// nothing, so this is the only loader on the page.
export const GTM_ID = 'GTM-MH37D28N'
// vibe's GA4 data stream. The app needs it solely to read the first-party `_ga_<stream>` session cookie when
// handing the server-side `purchase` event its session; all tag configuration lives in the container.
export const GA4_MEASUREMENT_ID = 'G-RHHX4JRYDS'
export const LEGAL_CONTACT_EMAIL = 'sobok2026@gmail.com'
export const THEME_COLOR = '#fdfaf6' // keep in sync with --page-bg in src/app/globals.css
export const TURNSTILE_SITE_KEY = requireEnv(
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
)

export const SITE_NAME = {
  [Locale.KO]: '결타레',
  [Locale.EN]: 'vibe',
  [Locale.JA]: 'vibe',
  [Locale.ZH]: 'vibe',
} satisfies Record<Locale, string>

// Public values, but REQUIRED at build time — no fallback. The sitekey used to be hardcoded, which pinned
// production's widget into the source: local development could not use a different widget, and a stale value
// fails silently (every solve rejected, indistinguishable from bot traffic) instead of loudly. Next inlines
// this at build, so a missing variable throws here and fails `next build`.
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}
