// Cloudflare Worker bindings for apps/stella. Static assets are served via ASSETS; everything below powers
// the dynamic APIs, including the anonymous comment board and paid-card mutations. Declared
// declaratively in sobok-ops (infra/cloudflare account-stella +
// infra/supabase, Terraform):
//   - Hyperdrive config → cloudflare_hyperdrive_config over the SHARED Supabase Postgres, authenticating as
//     the least-privilege `stella_app` role (DML on only `stella` + `stella_stg` — no access to the deeptype
//     payment tables). Every statement remains schema-qualified by its deployment build constant.
//   - true secrets → Cloudflare Secrets Store, bound via wrangler `secrets_store_secrets`; read at runtime
//     with `await binding.get()`.
export type StellaPortOneChannel = 'tosspay_v2' | 'tosspayments'

export interface Bindings {
  // Static Next export (./out), served for every non-/api path.
  ASSETS: Fetcher
  // Single Hyperdrive over the shared Supabase Postgres. Caching DISABLED: comments, paid entitlements,
  // collection ownership, and redraw counters all require fresh read-after-write state.
  HYPERDRIVE: Hyperdrive

  // ── Plain vars (wrangler.jsonc `vars`, overridable by .dev.vars locally) ───────────────────────────
  // Comma-separated hostnames a Turnstile solve is accepted from. Production value is committed in
  // wrangler.jsonc; local dev narrows it to `localhost` for the dev widget.
  STELLA_ALLOWED_HOSTNAMES: string
  // Public PortOne browser identifiers. The map is pinned per deployment so staging cannot select a live
  // channel and production cannot accidentally open a test channel.
  STELLA_PORTONE_STORE_ID: string
  STELLA_PORTONE_CHANNELS: Partial<Record<StellaPortOneChannel, string>>
  // Pinned origin used for PortOne noticeUrls. The representative Store is shared, so Stella payments must
  // override the Store-level default webhook endpoint instead of inheriting another product's URL.
  STELLA_PUBLIC_ORIGIN: string

  // ── Secrets Store bindings (async: `await X.get()`) ────────────────────────────────────────────────
  // Siteverify secret for stella's own Turnstile widget (account-turnstile workspace; cutover off the shared
  // "sobok" widget is written in Terraform but not applied yet).
  STELLA_TURNSTILE_SECRET: SecretsStoreSecret
  // Store-scoped V2 API secret. Browser-return confirm and signed webhooks both use it only to retrieve the
  // server-authoritative payment state from PortOne.
  STELLA_PORTONE_API_SECRET: SecretsStoreSecret
  // PortOne issues separate webhook secrets for live and test mode; wrangler binds the matching value per env.
  STELLA_PORTONE_WEBHOOK_SECRET: SecretsStoreSecret
  // Static HMAC key for pseudonymous IP hashing (rate-limit + report dedup). Never rotated (see lib/ip.ts).
  STELLA_IP_HASH_SALT: SecretsStoreSecret
  // Discord webhook for moderation/ops alerts. Empty value disables alerting.
  STELLA_DISCORD_WEBHOOK: SecretsStoreSecret
}

export type AppEnv = { Bindings: Bindings }
