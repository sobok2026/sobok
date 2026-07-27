// Next inlines every NEXT_PUBLIC_* read below at build time. This module does NOT validate — apps/web's
// env.build.ts (createEnv, imported from next.config.ts) is the gate, and it makes the two credential-shaped
// entries required, so a build without them fails before anything ships.
//
// The `??` fallbacks are local-dev conveniences for values whose absence breaks loudly. They are deliberately
// absent for the Turnstile sitekey and the VAPID public key: their old fallbacks were Cloudflare's always-pass
// test sitekey and a keypair committed to this repository, so a missing variable produced a captcha that
// everyone passes and pushes signed with a published key — failures nobody would notice.
export const env = {
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? 'local',
  NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'http://localhost:3000',
  NEXT_PUBLIC_CHAT_WS_ORIGIN: process.env.NEXT_PUBLIC_CHAT_WS_ORIGIN ?? 'ws://localhost:3003',
  NEXT_PUBLIC_COMMIT_SHA: process.env.NEXT_PUBLIC_COMMIT_SHA ?? '',
  NEXT_PUBLIC_IMAGE_PROXY_ORIGIN: process.env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN ?? 'http://localhost:3002',
  NEXT_PUBLIC_FARO_URL: process.env.NEXT_PUBLIC_FARO_URL ?? '',
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID ?? '',
  NEXT_PUBLIC_IOS_TESTFLIGHT_URL: process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL ?? '',
  NEXT_PUBLIC_PROXY_MANGA_ORIGIN: process.env.NEXT_PUBLIC_PROXY_MANGA_ORIGIN ?? 'http://localhost:3001',
  NEXT_PUBLIC_PROXY_SEARCH_ORIGIN: process.env.NEXT_PUBLIC_PROXY_SEARCH_ORIGIN ?? 'http://localhost:3001',
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
} as const
