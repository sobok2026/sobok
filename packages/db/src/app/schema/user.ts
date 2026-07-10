import { DEFAULT_SEARCH_LANGUAGE, MAX_SEARCH_LANGUAGE_LENGTH } from '@sobok/domain/search/language'
import { sql } from 'drizzle-orm'
import { boolean, check, index, pgTable, primaryKey, smallint, text, varchar } from 'drizzle-orm/pg-core'

import { createdAt } from '../../columns'
// user 테이블은 better-auth가 소유하며 ./auth.ts에 CLI로 생성된다(`bun --filter=@sobok/auth generate`).
import { user } from './auth'

export const userSettingsTable = pgTable.withRLS('user_settings', {
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull()
    .primaryKey(),
  historySyncEnabled: boolean('history_sync_enabled').notNull().default(true),
  adultVerifiedAdVisible: boolean('adult_verified_ad_visible').notNull().default(false),
  defaultCensorshipEnabled: boolean('default_censorship_enabled').notNull().default(true),
  searchLanguage: varchar('search_language', { length: MAX_SEARCH_LANGUAGE_LENGTH })
    .notNull()
    .default(DEFAULT_SEARCH_LANGUAGE),
  autoDeletionDay: smallint('auto_deletion_day').notNull().default(90), // 0 = disabled
})

// 탈퇴 파기 outbox — 탈퇴 트랜잭션 안에서 이 행을 남기고, chat-worker가 폴링해 Chat DB
// (별도 클러스터, FK/cascade 불가)의 메시지·커서를 지운 뒤 행을 제거합니다. user로의
// FK를 걸면 유저 삭제와 함께 cascade로 사라지므로 의도적으로 참조하지 않습니다.
export const userErasureTable = pgTable.withRLS('user_erasure', {
  userId: text('user_id').primaryKey(),
  createdAt,
})

export const userFollowTable = pgTable.withRLS(
  'user_follow',
  {
    followerId: text('follower_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    followeeId: text('followee_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followeeId] }),
    index('idx_user_follow_followee_id').on(table.followeeId),
    check('user_follow_no_self_follow', sql`${table.followerId} <> ${table.followeeId}`),
  ],
)
