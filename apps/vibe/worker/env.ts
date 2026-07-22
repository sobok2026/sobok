// Cloudflare Worker bindings for apps/vibe. Static assets are served via ASSETS; everything below is the
// deeptype paid backend. Everything is declared declaratively in sobok-ops (infra/cloudflare + infra/aiven,
// Terraform) — nothing is set imperatively:
//   - Hyperdrive configs → cloudflare_hyperdrive_config (ids pasted into wrangler.jsonc)
//   - true secrets → Cloudflare Secrets Store (cloudflare_secrets_store_secret), bound via
//     wrangler `secrets_store_secrets`; accessed at runtime with `await binding.get()`
//   - non-secret config (store/channel id, kill-switch, model) → wrangler `vars` (plain strings)
export interface Bindings {
  // Static Next export (./out), served for every non-/api path via env.ASSETS.fetch(request).
  ASSETS: Fetcher
  // Two Hyperdrive configs over the SAME isolated Aiven Postgres, differing only in caching:
  HYPERDRIVE_FRESH: Hyperdrive // caching disabled — money/entitlement path
  HYPERDRIVE_CACHED: Hyperdrive // caching enabled — done-report body read only

  // ── Secrets Store bindings (async: `await X.get()`) ─────────────────────────────────────────────
  DEEPTYPE_PORTONE_API_SECRET: SecretsStoreSecret
  DEEPTYPE_PORTONE_WEBHOOK_SECRET: SecretsStoreSecret
  DEEPTYPE_ANTHROPIC_API_KEY: SecretsStoreSecret
  // Shared "sobok" Turnstile widget secret (siteverify) — reused for the paid checkout.
  DEEPTYPE_TURNSTILE_SECRET: SecretsStoreSecret
  // Discord webhook for money/ops alerts. Empty value disables alerting.
  DEEPTYPE_DISCORD_WEBHOOK: SecretsStoreSecret

  // ── Plain vars (not secret) ─────────────────────────────────────────────────────────────────────
  // Separate PortOne store (own settlement entity). storeId/channelKey are public (sent to the browser SDK).
  DEEPTYPE_PORTONE_STORE_ID: string
  DEEPTYPE_PORTONE_CHANNEL_KEY: string
  // Kill-switch for LLM report generation ('1' to enable); guards the Anthropic budget.
  DEEPTYPE_LLM_ENABLED?: string
  // Report model override (defaults to claude-haiku-4-5 — the cost-driven product choice, ~28 KRW/report).
  DEEPTYPE_REPORT_MODEL?: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: {
    // The paid report access_token, set by requireAccessToken on entitlement routes (report/cancel/precision).
    accessToken: string
  }
}
