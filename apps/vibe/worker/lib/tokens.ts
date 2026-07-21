// 256-bit CSPRNG tokens, base64url (43 chars, fits varchar(43)). Used for result_token / access_token /
// report lock_token — unguessable, never enumerable, the sole capability handle for guest access.
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  let binary = ''
  for (const byte of buf) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// A server-minted PortOne order id (≤ 64 chars). "dt_" prefix keeps deeptype orders distinguishable in
// the PortOne console from any other store traffic.
export function newPaymentId(): string {
  return `dt_${crypto.randomUUID()}`
}

// Lookup/dedup key for a guest email. Never reversed; the plaintext lives only in the purchase row.
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
