// Cloudflare Worker bindings for apps/vibe. Static assets are served via ASSETS; everything below is the
// deeptype paid backend. Everything is declared declaratively in sobok-ops (Cloudflare + Supabase,
// Terraform) — nothing is set imperatively:
//   - Hyperdrive configs → cloudflare_hyperdrive_config (ids pasted into wrangler.jsonc)
//   - true secrets → Cloudflare Secrets Store (cloudflare_secrets_store_secret), bound via
//     wrangler `secrets_store_secrets`; accessed at runtime with `await binding.get()`
//   - non-secret config (store id, channel keys, tier, model) → wrangler `vars`
import type { PayTier, PortOneChannel } from '@deep-type/pay-method'

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

  // ── Secrets Store bindings (async: `await X.get()`) ─────────────────────────────────────────────
  // Vibe-specific V2 API credential. It is issued independently from Stella's credential but remains
  // authorized at the shared Store boundary.
  DEEPTYPE_PORTONE_API_SECRET: SecretsStoreSecret
  // The representative Store has one Standard Webhooks signer per live/test mode. Wrangler binds the same
  // mode-specific account secret that Stella uses; only this Worker's binding name is product-local.
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
  // Shared representative PortOne Store. storeId/channelKey are public (sent to the browser SDK); Vibe owns
  // its purchase records and API credential, not a separate Store.
  DEEPTYPE_PORTONE_STORE_ID: string
  // Which PortOne 설정 모드 this deployment's channel keys belong to — 'live' for 실연동, 'test' for 테스트.
  // `@deep-type/pay-method` turns it into the menu, and the paywall's static bundle carries the same value as
  // NEXT_PUBLIC_DEEPTYPE_PAY_TIER so both halves narrow the catalogue identically. Never derived from the
  // hostname or a branch name: the tier is a fact about the contracts, and a value we could infer is a value
  // that can be inferred wrong on the money path.
  DEEPTYPE_PAY_TIER: PayTier
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
  //
  // `Partial` because a channel this deployment cannot charge on is ABSENT, never `""` and never a placeholder.
  // Absence is out-of-band and the compiler tracks it, so every read has to decide what to do about it; an
  // empty string satisfies `string` and would ride all the way into `requestPayment`, and a placeholder is
  // worse still — it is truthy, so no amount of falsy-checking catches it. The key set here must equal
  // `sellableChannels(DEEPTYPE_PAY_TIER)`; `GET /api/deep-type/config` reports the difference.
  DEEPTYPE_PORTONE_CHANNELS: Partial<Record<PortOneChannel, string>>
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
