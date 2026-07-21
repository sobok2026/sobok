import type { ResultForReport } from '../db/queries/result'

// The sanitized JSON the LLM narrates. SECURITY: never include email, raw answers, or any percentile/rarity
// framing (표시광고법 + prompt-injection surface). Only the server-computed codes + strengths + a
// whitelist-free-but-server-authored profile snapshot (Phase 5 enriches `profile` with gem names/talents).
export interface ReportProfile {
  locale: 'ko' | 'en' | 'ja' | 'zh'
  persona: string | null
  inner: string | null
  gem: string | null
  selfClaim: string | null
  axisStrengths: Record<string, number> | null
  [key: string]: unknown
}

export function buildReportProfile(result: ResultForReport): ReportProfile {
  const base: ReportProfile = {
    locale: result.locale,
    persona: result.persona,
    inner: result.innerType,
    gem: result.gem,
    selfClaim: result.selfClaim,
    axisStrengths: result.axisStrengths,
  }
  // Phase 5 writes a server-computed enrichment (gem name, talents, gaps) onto result.profile. It's
  // server-authored (not client input), so it's safe to fold in. Locale/codes above stay authoritative.
  if (result.profile) {
    return { ...result.profile, ...base }
  }
  return base
}
