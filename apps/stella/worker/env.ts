// Cloudflare Worker bindings for apps/stella. Static assets are served via ASSETS; everything below powers
// the anonymous comment board. Declared declaratively in sobok-ops (infra/cloudflare account-stella +
// infra/supabase, Terraform):
//   - Hyperdrive config → cloudflare_hyperdrive_config over the SHARED Supabase Postgres, authenticating as
//     the least-privilege `stella_app` role (SELECT/INSERT/UPDATE on the `stella` schema only — no access to
//     the deeptype payment tables).
//   - true secrets → Cloudflare Secrets Store, bound via wrangler `secrets_store_secrets`; read at runtime
//     with `await binding.get()`.
export interface Bindings {
  // Static Next export (./out), served for every non-/api path.
  ASSETS: Fetcher
  // Single Hyperdrive over the shared Supabase Postgres. Caching DISABLED (read-after-write board: a just-
  // posted comment must appear immediately).
  HYPERDRIVE: Hyperdrive

  // ── Secrets Store bindings (async: `await X.get()`) ────────────────────────────────────────────────
  // Turnstile siteverify secret (the shared "sobok" widget for now; a stella-dedicated widget is recommended).
  STELLA_TURNSTILE_SECRET: SecretsStoreSecret
  // Static HMAC key for pseudonymous IP hashing (rate-limit + report dedup). Never rotated (see lib/ip.ts).
  STELLA_IP_HASH_SALT: SecretsStoreSecret
  // Discord webhook for moderation/ops alerts. Empty value disables alerting.
  STELLA_DISCORD_WEBHOOK: SecretsStoreSecret
}

export type AppEnv = { Bindings: Bindings }
