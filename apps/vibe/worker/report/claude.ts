import { REPORT_SECTION_KEYS, type ReportSection, type ReportSectionKey } from '../db/schema'
import type { ReportProfile } from './profile'
import { REPORT_OUTPUT_SCHEMA, SYSTEM_12_SECTIONS } from './prompt'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MAX_ATTEMPTS = 3
const BACKOFF_MS = [500, 1500, 4000]
const MIN_SECTIONS = 8
const KEY_SET = new Set<string>(REPORT_SECTION_KEYS)

// Generate the paid report via the Anthropic Messages API (raw fetch — no SDK on Workers). Structured
// outputs constrain the shape; we still validate + clamp defensively. Retries only 429/529 (overload);
// any other failure throws so the caller marks the report failed (retriable up to attempts<5).
export async function generateReport(apiKey: string, model: string, profile: ReportProfile): Promise<ReportSection[]> {
  const body = JSON.stringify({
    model,
    max_tokens: 4096,
    system: SYSTEM_12_SECTIONS,
    messages: [{ role: 'user', content: `측정 프로필:\n${JSON.stringify(profile)}` }],
    output_config: { format: { type: 'json_schema', schema: REPORT_OUTPUT_SCHEMA } },
  })

  let lastError = 'unknown'
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body,
    })

    if (response.ok) {
      const data = (await response.json()) as { content?: { text?: string }[] }
      const text = data.content?.[0]?.text ?? ''
      return parseSections(text)
    }

    // 429 rate-limit / 529 overloaded are the only retriable statuses.
    if (response.status === 429 || response.status === 529) {
      lastError = `anthropic ${response.status}`
      await sleep(BACKOFF_MS[attempt] ?? 4000)
      continue
    }

    throw new Error(`anthropic ${response.status}`)
  }
  throw new Error(lastError)
}

function parseSections(text: string): ReportSection[] {
  const parsed = extractJson(text)
  const raw = Array.isArray(parsed.sections) ? parsed.sections : []

  const byKey = new Map<ReportSectionKey, ReportSection>()
  for (const item of raw) {
    const key = String(item?.key ?? '')
    if (!KEY_SET.has(key) || byKey.has(key as ReportSectionKey)) {
      continue
    }
    byKey.set(key as ReportSectionKey, {
      key: key as ReportSectionKey,
      title: String(item?.title ?? '').slice(0, 60),
      // em-dash ban + hard length clamp to the stored payload budget.
      body: String(item?.body ?? '')
        .replace(/—/g, ',')
        .slice(0, 1200),
    })
  }

  // Emit in canonical order; drop any hallucinated/duplicate keys. Too few → treat as a failed generation.
  const sections = REPORT_SECTION_KEYS.map((key) => byKey.get(key)).filter((s): s is ReportSection => Boolean(s))
  if (sections.length < MIN_SECTIONS) {
    throw new Error(`too few sections: ${sections.length}`)
  }
  return sections
}

// Tolerant JSON extraction: with structured outputs the text is already valid JSON, but slice to the outer
// braces first so a stray prefix/suffix can't break the parse.
function extractJson(text: string): { sections?: { key?: unknown; title?: unknown; body?: unknown }[] } {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw new Error('no json in report response')
  }
  return JSON.parse(text.slice(start, end + 1))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
