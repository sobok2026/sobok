import { isPayProfile, type PayProfile } from '@deep-type/pay-method'
import { SOBOK_SERVICES } from '@sobok/brand/services'

export const ORIGIN = 'https://vibe.sobok.cc'
// vibe's GA4 data stream. The app needs it solely to read the first-party `_ga_<stream>` session cookie when
// handing the server-side `purchase` event its session; all tag configuration lives in the container. The
// GTM container id itself is brand-wide and lives in `@sobok/brand/identity`.
export const GA4_MEASUREMENT_ID = 'G-RHHX4JRYDS'
export const THEME_COLOR = '#fdfaf6' // keep in sync with --background in src/app/globals.css
export const TURNSTILE_SITE_KEY = requireEnv(
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
)
// Which deployment menu this build's paywall renders. The Worker holds the same value as
// `DEEPTYPE_PAY_PROFILE`; both are literals pinned to the deployment unit — the wrangler env block on the
// Worker side and the explicit GitHub Actions build environment on this side.
//
// Required with no default: `staging` would put every test method on the production paywall, while
// `production` would hide from staging the methods staging exists to QA. Neither is a safe guess, so a build
// that was not told fails here instead of picking one.
export const PAY_PROFILE = requirePayProfile(process.env.NEXT_PUBLIC_DEEPTYPE_PAY_PROFILE)

// Read from the shared catalogue rather than written again here: the same four strings are what every
// sibling site's footer links to this one by.
export const SITE_NAME = SOBOK_SERVICES.vibe.name

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

// Narrowed and not merely present: a typo lands on the profile nobody meant, and on this variable that means the
// paywall's menu and `/checkout`'s answer disagree about what is for sale.
function requirePayProfile(value: string | undefined): PayProfile {
  const profile = requireEnv('NEXT_PUBLIC_DEEPTYPE_PAY_PROFILE', value)

  if (!isPayProfile(profile)) {
    throw new Error(`Invalid NEXT_PUBLIC_DEEPTYPE_PAY_PROFILE: ${profile}`)
  }

  return profile
}
