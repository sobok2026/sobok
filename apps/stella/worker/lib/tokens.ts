// CSPRNG tokens, base64url. Two sizes:
//   • editToken   — 256-bit (43 chars): the sole capability handle a guest holds to edit/delete their own
//                   comment. Only its SHA-256 hash is stored (a DB leak must not grant edit rights).
//   • publicId    — 72-bit (12 chars): the client-facing opaque comment ref. Replaces the sequential
//                   bigint id in every response/URL so comments can't be enumerated or brigaded by id-walking.
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  let binary = ''
  for (const byte of buf) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function newEditToken(): string {
  return randomToken(32)
}

export function newPublicId(): string {
  return randomToken(9)
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
