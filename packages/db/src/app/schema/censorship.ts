import { bigint, index, pgTable, smallint, text, varchar } from 'drizzle-orm/pg-core'
import { createdAt } from '../../columns'

import { user } from './auth'

export const userCensorshipTable = pgTable.withRLS(
  'user_censorship',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    key: smallint().notNull(),
    value: varchar({ length: 256 }).notNull(),
    level: smallint().notNull(),
    createdAt,
  },
  (table) => [index('idx_user_censorship_user_id').on(table.userId)],
)
