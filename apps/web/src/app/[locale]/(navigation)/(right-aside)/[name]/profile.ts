import { db } from '@sobok/db/app'
import { user } from '@sobok/db/app/auth'
import { userFollowTable } from '@sobok/db/app/user'
import { eq } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

export type PublicUserProfile = {
  id: string
  name: string
  createdAt: string
  username: string | null
  image: string | null
  followingCount: number
  followerCount: number
}

// TODO: cache component 도입하기
const getCachedPublicUserProfile = unstable_cache(
  async (username: string): Promise<PublicUserProfile | null> => {
    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        username: user.username,
        image: user.image,
        followingCount: db.$count(userFollowTable, eq(userFollowTable.followerId, user.id)),
        followerCount: db.$count(userFollowTable, eq(userFollowTable.followeeId, user.id)),
      })
      .from(user)
      // better-auth username 플러그인은 username을 소문자로 정규화해 저장한다.
      .where(eq(user.username, username.toLowerCase()))

    return row ? { ...row, createdAt: row.createdAt.toISOString() } : null
  },
  ['public-user-profile'],
  { revalidate: 60 },
)

export const getPublicUserProfile = cache(getCachedPublicUserProfile)
