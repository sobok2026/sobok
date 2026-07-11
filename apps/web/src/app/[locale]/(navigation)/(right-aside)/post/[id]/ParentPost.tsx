import type { Post as TPost } from '@sobok/contracts'

import { formatDistanceToNow } from '@sobok/std'
import dayjs from 'dayjs'
import { getLocale, getTranslations } from 'next-intl/server'

import { getPostDetailHref } from '@/components/post/postHref'
import ReferredPostCard from '@/components/post/ReferredPostCard'
import Squircle from '@/components/ui/Squircle'
import { Link } from '@/i18n/navigation'

type Props = {
  post: TPost
}

export default async function ParentPost({ post }: Props) {
  const locale = await getLocale()
  const t = await getTranslations('Community')
  const author = post.author
  const referredPost = post.referredPost

  const avatar = (
    <Squircle className="w-10 shrink-0" src={author?.image}>
      {(author?.name ?? t('common.deletedUserShort')).slice(0, 2)}
    </Squircle>
  )

  return (
    <article className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 px-4 pt-3">
      <div className="flex flex-col items-center self-stretch">
        {author ? (
          <Link
            aria-label={t('common.profileAria', { nickname: author.name })}
            href={`/@${author.username ?? ''}`}
            prefetch={false}
          >
            {avatar}
          </Link>
        ) : (
          <div>{avatar}</div>
        )}
        <div aria-hidden className="mt-2 w-0.5 flex-1 rounded-full bg-surface-2" />
      </div>

      <div className="min-w-0 pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm leading-5">
          {author ? (
            <Link
              className="min-w-0 font-bold text-foreground transition hover:text-foreground"
              href={`/@${author.username ?? ''}`}
              prefetch={false}
            >
              <span className="break-all">{author.name}</span>
            </Link>
          ) : (
            <span className="font-bold text-foreground-subtle">{t('common.deletedUser')}</span>
          )}
          {author && <span className="min-w-0 break-all text-foreground-subtle">@{author.username}</span>}
          <span className="text-foreground-subtle">·</span>
          <span
            className="shrink-0 text-xs text-foreground-subtle"
            title={dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
          >
            {formatDistanceToNow(new Date(post.createdAt), locale)}
          </span>
        </div>

        <Link
          className="mt-1 block min-w-0 rounded-md outline-offset-4 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-2/70"
          href={getPostDetailHref(post.id)}
          prefetch={false}
        >
          <p className="min-w-0 whitespace-pre-wrap break-all text-[0.98rem] leading-relaxed text-foreground">
            {post.content || <span className="text-foreground-subtle">{t('common.deletedPost')}</span>}
          </p>
        </Link>

        {referredPost && (
          <div className="mt-2">
            <ReferredPostCard referredPost={referredPost} />
          </div>
        )}

        {post.mangaId && (
          <Link
            className="mt-2 inline-flex rounded-full border border-border-2 px-2.5 py-1 text-xs font-medium text-foreground-muted transition hover:border-border-strong hover:bg-surface hover:text-foreground"
            href={`/manga/${post.mangaId}`}
            prefetch={false}
          >
            {t('post.viewRelatedWork')}
          </Link>
        )}
      </div>
    </article>
  )
}
