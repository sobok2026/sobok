import { POST_FILTER } from '@sobok/domain/post/filter'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import PostList from './PostList'
import { type PostFilterParam, postFilterSchema } from './schema'

export const dynamicParams = false

export async function generateMetadata({ params }: PageProps<'/[locale]/posts/[filter]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.posts' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/posts/recommend',
    }),
  }
}

const filterParamsToPostFilter = {
  following: POST_FILTER.FOLLOWING,
  recommend: POST_FILTER.RECOMMEND,
} satisfies Record<PostFilterParam, typeof POST_FILTER.FOLLOWING | typeof POST_FILTER.RECOMMEND>

export function generateStaticParams() {
  return [{ filter: 'recommend' }, { filter: 'following' }]
}

export default async function Page({ params }: PageProps<'/[locale]/posts/[filter]'>) {
  const validation = postFilterSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { filter } = validation.data
  const postFilter = filterParamsToPostFilter[filter]

  return <PostList source={{ type: 'timeline', filter: postFilter }} />
}
