import { bigint, boolean, index, integer, jsonb, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { identity } from './common'

const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()
const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())

export const user = identity.table(
  'user',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text(),
    createdAt,
    updatedAt,
    username: varchar({ length: 30 }),
    displayUsername: varchar('display_username', { length: 30 }),
    twoFactorEnabled: boolean('two_factor_enabled').default(false),
    isAdult: boolean('is_adult').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('uq_identity_user_email').on(table.email),
    uniqueIndex('uq_identity_username').on(table.username),
  ],
)

export const session = identity.table(
  'session',
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
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('uq_identity_session_token').on(table.token),
    index('idx_identity_session_user').on(table.userId),
  ],
)

export const account = identity.table(
  'account',
  {
    id: text().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
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
    index('idx_identity_account_user').on(table.userId),
    uniqueIndex('uq_identity_account_provider').on(table.providerId, table.accountId),
  ],
)

export const verification = identity.table(
  'verification',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index('idx_identity_verification_identifier').on(table.identifier)],
)

export const rateLimit = identity.table(
  'rate_limit',
  {
    id: text().primaryKey(),
    key: text().notNull(),
    count: integer().notNull(),
    lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('uq_identity_rate_limit_key').on(table.key),
    index('idx_identity_rate_limit_last_request').on(table.lastRequest),
  ],
)

export const passkey = identity.table(
  'passkey',
  {
    id: text().primaryKey(),
    name: text(),
    publicKey: text('public_key').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text('credential_id').notNull(),
    counter: integer().notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow(),
    aaguid: text(),
  },
  (table) => [
    index('idx_identity_passkey_user').on(table.userId),
    uniqueIndex('uq_identity_passkey_credential').on(table.credentialID),
  ],
)

export const twoFactor = identity.table(
  'two_factor',
  {
    id: text().primaryKey(),
    secret: text().notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    verified: boolean().default(true),
    failedVerificationCount: integer('failed_verification_count').default(0),
    lockedUntil: timestamp('locked_until', { precision: 3, withTimezone: true }),
  },
  (table) => [
    uniqueIndex('uq_identity_two_factor_user').on(table.userId),
    index('idx_identity_two_factor_secret').on(table.secret),
  ],
)

export const jwks = identity.table('jwks', {
  id: text().primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt,
  expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }),
})

export const oauthClient = identity.table(
  'oauth_client',
  {
    id: text().primaryKey(),
    clientId: text('client_id').notNull(),
    clientSecret: text('client_secret'),
    disabled: boolean().default(false),
    skipConsent: boolean('skip_consent'),
    enableEndSession: boolean('enable_end_session'),
    subjectType: text('subject_type'),
    scopes: text().array(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt,
    updatedAt,
    name: text(),
    uri: text(),
    icon: text(),
    contacts: text().array(),
    tos: text(),
    policy: text(),
    softwareId: text('software_id'),
    softwareVersion: text('software_version'),
    softwareStatement: text('software_statement'),
    redirectUris: text('redirect_uris').array().notNull(),
    postLogoutRedirectUris: text('post_logout_redirect_uris').array(),
    tokenEndpointAuthMethod: text('token_endpoint_auth_method'),
    grantTypes: text('grant_types').array(),
    responseTypes: text('response_types').array(),
    public: boolean(),
    type: text(),
    requirePKCE: boolean('require_pkce'),
    referenceId: text('reference_id'),
    metadata: jsonb().$type<Record<string, unknown>>(),
  },
  (table) => [
    uniqueIndex('uq_identity_oauth_client_id').on(table.clientId),
    index('idx_identity_oauth_client_user').on(table.userId),
  ],
)

export const oauthRefreshToken = identity.table(
  'oauth_refresh_token',
  {
    id: text().primaryKey(),
    token: text().notNull(),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => session.id, { onDelete: 'set null' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    createdAt,
    revoked: timestamp({ precision: 3, withTimezone: true }),
    authTime: timestamp('auth_time', { precision: 3, withTimezone: true }),
    scopes: text().array().notNull(),
  },
  (table) => [
    uniqueIndex('uq_identity_oauth_refresh_token').on(table.token),
    index('idx_identity_oauth_refresh_client').on(table.clientId),
    index('idx_identity_oauth_refresh_session').on(table.sessionId),
    index('idx_identity_oauth_refresh_user').on(table.userId),
  ],
)

export const oauthAccessToken = identity.table(
  'oauth_access_token',
  {
    id: text().primaryKey(),
    token: text().notNull(),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => session.id, { onDelete: 'set null' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    refreshId: text('refresh_id').references(() => oauthRefreshToken.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    createdAt,
    scopes: text().array().notNull(),
  },
  (table) => [
    uniqueIndex('uq_identity_oauth_access_token').on(table.token),
    index('idx_identity_oauth_access_client').on(table.clientId),
    index('idx_identity_oauth_access_session').on(table.sessionId),
    index('idx_identity_oauth_access_user').on(table.userId),
    index('idx_identity_oauth_access_refresh').on(table.refreshId),
  ],
)

export const oauthConsent = identity.table(
  'oauth_consent',
  {
    id: text().primaryKey(),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),
    scopes: text().array().notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('idx_identity_oauth_consent_client').on(table.clientId),
    index('idx_identity_oauth_consent_user').on(table.userId),
  ],
)
