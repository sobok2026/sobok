import { checkClaims } from './claims'
import type { ReportProfile } from './profile'
import { NARRATIVE_OUTPUT_SCHEMA, narrativeUserMessage, SYSTEM_NARRATIVE } from './prompt'
import type { NarrativeSection, ReportSection } from './section-data'
import { NARRATED_SECTION_KEYS, type NarratedSectionKey } from './section-keys'

// The narration pass. It runs after the engine sections are committed and delivering, so nothing here can fail
// the report: the worst outcome is a report that ships with the engine's own text alone (§4.3), which is what
// every deployment with no model id ships today and is a complete report rather than a degraded one.
//
// The two directions are not symmetric. The engine hands the model STRUCTURE and the model hands back PROSE,
// written under the section the structure was rendered into. It is never asked for structure of its own: the
// findings are the engine's, and a model that returned its own band or its own quest week would be re-deciding
// them.
//
// Acceptance is per section, not all-or-nothing. The old parser threw on `incomplete sections`, which meant one
// missing key discarded eleven good ones and, before the engine existed, failed the whole purchase.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MAX_ATTEMPTS = 3
const BACKOFF_MS = [500, 1500, 4000]
const MAX_OUTPUT_TOKENS = 8000
const TITLE_LIMIT = 60
const BODY_LIMIT = 1200

/** One regeneration, for the sections the first pass did not deliver. §4.3 caps it there. */
const MAX_REGENERATIONS = 1

export type NarrativeDropReason =
  /** Claimed evidence this section is not licensed to rest on, or that the matrix has withdrawn. */
  'claims' | 'duplicate' | 'empty' | 'unrequested'

export interface NarrativeDrop {
  key: string
  reason: NarrativeDropReason
}

export interface NarrativeOutcome {
  /** Kept for the failure log: an empty `sections` is only diagnosable next to what was thrown away. */
  dropped: readonly NarrativeDrop[]
  sections: readonly NarrativeSection[]
}

export interface NarrativeInput {
  /** The committed engine sections, structured. They are the ground truth the narration is written against. */
  engine: readonly ReportSection[]
  profile: ReportProfile
}

/**
 * Narration is requested only for sections the engine actually produced. Every narrated key is HYBRID now, so
 * this is the whole rule: `contextShift` is omitted for a reader who declared nothing, and narrating a section
 * the reader will never see is how a report ends up describing a contrast that is not on screen.
 */
export function requestedNarrativeKeys(engine: readonly ReportSection[]): readonly NarratedSectionKey[] {
  const written = new Set<string>(engine.map((section) => section.key))
  return NARRATED_SECTION_KEYS.filter((key) => written.has(key))
}

export async function generateNarrative(
  apiKey: string,
  model: string,
  input: NarrativeInput,
): Promise<NarrativeOutcome> {
  const requested = requestedNarrativeKeys(input.engine)
  const accepted = new Map<NarratedSectionKey, NarrativeSection>()
  const dropped: NarrativeDrop[] = []

  // A first-attempt transport failure is the caller's to record; there is nothing partial to keep yet.
  dropped.push(...acceptNarrative(await callModel(apiKey, model, input, requested), requested, accepted))

  for (let round = 0; round < MAX_REGENERATIONS; round++) {
    const missing = requested.filter((key) => !accepted.has(key))
    if (missing.length === 0) {
      break
    }
    try {
      dropped.push(...acceptNarrative(await callModel(apiKey, model, input, missing), missing, accepted))
    } catch (error) {
      // The retry is best-effort by construction. Losing what the first pass delivered to chase the rest is
      // the one outcome worse than a partial narration.
      console.error('deeptype.report.narrative-retry-failed', {
        message: error instanceof Error ? error.message : String(error),
      })
      break
    }
  }

  return {
    dropped,
    sections: requested.flatMap((key) => accepted.get(key) ?? []),
  }
}

/**
 * Total: violations become drops, never exceptions. `accepted` is carried across attempts, so a regeneration
 * merges into the first pass instead of replacing it, and a section already accepted cannot be overwritten by
 * a later, worse one.
 */
export function acceptNarrative(
  text: string,
  requested: readonly NarratedSectionKey[],
  accepted: Map<NarratedSectionKey, NarrativeSection>,
): readonly NarrativeDrop[] {
  const allowed = new Set<string>(requested)
  const dropped: NarrativeDrop[] = []

  for (const item of extractSections(text)) {
    const key = String(item?.key ?? '')
    if (!allowed.has(key)) {
      dropped.push({ key, reason: 'unrequested' })
      continue
    }

    const narratedKey = key as NarratedSectionKey
    if (accepted.has(narratedKey)) {
      dropped.push({ key, reason: 'duplicate' })
      continue
    }

    // An empty list has to drop, not pass. `checkClaims` reports violations among the claims it is given, so
    // claiming nothing produces no violations — the model could skip the declaration entirely and the gate
    // that exists to bound what a section may rest on would wave it through. Declaring the evidence is the
    // obligation; `minItems: 1` in the output schema asks for it and this rejects the answers that ignore it.
    const claims = Array.isArray(item?.claims) ? item.claims.map((claim) => String(claim)) : []
    if (claims.length === 0 || checkClaims(narratedKey, claims).length > 0) {
      dropped.push({ key, reason: 'claims' })
      continue
    }

    const body = clamp(item?.body, BODY_LIMIT)
    const title = clamp(item?.title, TITLE_LIMIT)
    if (body.length === 0 || title.length === 0) {
      dropped.push({ key, reason: 'empty' })
      continue
    }

    accepted.set(narratedKey, { body, key: narratedKey, title })
  }

  return dropped
}

// em-dash ban + the stored payload budget.
function clamp(value: unknown, limit: number): string {
  return String(value ?? '')
    .replace(/—/g, ',')
    .trim()
    .slice(0, limit)
}

type RawSection = { body?: unknown; claims?: unknown[]; key?: unknown; title?: unknown }

// Tolerant extraction: with structured outputs the text is already valid JSON, but slicing to the outer braces
// first keeps a stray prefix from breaking the parse. A response that carries no JSON at all yields no
// sections rather than an exception — the pass then finalizes as failed with the engine body untouched.
function extractSections(text: string): readonly RawSection[] {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) {
    return []
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { sections?: unknown }
    return Array.isArray(parsed.sections) ? (parsed.sections as RawSection[]) : []
  } catch {
    return []
  }
}

// Retries only 429/529 (rate limit / overload); every other failure throws so the caller finalizes the
// narrative pass as failed. The engine report is already delivering either way.
async function callModel(
  apiKey: string,
  model: string,
  input: NarrativeInput,
  keys: readonly NarratedSectionKey[],
): Promise<string> {
  const body = JSON.stringify({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_NARRATIVE,
    messages: [{ role: 'user', content: narrativeUserMessage(input.profile, input.engine, keys) }],
    output_config: { format: { type: 'json_schema', schema: NARRATIVE_OUTPUT_SCHEMA } },
  })

  let lastError = 'unknown'
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body,
    })

    if (response.ok) {
      const data = (await response.json()) as { content?: { text?: string }[]; stop_reason?: string }
      // A truncated or declined generation still returns 200. Truncation is not fatal here: whatever sections
      // completed before the cut are accepted and the rest come back on the regeneration.
      if (data.stop_reason === 'refusal') {
        throw new Error('anthropic refused the narration request')
      }
      return data.content?.[0]?.text ?? ''
    }

    // The response body carries the API's own explanation (bad key, unknown model, invalid schema).
    const detail = (await response.text().catch(() => '')).slice(0, 300)

    if (response.status === 429 || response.status === 529) {
      lastError = `anthropic ${response.status}: ${detail}`
      await sleep(BACKOFF_MS[attempt] ?? 4000)
      continue
    }

    throw new Error(`anthropic ${response.status}: ${detail}`)
  }

  throw new Error(lastError)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
