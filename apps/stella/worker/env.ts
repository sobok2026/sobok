import type { ScopedPaymentsService } from '@sobok/payments'

// Capability contract for Stella code hosted by the private, environment-level Database Worker.
export interface Bindings {
  HYPERDRIVE_FRESH: Hyperdrive
  STELLA_PAYMENTS: ScopedPaymentsService

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
  // Environment-specific HMAC key for pseudonymous IP hashing (auth, abuse limits, and report dedup).
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
