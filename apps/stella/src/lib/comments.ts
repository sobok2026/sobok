// Browser client for the anonymous comment board. stella is a static export, so these are same-origin calls
// to the Worker's /api/comments/* routes (the Worker serves both the assets and the API). The author's
// edit/delete capability (editToken) is kept in localStorage, keyed by the comment's opaque publicId — it is
// never sent to render a comment, only as `Authorization: Bearer` on the author's own edit/delete.

import type { CommentReportReason as ReportReason } from '@sobok/domain/comment/policy'

// `locale` crosses this boundary as a plain string (the app's Locale enum widens to it) and is validated
// server-side against {ko,en,ja,zh}.

export interface Comment {
  publicId: string
  nickname: string | null
  body: string
  createdAt: string
}

export interface CommentPage {
  comments: Comment[]
  nextCursor: string | null
}

// Carries the RFC 9457 problem `title` slug so the UI can map it to a localized message.
export class CommentApiError extends Error {
  readonly slug: string
  readonly status: number

  constructor(slug: string, status: number) {
    super(slug)
    this.name = 'CommentApiError'
    this.slug = slug
    this.status = status
  }
}

const BASE = '/api/comments'

async function request(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(BASE + path, init)
  if (!res.ok) {
    let slug = 'error'
    try {
      const body = (await res.json()) as { title?: unknown }
      if (typeof body.title === 'string') {
        slug = body.title
      }
    } catch {
      /* non-JSON error body */
    }
    throw new CommentApiError(slug, res.status)
  }
  return res
}

export async function fetchComments(locale: string, topic: string, cursor?: string | null): Promise<CommentPage> {
  const params = new URLSearchParams({ locale, topic })
  if (cursor) {
    params.set('cursor', cursor)
  }
  const res = await request(`?${params.toString()}`, { method: 'GET' })
  return (await res.json()) as CommentPage
}

export async function fetchCounts(locale: string, topics: string[]): Promise<Record<string, number>> {
  const params = new URLSearchParams({ locale, topics: topics.join(',') })
  const res = await request(`/counts?${params.toString()}`, { method: 'GET' })
  const body = (await res.json()) as { counts: Record<string, number> }
  return body.counts
}

export interface PostInput {
  locale: string
  topic: string
  body: string
  nickname?: string
  turnstileToken: string
}

export async function postComment(input: PostInput): Promise<Comment> {
  const res = await request('', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body = (await res.json()) as { publicId: string; editToken: string; comment: Comment }
  rememberToken(body.publicId, body.editToken)
  return body.comment
}

export async function updateComment(publicId: string, editToken: string, body: string): Promise<void> {
  await request(`/${encodeURIComponent(publicId)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${editToken}` },
    body: JSON.stringify({ body }),
  })
}

export async function removeComment(publicId: string, editToken: string): Promise<void> {
  await request(`/${encodeURIComponent(publicId)}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${editToken}` },
  })
}

export async function reportComment(publicId: string, reason: ReportReason, turnstileToken: string): Promise<void> {
  await request(`/${encodeURIComponent(publicId)}/report`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason, turnstileToken }),
  })
}

// ── editToken storage (author's own comments on this browser) ───────────────────────────────────────────
const TOKENS_KEY = 'stella.comments.tokens'

function readTokens(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function writeTokens(tokens: Record<string, string>): void {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
  } catch {
    /* storage unavailable — edit/delete simply won't be offered on this device */
  }
}

export function rememberToken(publicId: string, token: string): void {
  const tokens = readTokens()
  tokens[publicId] = token
  writeTokens(tokens)
}

export function getToken(publicId: string): string | null {
  return readTokens()[publicId] ?? null
}

export function forgetToken(publicId: string): void {
  const tokens = readTokens()
  delete tokens[publicId]
  writeTokens(tokens)
}
