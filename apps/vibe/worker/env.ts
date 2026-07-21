// Cloudflare Worker bindings for apps/vibe. Static assets are served via ASSETS; everything below is the
// deeptype paid backend. Secrets are set with `wrangler secret put` (never committed); Hyperdrive ids and
// the assets binding live in wrangler.jsonc.
export interface Bindings {
  // Static Next export (./out), served for every non-/api path via env.ASSETS.fetch(request).
  ASSETS: Fetcher
  // Two Hyperdrive configs over the SAME isolated Aiven Postgres, differing only in caching:
  HYPERDRIVE_FRESH: Hyperdrive // caching disabled — money/entitlement path
  HYPERDRIVE_CACHED: Hyperdrive // caching enabled — done-report body read only
  // Separate PortOne store (own settlement entity), distinct from the sobok chat-subscription store.
  DEEPTYPE_PORTONE_STORE_ID: string
  DEEPTYPE_PORTONE_CHANNEL_KEY: string
  DEEPTYPE_PORTONE_API_SECRET: string
  DEEPTYPE_PORTONE_WEBHOOK_SECRET: string
  DEEPTYPE_ANTHROPIC_API_KEY: string
  // Report model override (defaults to claude-haiku-4-5 — the cost-driven product choice, ~28 KRW/report).
  DEEPTYPE_REPORT_MODEL?: string
  // Kill-switch for LLM report generation ('1' to enable); guards the Anthropic budget.
  DEEPTYPE_LLM_ENABLED?: string
  // Cloudflare Turnstile secret for the checkout submit (anti-abuse on the paid path).
  DEEPTYPE_TURNSTILE_SECRET?: string
}

export type AppEnv = { Bindings: Bindings }
