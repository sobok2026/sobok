import type { db } from '@sobok/db/app'
import { user } from '@sobok/db/app/auth'
import { eq } from 'drizzle-orm'

export type UserRowLockTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function lockUserRowForUpdate(tx: UserRowLockTx, userId: string) {
  await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for('update')
}
