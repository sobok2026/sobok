// Turnstile `action` values, shared by the widgets that mint a token (the paywall and the re-open form) and
// the Worker that verifies it. They MUST stay identical: a mismatch rejects every real user, and siteverify
// gives the server no way to tell that apart from a bot, so the failure looks like traffic rather than a bug.
//
// One action per endpoint. Checkout creates a pending purchase against the buyer's email; re-open sends an
// access link by email. Different enough that a token minted for one must not be spendable on the other.
//
// This module is deliberately dependency-free so the Next build can import it from the Worker tree without
// pulling any Workers-only global into the client graph.
export const DEEPTYPE_CHECKOUT_ACTION = 'deeptype-checkout'
export const DEEPTYPE_REOPEN_ACTION = 'deeptype-reopen'
