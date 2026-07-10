import { db } from '@sobok/db/app'
import { user } from '@sobok/db/app/auth'
import { postTable } from '@sobok/db/app/post'
import { desc, eq } from 'drizzle-orm'

export type PostComment = {
  id: number
  createdAt: Date
  content: string | null
  author: {
    id: string
    name: string
    username: string | null
    image: string | null
  } | null
}

export interface SelectPostCommentOptions {
  limit?: number
}

export default async function selectPostComment(
  parentPostId: number,
  options: SelectPostCommentOptions = {},
): Promise<PostComment[]> {
  const { limit = 20 } = options

  const rows = await db
    .select({
      id: postTable.id,
      createdAt: postTable.createdAt,
      content: postTable.content,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorImage: user.image,
    })
    .from(postTable)
    .leftJoin(user, eq(postTable.userId, user.id))
    .where(eq(postTable.parentPostId, parentPostId))
    .orderBy(desc(postTable.createdAt), desc(postTable.id))
    .limit(limit)

  return rows
    .map(({ authorId: id, authorName: name, authorUsername: username, authorImage: image, ...comment }) => {
      const author = id !== null && name !== null ? { id, name, username, image } : null

      return { ...comment, author }
    })
    .toReversed()
}
