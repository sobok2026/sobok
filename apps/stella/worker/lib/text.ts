// Comment body normalization. Bodies are stored as PLAIN TEXT and rendered as plain JSX text nodes (never
// dangerouslySetInnerHTML) — the store is inert, so the only job here is to strip disruptive characters, not
// to escape markup.
//
// Removes: C0/C1 control chars (except tab 0x09 / newline 0x0A), Unicode bidi/format overrides (LRM/RLM
// 0x200E/F, embeddings & overrides 0x202A-202E, isolates 0x2066-2069) that would let a comment reorder or
// hijack surrounding text, and it caps runs of combining marks (zalgo) that overflow the line box.

// Character classes are built from numeric code points so the source stays plain ASCII (no literal control
// chars, no unicode escapes).
function charClass(ranges: readonly (readonly [number, number])[]): RegExp {
  let body = ''
  for (const [lo, hi] of ranges) {
    body += lo === hi ? String.fromCharCode(lo) : `${String.fromCharCode(lo)}-${String.fromCharCode(hi)}`
  }
  return new RegExp(`[${body}]`, 'g')
}

const CONTROL = charClass([
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x9f],
])
const BIDI = charClass([
  [0x200e, 0x200f],
  [0x202a, 0x202e],
  [0x2066, 0x2069],
])
const ZALGO = /(\p{M}{4})\p{M}+/gu

export const MAX_BODY = 500
export const MAX_NICKNAME = 24

export function sanitizeBody(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL, '')
    .replace(BIDI, '')
    .replace(ZALGO, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function sanitizeNickname(raw: string | undefined | null): string | null {
  if (!raw) {
    return null
  }

  const cleaned = raw
    .normalize('NFC')
    .replace(CONTROL, '')
    .replace(BIDI, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NICKNAME)
  return cleaned.length > 0 ? cleaned : null
}
