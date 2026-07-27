// Turnstile `action` values, shared by the widget that mints a token (src/components/CommentThread.tsx) and
// the Worker that verifies it. They MUST stay identical: a mismatch rejects every real user, and siteverify
// gives the server no way to tell that apart from a bot, so the failure looks like traffic rather than a bug.
//
// One action per endpoint, so a token solved on the report form cannot be spent on the post form.
// kebab-case throughout sobok; Cloudflare allows [A-Za-z0-9_-] up to 32 characters.
//
// This module is deliberately dependency-free so the Next build can import it from the Worker tree without
// pulling any Workers-only global into the client graph.
export const COMMENT_POST_ACTION = 'comment-post'
export const COMMENT_REPORT_ACTION = 'comment-report'
