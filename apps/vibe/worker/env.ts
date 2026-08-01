// Cloudflare Worker bindings for apps/vibe. Static assets are served via ASSETS; everything below is the
// deeptype paid backend. Everything is declared declaratively in sobok-ops (Cloudflare + Supabase,
// Terraform) — nothing is set imperatively:
//   - Hyperdrive configs → cloudflare_hyperdrive_config (ids pasted into wrangler.jsonc)
//   - true secrets → Cloudflare Secrets Store (cloudflare_secrets_store_secret), bound via
//     wrangler `secrets_store_secrets`; accessed at runtime with `await binding.get()`
//   - non-secret product config (tier, origin, model) → wrangler `vars`
import type { PayTier } from '@deep-type/pay-method'
import type { ScopedPaymentsService } from '@sobok/payments'

export interface Bindings {
  // Static Next export (./out), served for every non-/api path via env.ASSETS.fetch(request).
  ASSETS: Fetcher
  // Two Hyperdrive configs over the SAME isolated Supabase Postgres (Seoul), differing only in caching. Which
  // one a handler passes to `openDb` IS the caching decision — there is no fresh-vs-cached opener to pick, and
  // there was never a real one: the two used to be separate functions with identical bodies, so the name
  // promised a guarantee that only the argument ever provided.
  //
  // Caching DISABLED. Every write and every read-after-write on the money/entitlement path: checkout, verify,
  // webhook, the report CAS, viewed_at. Never serves a stale row.
  HYPERDRIVE_FRESH: Hyperdrive
  // Caching ENABLED, and usable for exactly one thing: the single read of an immutable done-report body. MUST
  // NOT back any status or entitlement read — the cache does not invalidate on writes, so it would hand a
  // refunded buyer their report back, or grant on a 'pending' that has since settled.
  HYPERDRIVE_CACHED: Hyperdrive
  // Named Cloudflare RPC entrypoint on apps/payments. It accepts only `dt_` payment ids; all PortOne
  // credentials, Store/channel configuration, and webhook verification remain outside Vibe.
  PAYMENTS: ScopedPaymentsService

  // ── Secrets Store bindings (async: `await X.get()`) ─────────────────────────────────────────────
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
  // Which PortOne 설정 모드 this deployment's channel keys belong to — 'live' for 실연동, 'test' for 테스트.
  // `@deep-type/pay-method` turns it into the menu, and the paywall's static bundle carries the same value as
  // NEXT_PUBLIC_DEEPTYPE_PAY_TIER so both halves narrow the catalogue identically. Never derived from the
  // hostname or a branch name: the tier is a fact about the contracts, and a value we could infer is a value
  // that can be inferred wrong on the money path.
  DEEPTYPE_PAY_TIER: PayTier
  DEEPTYPE_PUBLIC_ORIGIN: string
  DEEPTYPE_EMAIL_FROM: string
  DEEPTYPE_EMAIL_REPLY_TO: string
  // The narration pass's destination AND its switch, same shape as DEEPTYPE_GA4_MEASUREMENT_ID below: a
  // pinned model id turns narration on, "" (or an absent var) means the pass is skipped and the shared
  // Anthropic credential is never spent. No in-code default — the id would be a second copy free to drift
  // from the one wrangler pins. The report itself never depends on this; the engine owns the paid body.
  DEEPTYPE_REPORT_MODEL?: string
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
