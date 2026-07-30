import { randomToken } from '@sobok/edge/tokens'

// The two token concepts the comment board owns. `randomToken` itself is `@sobok/edge/tokens`' — every Worker
// mints capability handles the same way — and the sizes below are the security argument this app is making:
//   • editToken — 256-bit (43 chars): the sole capability handle a guest holds to edit/delete their own
//                 comment. Only its SHA-256 hash is stored (a DB leak must not grant edit rights).
//   • publicId  — 72-bit (12 chars): the client-facing opaque comment ref. Replaces the sequential bigint id
//                 in every response/URL so comments can't be enumerated or brigaded by id-walking.
export function newEditToken(): string {
  return randomToken(32)
}

export function newPublicId(): string {
  return randomToken(9)
}
