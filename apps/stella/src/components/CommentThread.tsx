'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { type InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { TURNSTILE_SITE_KEY } from '@/constants'
import {
  type Comment,
  CommentApiError,
  type CommentPage,
  fetchComments,
  forgetToken,
  getToken,
  MAX_BODY,
  type PostInput,
  postComment,
  type ReportReason,
  removeComment,
  reportComment,
  updateComment,
} from '@/lib/comments'
import { COMMENT_POST_ACTION, COMMENT_REPORT_ACTION } from '../../worker/api/comments/actions'

const REPORT_REASONS: ReportReason[] = ['spam', 'abuse', 'sexual', 'privacy', 'other']
const REASON_KEY = {
  spam: 'reasonSpam',
  abuse: 'reasonAbuse',
  sexual: 'reasonSexual',
  privacy: 'reasonPrivacy',
  other: 'reasonOther',
} as const

const EMPTY_IDS: ReadonlySet<string> = new Set()

type Translate = ReturnType<typeof useTranslations<'Comments'>>

function apiMessage(t: Translate, error: unknown): string {
  const slug = error instanceof CommentApiError ? error.slug : 'error'
  switch (slug) {
    case 'rate-limited':
      return t('rateLimited')
    case 'turnstile-failed':
      return t('turnstileFailed')
    case 'turnstile-expired':
      return t('turnstileExpired')
    case 'thread-locked':
      return t('locked')
    default:
      return t('error')
  }
}

// ── infinite-query cache updaters ────────────────────────────────────────────
// The board is paginated, so every mutation edits the cached pages in place. Rewriting a comment's object
// identity here is also what keeps the derived `mine` set correct: `select` recomputes from localStorage
// whenever these change the data.
type Board = InfiniteData<CommentPage, string | null>

function withNewComment(created: Comment) {
  return (old?: Board): Board | undefined => {
    if (!old) {
      return old
    }
    const [first, ...rest] = old.pages
    return { ...old, pages: [{ ...first, comments: [created, ...first.comments] }, ...rest] }
  }
}

function withEditedBody(publicId: string, body: string) {
  return (old?: Board): Board | undefined =>
    old && {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        comments: page.comments.map((c) => (c.publicId === publicId ? { ...c, body } : c)),
      })),
    }
}

function withoutComment(publicId: string) {
  return (old?: Board): Board | undefined =>
    old && {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        comments: page.comments.filter((c) => c.publicId !== publicId),
      })),
    }
}

interface CommentThreadProps {
  locale: string
  topicKey: string
  // First page baked into the static HTML at build (SEO snapshot + no first-paint flash). Seeds the query and
  // is treated as immediately stale so the client re-fetches live on mount.
  initial?: CommentPage
}

export default function CommentThread({ locale, topicKey, initial }: CommentThreadProps) {
  const t = useTranslations('Comments')
  const queryClient = useQueryClient()
  const queryKey = ['comments', locale, topicKey] as const

  const board = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchComments(locale, topicKey, pageParam),
    initialPageParam: '' as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: initial ? { pages: [initial], pageParams: [''] } : undefined,
    // 0 = the baked page is stale on arrival, so a live refetch runs on mount while the snapshot shows.
    initialDataUpdatedAt: initial ? 0 : undefined,
    // Flatten the pages and mark the comments this browser authored (it holds their editToken). Derived from
    // all loaded pages, so an author's own comment stays editable even after "load more" reveals it.
    select: (data) => {
      const comments = data.pages.flatMap((page) => page.comments)
      const mine = new Set(comments.filter((c) => getToken(c.publicId)).map((c) => c.publicId))
      return { comments, mine }
    },
  })
  const comments = board.data?.comments ?? []
  const mine = board.data?.mine ?? EMPTY_IDS

  const [body, setBody] = useState('')
  const [nickname, setNickname] = useState('')
  const [postToken, setPostToken] = useState('')
  const postWidget = useRef<TurnstileInstance>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')

  const post = useMutation({
    mutationFn: (input: PostInput) => postComment(input),
    onSuccess: (created) => {
      queryClient.setQueryData<Board>(queryKey, withNewComment(created))
      setBody('')
    },
    onError: (error) => toast.error(apiMessage(t, error)),
    onSettled: () => {
      setPostToken('')
      postWidget.current?.reset()
    },
  })

  const edit = useMutation({
    mutationFn: (vars: { publicId: string; token: string; body: string }) =>
      updateComment(vars.publicId, vars.token, vars.body),
    onSuccess: (_result, vars) => {
      queryClient.setQueryData<Board>(queryKey, withEditedBody(vars.publicId, vars.body))
      setEditingId(null)
    },
    onError: (error) => toast.error(apiMessage(t, error)),
  })

  const remove = useMutation({
    mutationFn: (vars: { publicId: string; token: string }) => removeComment(vars.publicId, vars.token),
    onSuccess: (_result, vars) => {
      forgetToken(vars.publicId)
      queryClient.setQueryData<Board>(queryKey, withoutComment(vars.publicId))
    },
    onError: (error) => toast.error(apiMessage(t, error)),
  })

  async function loadMore() {
    const result = await board.fetchNextPage()
    if (result.isError) {
      toast.error(apiMessage(t, result.error))
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || post.isPending) {
      return
    }
    if (!postToken) {
      toast.error(t('turnstileFailed'))
      return
    }
    post.mutate({
      locale,
      topic: topicKey,
      body: trimmed,
      nickname: nickname.trim() || undefined,
      turnstileToken: postToken,
    })
  }

  function saveEdit(publicId: string) {
    const token = getToken(publicId)
    const trimmed = editBody.trim()
    if (!token || !trimmed || edit.isPending) {
      return
    }
    edit.mutate({ publicId, token, body: trimmed })
  }

  function requestRemove(publicId: string) {
    const token = getToken(publicId)
    if (!token || !confirm(t('deleteConfirm'))) {
      return
    }
    remove.mutate({ publicId, token })
  }

  const showComposerWidget = body.trim().length > 0

  return (
    <div className="w-full">
      <form onSubmit={submit}>
        <input
          className="w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-foreground-faint"
          maxLength={24}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t('nicknamePlaceholder')}
          type="text"
          value={nickname}
        />
        <textarea
          className="mt-2 h-24 w-full resize-none rounded-lg border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-foreground-faint"
          maxLength={MAX_BODY}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('bodyPlaceholder')}
          value={body}
        />
        {showComposerWidget && (
          <div className="mt-2">
            <Turnstile
              onError={() => setPostToken('')}
              onExpire={() => setPostToken('')}
              onSuccess={setPostToken}
              options={{ action: COMMENT_POST_ACTION, size: 'flexible' }}
              ref={postWidget}
              siteKey={TURNSTILE_SITE_KEY}
            />
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-foreground-faint">
            {body.length}/{MAX_BODY}
          </span>
          <button
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-night-sky transition disabled:opacity-40"
            disabled={post.isPending || body.trim().length === 0}
            type="submit"
          >
            {post.isPending ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-4 border-t pt-5">
        {board.isPending ? (
          <p className="text-center text-xs text-foreground-subtle">{t('loading')}</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-xs text-foreground-subtle">{t('empty')}</p>
        ) : (
          comments.map((c) => (
            <article className="text-sm" key={c.publicId}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-foreground-secondary">{c.nickname ?? t('anonymous')}</span>
                <time className="text-[11px] text-foreground-faint" dateTime={c.createdAt}>
                  {new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(
                    new Date(c.createdAt),
                  )}
                </time>
              </div>
              {editingId === c.publicId ? (
                <div className="mt-1">
                  <textarea
                    className="h-16 w-full resize-none rounded-lg border bg-surface-2 px-3 py-2 text-sm text-foreground"
                    maxLength={MAX_BODY}
                    onChange={(e) => setEditBody(e.target.value)}
                    value={editBody}
                  />
                  <div className="mt-1 flex gap-2 text-xs">
                    <button className="font-semibold text-accent" onClick={() => saveEdit(c.publicId)} type="button">
                      {t('save')}
                    </button>
                    <button className="text-foreground-subtle" onClick={() => setEditingId(null)} type="button">
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-0.5 whitespace-pre-wrap break-words leading-relaxed text-foreground-secondary">
                    {c.body}
                  </p>
                  <div className="mt-1 flex gap-3 text-[11px] text-foreground-faint">
                    {mine.has(c.publicId) ? (
                      <>
                        <button
                          className="hover:text-foreground-subtle"
                          onClick={() => {
                            setEditingId(c.publicId)
                            setEditBody(c.body)
                          }}
                          type="button"
                        >
                          {t('edit')}
                        </button>
                        <button className="hover:text-danger" onClick={() => requestRemove(c.publicId)} type="button">
                          {t('delete')}
                        </button>
                      </>
                    ) : (
                      <ReportButton publicId={c.publicId} t={t} />
                    )}
                  </div>
                </>
              )}
            </article>
          ))
        )}

        {board.hasNextPage && (
          <button
            className="mx-auto block text-xs text-foreground-subtle underline-offset-2 hover:text-foreground-secondary hover:underline disabled:opacity-40"
            disabled={board.isFetchingNextPage}
            onClick={loadMore}
            type="button"
          >
            {board.isFetchingNextPage ? t('loading') : t('loadMore')}
          </button>
        )}
      </div>
    </div>
  )
}

function ReportButton({ publicId, t }: { publicId: string; t: Translate }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('spam')
  const [token, setToken] = useState('')
  const widget = useRef<TurnstileInstance>(null)

  const report = useMutation({
    mutationFn: () => reportComment(publicId, reason, token),
    onSuccess: () => {
      toast.success(t('reportDone'))
      setOpen(false)
    },
    onError: (error) => toast.error(apiMessage(t, error)),
    onSettled: () => {
      setToken('')
      widget.current?.reset()
    },
  })

  function send() {
    if (!token || report.isPending) {
      return
    }
    report.mutate()
  }

  if (!open) {
    return (
      <button className="hover:text-foreground-subtle" onClick={() => setOpen(true)} type="button">
        {t('report')}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <select
        className="rounded border bg-surface-2 px-2 py-1 text-xs text-foreground"
        onChange={(e) => setReason(e.target.value as ReportReason)}
        value={reason}
      >
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {t(REASON_KEY[r])}
          </option>
        ))}
      </select>
      <Turnstile
        onError={() => setToken('')}
        onExpire={() => setToken('')}
        onSuccess={setToken}
        options={{ action: COMMENT_REPORT_ACTION, size: 'flexible' }}
        ref={widget}
        siteKey={TURNSTILE_SITE_KEY}
      />
      <div className="flex gap-2">
        <button
          className="font-semibold text-danger disabled:opacity-40"
          disabled={!token || report.isPending}
          onClick={send}
          type="button"
        >
          {t('report')}
        </button>
        <button className="text-foreground-subtle" onClick={() => setOpen(false)} type="button">
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
