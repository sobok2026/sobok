import { bigint, boolean, index, integer, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { stella } from './common'

const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()
const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

// Local relying-party identity. The authority remains accounts.sobok.cc; Stella stores only the stable
// `(issuer, subject)` mapping and its own host-only session.
export const stellaUser = stella.table(
  'auth_user',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text(),
    createdAt,
    updatedAt,
    issuer: text().notNull(),
    subject: text().notNull(),
  },
  (table) => [
    uniqueIndex('uq_stella_auth_user_email').on(table.email),
    uniqueIndex('uq_stella_auth_user_subject').on(table.issuer, table.subject),
  ],
)

export const stellaSession = stella.table(
  'auth_session',
  {
    id: text().primaryKey(),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    token: text().notNull(),
    createdAt,
    updatedAt,
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => stellaUser.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('uq_stella_auth_session_token').on(table.token),
    index('idx_stella_auth_session_user').on(table.userId),
  ],
)

export const stellaAccount = stella.table(
  'auth_account',
  {
    id: text().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => stellaUser.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { precision: 3, withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { precision: 3, withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('idx_stella_auth_account_user').on(table.userId),
    uniqueIndex('uq_stella_auth_account_provider').on(table.providerId, table.accountId),
  ],
)

export const stellaVerification = stella.table(
  'auth_verification',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index('idx_stella_auth_verification_identifier').on(table.identifier)],
)

export const stellaAuthRateLimit = stella.table(
  'auth_rate_limit',
  {
    id: text().primaryKey(),
    key: text().notNull(),
    count: integer().notNull(),
    lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('uq_stella_auth_rate_limit_key').on(table.key),
    index('idx_stella_auth_rate_limit_last_request').on(table.lastRequest),
  ],
)
