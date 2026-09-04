import { createdAt, identityId, publicId, timestamps } from '@sobok/edge/db/columns'
import { sql } from 'drizzle-orm'
import { bigint, check, index, integer, jsonb, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import {
  GUARDIAN_DAILY_BASES,
  GUARDIAN_DAILY_THEMES,
  GUARDIAN_DAILY_TONES,
  type GuardianDailyCardSnapshot,
} from '../../guardian/daily-contract'
import {
  GUARDIAN_CURRENCY,
  GUARDIAN_MARKET,
  GUARDIAN_PASS_DURATION_HOURS,
  GUARDIAN_PASS_PRICE,
  GUARDIAN_PASS_SKU,
} from '../../guardian/offer'
import { stellaUser } from './auth'
import { localeEnum, stella } from './common'

export const guardianPassPurchaseStatusEnum = stella.enum('guardian_pass_purchase_status', [
  'pending',
  'paid',
  'failed',
  'cancelled',
  'review_required',
  'refunded',
])
export const guardianDailyBasisEnum = stella.enum('guardian_daily_basis', GUARDIAN_DAILY_BASES)
export const guardianDailyThemeEnum = stella.enum('guardian_daily_theme', GUARDIAN_DAILY_THEMES)
export const guardianDailyToneEnum = stella.enum('guardian_daily_tone', GUARDIAN_DAILY_TONES)
export const guardianDailyRevealSourceEnum = stella.enum('guardian_daily_reveal_source', [
  'today_free',
  'tomorrow_pass',
])
export const guardianPassRecoveryEmailStatusEnum = stella.enum('guardian_pass_recovery_email_status', [
  'pending',
  'sending',
  'sent',
  'failed',
])
export const guardianPassReopenSourceEnum = stella.enum('guardian_pass_reopen_source', ['purchase', 'request'])

// One collection survives guest purchase, email recovery, and optional account claim. The seed is a digest of
// a browser-generated random id, so cards stay stable without storing birth data or a reusable browser secret.
export const guardianDailyCollectionTable = stella.table(
  'guardian_daily_collection',
  {
    id: identityId,
    publicId,
    accessTokenHash: varchar('access_token_hash', { length: 64 }).unique(),
    seedHash: varchar('seed_hash', { length: 64 }).notNull(),
    ownerUserId: text('owner_user_id').references(() => stellaUser.id, { onDelete: 'restrict' }),
    ...timestamps,
  },
  (table) => [index('idx_stella_guardian_daily_collection_owner').on(table.ownerUserId)],
)

// The pass never auto-renews. A paid row grants exactly 168 hours; renewal is another explicit purchase.
export const guardianPassPurchaseTable = stella.table(
  'guardian_pass_purchase',
  {
    id: identityId,
    paymentId: varchar('payment_id', { length: 64 }).notNull().unique(),
    checkoutRequestId: varchar('checkout_request_id', { length: 36 }).notNull(),
    collectionId: bigint('collection_id', { mode: 'number' })
      .notNull()
      .references(() => guardianDailyCollectionTable.id, { onDelete: 'restrict' }),
    locale: localeEnum().notNull(),
    timeZone: varchar('time_zone', { length: 64 }).notNull(),
    sku: varchar({ length: 64 }).$type<typeof GUARDIAN_PASS_SKU>().notNull(),
    orderName: varchar('order_name', { length: 128 }).notNull(),
    amount: bigint({ mode: 'number' }).notNull(),
    market: varchar({ length: 8 }).notNull(),
    currency: varchar({ length: 3 }).notNull(),
    recoveryEmail: varchar('recovery_email', { length: 254 }).notNull(),
    recoveryEmailNormalized: varchar('recovery_email_normalized', { length: 254 }).notNull(),
    termsVersion: varchar('terms_version', { length: 16 }).notNull(),
    privacyVersion: varchar('privacy_version', { length: 16 }).notNull(),
    refundVersion: varchar('refund_version', { length: 16 }).notNull(),
    consentedAt: timestamp('consented_at', { precision: 3, withTimezone: true }).notNull(),
    provider: varchar({ length: 32 }).notNull().default('portone'),
    method: varchar({ length: 32 }),
    providerTxnId: varchar('provider_txn_id', { length: 128 }),
    status: guardianPassPurchaseStatusEnum().notNull().default('pending'),
    failureCode: varchar('failure_code', { length: 64 }),
    failureMessage: varchar('failure_message', { length: 256 }),
    paidAt: timestamp('paid_at', { precision: 3, withTimezone: true }),
    refundedAt: timestamp('refunded_at', { precision: 3, withTimezone: true }),
    entitlementStartsAt: timestamp('entitlement_starts_at', { precision: 3, withTimezone: true }),
    entitlementExpiresAt: timestamp('entitlement_expires_at', { precision: 3, withTimezone: true }),
    firstUsedAt: timestamp('first_used_at', { precision: 3, withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('uq_stella_guardian_pass_checkout_request').on(table.collectionId, table.checkoutRequestId),
    uniqueIndex('uq_stella_guardian_pass_provider_txn').on(table.provider, table.providerTxnId),
    index('idx_stella_guardian_pass_collection').on(table.collectionId, table.createdAt),
    index('idx_stella_guardian_pass_recovery_email').on(table.recoveryEmailNormalized),
    index('idx_stella_guardian_pass_pending').on(table.updatedAt).where(sql`status = 'pending'`),
    index('idx_stella_guardian_pass_active')
      .on(table.collectionId, table.entitlementExpiresAt)
      .where(sql`status = 'paid'`),
    check('ck_stella_guardian_pass_amount', sql`${table.amount} = ${GUARDIAN_PASS_PRICE}`),
    check('ck_stella_guardian_pass_market', sql`${table.market} = ${GUARDIAN_MARKET}`),
    check('ck_stella_guardian_pass_currency', sql`${table.currency} = ${GUARDIAN_CURRENCY}`),
    check('ck_stella_guardian_pass_sku', sql`${table.sku} = ${GUARDIAN_PASS_SKU}`),
    check(
      'ck_stella_guardian_pass_entitlement_shape',
      sql`(${table.status} in ('paid', 'refunded')
            and ${table.paidAt} is not null
            and ${table.entitlementStartsAt} is not null
            and ${table.entitlementExpiresAt} is not null)
          or (${table.status} not in ('paid', 'refunded')
            and ${table.entitlementStartsAt} is null
            and ${table.entitlementExpiresAt} is null
            and ${table.firstUsedAt} is null)`,
    ),
    check(
      'ck_stella_guardian_pass_expiry_order',
      sql`${table.entitlementExpiresAt} is null or ${table.entitlementExpiresAt} > ${table.entitlementStartsAt}`,
    ),
    check(
      'ck_stella_guardian_pass_exact_duration',
      sql`${table.entitlementExpiresAt} is null or ${table.entitlementExpiresAt} = ${table.entitlementStartsAt} + ${GUARDIAN_PASS_DURATION_HOURS} * interval '1 hour'`,
    ),
    check(
      'ck_stella_guardian_pass_refund_shape',
      sql`(${table.status} = 'refunded' and ${table.refundedAt} is not null)
          or (${table.status} <> 'refunded' and ${table.refundedAt} is null)`,
    ),
  ],
)

// Only cards seen while a pass is active are archived on the server. Free viewers receive the same immutable
// shape but retain at most their current card in the browser.
export const guardianDailyCardTable = stella.table(
  'guardian_daily_card',
  {
    id: identityId,
    publicId,
    collectionId: bigint('collection_id', { mode: 'number' })
      .notNull()
      .references(() => guardianDailyCollectionTable.id, { onDelete: 'cascade' }),
    dateKey: varchar('date_key', { length: 10 }).notNull(),
    timeZone: varchar('time_zone', { length: 64 }).notNull(),
    basis: guardianDailyBasisEnum().notNull(),
    theme: guardianDailyThemeEnum().notNull(),
    tone: guardianDailyToneEnum().notNull(),
    source: guardianDailyRevealSourceEnum().notNull(),
    snapshot: jsonb().$type<GuardianDailyCardSnapshot>().notNull(),
    createdAt,
  },
  (table) => [
    uniqueIndex('uq_stella_guardian_daily_card_date').on(table.collectionId, table.dateKey),
    index('idx_stella_guardian_daily_card_collection').on(table.collectionId, table.dateKey),
    check('ck_stella_guardian_daily_card_date_key', sql`${table.dateKey} ~ '^\\d{4}-\\d{2}-\\d{2}$'`),
    check('ck_stella_guardian_daily_card_snapshot_date', sql`${table.snapshot}->>'dateKey' = ${table.dateKey}`),
    check('ck_stella_guardian_daily_card_snapshot_basis', sql`${table.snapshot}->>'basis' = ${table.basis}::text`),
    check('ck_stella_guardian_daily_card_snapshot_theme', sql`${table.snapshot}->>'theme' = ${table.theme}::text`),
    check('ck_stella_guardian_daily_card_snapshot_tone', sql`${table.snapshot}->>'tone' = ${table.tone}::text`),
  ],
)

export const guardianPassRecoveryEmailDeliveryTable = stella.table(
  'guardian_pass_recovery_email_delivery',
  {
    purchaseId: bigint('purchase_id', { mode: 'number' })
      .primaryKey()
      .references(() => guardianPassPurchaseTable.id, { onDelete: 'cascade' }),
    status: guardianPassRecoveryEmailStatusEnum().notNull().default('pending'),
    attempts: integer().notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    leaseExpiresAt: timestamp('lease_expires_at', { precision: 3, withTimezone: true }),
    sentAt: timestamp('sent_at', { precision: 3, withTimezone: true }),
    providerMessageId: varchar('provider_message_id', { length: 128 }),
    lastErrorCode: varchar('last_error_code', { length: 64 }),
    ...timestamps,
  },
  (table) => [
    index('idx_stella_guardian_pass_recovery_due').on(table.status, table.nextAttemptAt),
    check('ck_stella_guardian_pass_recovery_attempts', sql`${table.attempts} >= 0`),
  ],
)

export const guardianPassReopenAccessTable = stella.table(
  'guardian_pass_reopen_access',
  {
    id: identityId,
    purchaseId: bigint('purchase_id', { mode: 'number' })
      .notNull()
      .references(() => guardianPassPurchaseTable.id, { onDelete: 'cascade' }),
    source: guardianPassReopenSourceEnum().notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { precision: 3, withTimezone: true }),
    createdAt,
  },
  (table) => [
    index('idx_stella_guardian_pass_reopen_purchase').on(table.purchaseId, table.createdAt),
    index('idx_stella_guardian_pass_reopen_expires').on(table.expiresAt),
  ],
)
