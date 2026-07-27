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

  // ── Plain vars (wrangler.jsonc `vars`, overridable by .dev.vars locally) ───────────────────────────
  // Comma-separated hostnames a Turnstile solve is accepted from. Production value is committed in
  // wrangler.jsonc; local dev narrows it to `localhost` for the dev widget.
  STELLA_ALLOWED_HOSTNAMES: string

  // ── Secrets Store bindings (async: `await X.get()`) ────────────────────────────────────────────────
  // Siteverify secret for stella's own Turnstile widget (account-turnstile workspace; cutover off the shared
  // "sobok" widget is written in Terraform but not applied yet).
  STELLA_TURNSTILE_SECRET: SecretsStoreSecret
  // Static HMAC key for pseudonymous IP hashing (rate-limit + report dedup). Never rotated (see lib/ip.ts).
  STELLA_IP_HASH_SALT: SecretsStoreSecret
  // Discord webhook for moderation/ops alerts. Empty value disables alerting.
  STELLA_DISCORD_WEBHOOK: SecretsStoreSecret
}

export type AppEnv = { Bindings: Bindings }
