// Cloudflare Worker bindings for apps/vibe. Static assets are served via ASSETS; everything below is the
// deeptype paid backend. Everything is declared declaratively in sobok-ops (Cloudflare + Supabase,
// Terraform) — nothing is set imperatively:
//   - Hyperdrive configs → cloudflare_hyperdrive_config (ids pasted into wrangler.jsonc)
//   - true secrets → Cloudflare Secrets Store (cloudflare_secrets_store_secret), bound via
//     wrangler `secrets_store_secrets`; accessed at runtime with `await binding.get()`
//   - non-secret config (store id, channel keys, kill-switch, model) → wrangler `vars`
import type { PortOneChannel } from '@deep-type/pay-method'

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
  // GA4 Measurement Protocol API secret for the vibe data stream. Paired with DEEPTYPE_GA4_MEASUREMENT_ID
  // below, which is the switch — this is only the credential.
  DEEPTYPE_GA4_API_SECRET: SecretsStoreSecret

  // ── Plain vars (not secret) ─────────────────────────────────────────────────────────────────────
  // Separate PortOne store (own settlement entity). storeId/channelKey are public (sent to the browser SDK).
  //
  DEEPTYPE_PORTONE_STORE_ID: string
  // Every PortOne channel key this deployment can spend, keyed by PG — PortOne's own pgProvider ids, not the
  // payment methods they carry. `tosspayments` is the same key whether it opens a card window or a 가상계좌
  // one, and it backs two methods already; `@deep-type/pay-method` owns which method rides which channel.
  //
  // ONE var holding a map rather than one var per channel, and wrangler binds JSON in `vars` as a parsed
  // object. Channels are added continuously, `vars` is non-inheritable, and one flat key per channel means a
  // growing pair of blocks that must be edited in lockstep — a map makes a new channel one line in each
  // environment and nothing here at all.
  //
  // These keys are also the ONLY thing that separates test from live: the store id and the API secret are
  // issued per store and shared across both modes. That is why they are `vars` pinned per wrangler
  // environment rather than anything resolvable at runtime — see the `env.stg` block in wrangler.jsonc.
  DEEPTYPE_PORTONE_CHANNELS: Record<PortOneChannel, string>
  DEEPTYPE_PUBLIC_ORIGIN: string
  DEEPTYPE_EMAIL_FROM: string
  DEEPTYPE_EMAIL_REPLY_TO: string
  // Pinned model override (defaults to claude-haiku-4-5-20251001 for reproducible report behavior).
  DEEPTYPE_REPORT_MODEL?: string
  // Narration killswitch. '0' ships reports with the rule-engine body alone; anything else (including an
  // absent var) leaves narration on. It no longer gates the report itself — the engine owns that.
  DEEPTYPE_LLM_ENABLED?: string
  // vibe's GA4 data stream — the destination of the server-side `purchase`. Public (it ships in the browser
  // too, via src/constants.ts); it is the paired API secret that is confidential.
  //
  // Empty string = this deployment does not report revenue, and `confirmPurchase` sends nothing. That is how
  // `vibe-stg` stays out of the production property: no destination, rather than a credential blanked out to
  // stand in for one.
  DEEPTYPE_GA4_MEASUREMENT_ID: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: {
    // The paid report access_token, set by requireAccessToken on entitlement routes (report/cancel/refinement).
    accessToken: string
  }
}
