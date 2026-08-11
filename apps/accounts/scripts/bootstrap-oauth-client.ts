import { hashSobokOAuthClientSecret, SOBOK_OAUTH_CLIENT_SECRET_PREFIX } from '@sobok/auth/oauth-client-secret'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { oauthClient } from '../worker/db/schema'

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function commaSeparated(name: string): string[] {
  const values = required(name)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (values.length === 0) throw new Error(`${name} must contain at least one value`)
  return values
}

function sameValues(left: string[] | null, right: string[]): boolean {
  return JSON.stringify([...(left ?? [])].sort()) === JSON.stringify([...right].sort())
}

const databaseUrl = required('SOBOK_MIGRATOR_URL')
const parsedDatabaseUrl = new URL(databaseUrl)
if (parsedDatabaseUrl.searchParams.get('sslmode') !== 'verify-full') {
  throw new Error('SOBOK_MIGRATOR_URL must use sslmode=verify-full')
}
if (decodeURIComponent(parsedDatabaseUrl.username).split('.')[0] !== 'accounts_migrator') {
  throw new Error('SOBOK_MIGRATOR_URL must use accounts_migrator')
}
const clientId = required('SOBOK_OAUTH_CLIENT_ID')
const fullClientSecret = required('SOBOK_OAUTH_CLIENT_SECRET')
const clientName = required('SOBOK_OAUTH_CLIENT_NAME')
const clientOrigin = new URL(required('SOBOK_OAUTH_CLIENT_ORIGIN')).origin
const redirectUris = commaSeparated('SOBOK_OAUTH_REDIRECT_URIS')

if (
  !fullClientSecret.startsWith(SOBOK_OAUTH_CLIENT_SECRET_PREFIX) ||
  fullClientSecret.length < SOBOK_OAUTH_CLIENT_SECRET_PREFIX.length + 32
) {
  throw new Error(
    `SOBOK_OAUTH_CLIENT_SECRET must start with ${SOBOK_OAUTH_CLIENT_SECRET_PREFIX} and contain at least 32 random characters`,
  )
}
for (const redirectUri of redirectUris) {
  const url = new URL(redirectUri)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error(`OAuth redirect URI must use HTTPS: ${redirectUri}`)
  }
}

const sql = postgres(databaseUrl, { max: 1, prepare: false, ssl: 'verify-full' })
const db = drizzle({ client: sql })

try {
  const clientSecret = await hashSobokOAuthClientSecret(fullClientSecret.slice(SOBOK_OAUTH_CLIENT_SECRET_PREFIX.length))
  const [created] = await db
    .insert(oauthClient)
    .values({
      id: crypto.randomUUID(),
      clientId,
      clientSecret,
      disabled: false,
      skipConsent: true,
      enableEndSession: false,
      subjectType: 'public',
      scopes: ['openid', 'profile', 'email'],
      userId: null,
      name: clientName,
      uri: clientOrigin,
      icon: null,
      contacts: null,
      tos: null,
      policy: null,
      softwareId: null,
      softwareVersion: null,
      softwareStatement: null,
      redirectUris,
      postLogoutRedirectUris: null,
      tokenEndpointAuthMethod: 'client_secret_basic',
      grantTypes: ['authorization_code'],
      responseTypes: ['code'],
      public: false,
      type: 'web',
      requirePKCE: true,
      referenceId: null,
      metadata: null,
    })
    .onConflictDoNothing({ target: oauthClient.clientId })
    .returning({ clientId: oauthClient.clientId })

  const [existing] = await db.select().from(oauthClient).where(eq(oauthClient.clientId, clientId)).limit(1)
  if (
    !existing ||
    existing.clientSecret !== clientSecret ||
    existing.disabled !== false ||
    existing.skipConsent !== true ||
    existing.enableEndSession !== false ||
    existing.subjectType !== 'public' ||
    !sameValues(existing.scopes, ['openid', 'profile', 'email']) ||
    existing.userId !== null ||
    existing.name !== clientName ||
    existing.uri !== clientOrigin ||
    existing.icon !== null ||
    existing.contacts !== null ||
    existing.tos !== null ||
    existing.policy !== null ||
    existing.softwareId !== null ||
    existing.softwareVersion !== null ||
    existing.softwareStatement !== null ||
    !sameValues(existing.redirectUris, redirectUris) ||
    existing.postLogoutRedirectUris !== null ||
    existing.tokenEndpointAuthMethod !== 'client_secret_basic' ||
    !sameValues(existing.grantTypes, ['authorization_code']) ||
    !sameValues(existing.responseTypes, ['code']) ||
    existing.public !== false ||
    existing.type !== 'web' ||
    existing.requirePKCE !== true ||
    existing.referenceId !== null ||
    existing.metadata !== null
  ) {
    throw new Error(`OAuth client ${clientId} already exists with a different reviewed credential or metadata`)
  }
  process.stdout.write(
    created
      ? `Created OAuth client ${clientId}. Secret was not printed.\n`
      : `OAuth client ${clientId} already exists; no changes made.\n`,
  )
} finally {
  await sql.end({ timeout: 5 })
}
