// CSPRNG tokens, base64url. The caller picks the size, because the size IS the security argument:
//   • 32 bytes (43 chars) — capability handles a guest holds as their only proof (edit tokens, access
//     tokens, lock tokens). Must be unguessable; only a hash of these is ever stored.
//   • 9 bytes (12 chars)  — client-facing opaque ids that replace sequential bigints in URLs and responses,
//     so rows can't be enumerated or brigaded by id-walking. Unguessability is not the goal; non-enumerability is.
// Named wrappers (newEditToken, newPublicId, newPaymentId, …) belong to the app that owns the concept.
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  let binary = ''
  for (const byte of buf) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Hex SHA-256. Used for at-rest hashes of capability tokens and for pseudonymous lookup/dedup keys
// (ip hashes, email hashes). Never reversed.
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
