// Cloudflare Worker bindings for apps/vibe. Static assets are served via ASSETS; everything below is the
// deeptype paid backend. Everything is declared declaratively in sobok-ops (Cloudflare + Supabase,
// Terraform) — nothing is set imperatively:
//   - Hyperdrive configs → cloudflare_hyperdrive_config (ids pasted into wrangler.jsonc)
//   - true secrets → Cloudflare Secrets Store (cloudflare_secrets_store_secret), bound via
//     wrangler `secrets_store_secrets`; accessed at runtime with `await binding.get()`
//   - non-secret config (store/channel id, kill-switch, model) → wrangler `vars` (plain strings)
export interface Bindings {
  // Static Next export (./out), served for every non-/api path via env.ASSETS.fetch(request).
  ASSETS: Fetcher
  // Two Hyperdrive configs over the SAME isolated Supabase Postgres (Seoul), differing only in caching:
  HYPERDRIVE_FRESH: Hyperdrive // caching disabled — money/entitlement path
  HYPERDRIVE_CACHED: Hyperdrive // caching enabled — done-report body read only

  // ── Secrets Store bindings (async: `await X.get()`) ─────────────────────────────────────────────
  DEEPTYPE_PORTONE_API_SECRET: SecretsStoreSecret
  DEEPTYPE_PORTONE_WEBHOOK_SECRET: SecretsStoreSecret
  DEEPTYPE_ANTHROPIC_API_KEY: SecretsStoreSecret
  // Transactional re-open email API key.
  DEEPTYPE_RESEND_API_KEY: SecretsStoreSecret
  DEEPTYPE_TURNSTILE_SECRET: SecretsStoreSecret
  // Discord webhook for money/ops alerts. Empty value disables alerting.
  DEEPTYPE_DISCORD_WEBHOOK: SecretsStoreSecret
  // GA4 Measurement Protocol API secret for the vibe data stream. Empty value disables the server-side
  // `purchase` event (the grant itself is unaffected).
  DEEPTYPE_GA4_API_SECRET: SecretsStoreSecret

  // ── Plain vars (not secret) ─────────────────────────────────────────────────────────────────────
  // Separate PortOne store (own settlement entity). storeId/channelKey are public (sent to the browser SDK).
  DEEPTYPE_PORTONE_STORE_ID: string
  DEEPTYPE_PORTONE_CHANNEL_KEY: string
  DEEPTYPE_PUBLIC_ORIGIN: string
  DEEPTYPE_EMAIL_FROM: string
  DEEPTYPE_EMAIL_REPLY_TO: string
  // Pinned model override (defaults to claude-haiku-4-5-20251001 for reproducible report behavior).
  DEEPTYPE_REPORT_MODEL?: string
  // vibe's GA4 data stream — the destination of the server-side `purchase`. Public (it ships in the browser
  // too, via src/constants.ts); it is the paired API secret that is confidential.
  DEEPTYPE_GA4_MEASUREMENT_ID: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: {
    // The paid report access_token, set by requireAccessToken on entitlement routes (report/cancel/refinement).
    accessToken: string
  }
}
