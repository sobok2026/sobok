import type { ScopedPaymentsService } from '@sobok/payments'

// Cloudflare Worker bindings for apps/stella. Static assets are served via ASSETS; everything below powers
// the dynamic APIs, including the anonymous comment board and paid-card mutations. Declared
// declaratively in sobok-ops (infra/cloudflare account-stella +
// infra/supabase, Terraform):
//   - Hyperdrive config → cloudflare_hyperdrive_config over the SHARED Supabase Postgres, authenticating as
//     the least-privilege `stella_app` role (DML on only `stella` + `stella_stg` — no access to the deeptype
//     payment tables). Every statement remains schema-qualified by its deployment build constant.
//   - true secrets → Cloudflare Secrets Store, bound via wrangler `secrets_store_secrets`; read at runtime
//     with `await binding.get()`.
export interface Bindings {
  // Static Next export (./out), served for every non-/api path.
  ASSETS: Fetcher
  // Single Hyperdrive over the shared Supabase Postgres. Caching DISABLED: comments, paid entitlements,
  // collection ownership, and redraw counters all require fresh read-after-write state.
  HYPERDRIVE: Hyperdrive
  // PortOne API, Store/channel selection, and webhook verification live only in apps/payments. This named
  // entrypoint accepts Stella-prefixed payment ids and cannot operate on another app's order.
  PAYMENTS: ScopedPaymentsService

  // ── Plain vars (wrangler.jsonc `vars`, overridable by .dev.vars locally) ───────────────────────────
  // Comma-separated hostnames a Turnstile solve is accepted from. Production value is committed in
  // wrangler.jsonc; local dev narrows it to `localhost` for the dev widget.
  STELLA_ALLOWED_HOSTNAMES: string
  // Canonical origin used to build one-time email links; never inferred from an incoming Host header.
  STELLA_PUBLIC_ORIGIN: string
  STELLA_EMAIL_FROM: string
  STELLA_EMAIL_REPLY_TO: string
  // Central Sobok OIDC authority and this fixed first-party client identifier.
  STELLA_ACCOUNTS_ISSUER: string
  STELLA_OIDC_CLIENT_ID: string
  // ── Secrets Store bindings (async: `await X.get()`) ────────────────────────────────────────────────
  // Siteverify secret for stella's own Turnstile widget (account-turnstile workspace; cutover off the shared
  // "sobok" widget is written in Terraform but not applied yet).
  STELLA_TURNSTILE_SECRET: SecretsStoreSecret
  // Static HMAC key for pseudonymous IP hashing (rate-limit + report dedup). Never rotated (see lib/ip.ts).
  STELLA_IP_HASH_SALT: SecretsStoreSecret
  // Discord webhook for moderation/ops alerts. Empty value disables alerting.
  STELLA_DISCORD_WEBHOOK: SecretsStoreSecret
  // Transactional guardian-report delivery and re-open email API key.
  STELLA_RESEND_API_KEY: SecretsStoreSecret
  // Stella-local Better Auth session signing secret and central OIDC confidential-client secret.
  STELLA_AUTH_SECRET: SecretsStoreSecret
  STELLA_OIDC_CLIENT_SECRET: SecretsStoreSecret
}

export type AppEnv = { Bindings: Bindings }
