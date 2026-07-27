// Turnstile `action` binds a token to the flow it was solved for: siteverify echoes it back and the server
// rejects a mismatch, so a token minted on one form cannot be spent on another. The widget (sitekey+secret)
// separates APPS; `action` separates ENDPOINTS inside an app. Keep every action kebab-case — Cloudflare
// allows [A-Za-z0-9_-] up to 32 chars, and mixing casings is how these drift out of sync with the widgets.
//
// This registry is the single source of truth for the actions a Next client must send AND the server must
// expect. Changing a value is a client+server lockstep deploy.
//
// One action covers sign-up, both sign-in variants and password reset: better-auth's captcha plugin takes a
// single expectedAction for every endpoint it guards, so the auth widgets must all mint the same value.
export const TURNSTILE_AUTH_ACTION = 'auth'

export const TURNSTILE_POINTS_EARN_ACTION = 'points-earn'
