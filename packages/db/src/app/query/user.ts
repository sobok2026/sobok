import { db } from '@sobok/db/app'
import { user } from '@sobok/db/app/auth'
import { eq } from 'drizzle-orm'

// better-auth username 플러그인은 username을 소문자로 정규화해 저장합니다.
export default async function selectUser({ username }: { username: string }) {
  return db
    .select({
      id: user.id,
      createdAt: user.createdAt,
      name: user.name,
      username: user.username,
      displayUsername: user.displayUsername,
      image: user.image,
    })
    .from(user)
    .where(eq(user.username, username.toLowerCase()))
}
