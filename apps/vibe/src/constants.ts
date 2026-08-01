import { isPayTier, type PayTier } from '@deep-type/pay-method'
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
// Which PortOne 설정 모드 this build's paywall renders the menu for. The Worker holds the same value as
// `DEEPTYPE_PAY_TIER`; both are literals pinned to the deployment unit — the wrangler env block on the Worker
// side, each deploy job in `.github/workflows/vibe-deploy.yml` on this side. Never resolved from anything: the
// job that hardcodes `--env stg` is the same job that hardcodes `test`, so the pair cannot drift apart.
//
// Required with no default, and the default is the reason: `test` would put every unapproved method on the
// production paywall, and `live` would hide from staging the methods staging exists to QA. Neither is a safe
// guess, so a build that was not told fails here instead of picking one.
export const PAY_TIER = requirePayTier(process.env.NEXT_PUBLIC_DEEPTYPE_PAY_TIER)

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

// Narrowed and not merely present: a typo lands on the tier nobody meant, and on this variable that means the
// paywall's menu and `/checkout`'s answer disagree about what is for sale.
function requirePayTier(value: string | undefined): PayTier {
  const tier = requireEnv('NEXT_PUBLIC_DEEPTYPE_PAY_TIER', value)

  if (!isPayTier(tier)) {
    throw new Error(`Invalid NEXT_PUBLIC_DEEPTYPE_PAY_TIER: ${tier}`)
  }

  return tier
}
