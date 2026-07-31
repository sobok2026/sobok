import { randomToken } from '@sobok/edge/tokens'

// Public refs are opaque but not authorization. The 256-bit collection token is the guest capability; only
// its SHA-256 digest is persisted, so a database read alone cannot open a paid collection.
export function newGuardianPublicId(): string {
  return randomToken(12)
}

export function newGuardianAccessToken(): string {
  return randomToken(32)
}
