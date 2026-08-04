import { boolean, index, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { identity } from './common'

export const bbatonVerification = identity.table(
  'bbaton_verification',
  {
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .primaryKey(),
    bbatonUserId: varchar('bbaton_user_id', { length: 128 }).notNull(),
    adultFlag: boolean('adult_flag').notNull(),
    verifiedAt: timestamp('verified_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_identity_bbaton_user').on(table.bbatonUserId),
    index('idx_identity_bbaton_verified').on(table.verifiedAt),
  ],
)
