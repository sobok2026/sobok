// The two token concepts deeptype owns. `randomToken` and `sha256Hex` are `@sobok/edge/tokens`' — every
// Worker mints capability handles the same way — and the named wrappers below are what this app means by them.

// A server-minted PortOne order id (≤ 64 chars). "dt_" prefix keeps deeptype orders distinguishable in
// the PortOne console from any other store traffic.
export function newPaymentId(): string {
  return `dt_${crypto.randomUUID()}`
}

// Lookup/dedup key input for a guest email. Never reversed; the plaintext lives only in the purchase row.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
