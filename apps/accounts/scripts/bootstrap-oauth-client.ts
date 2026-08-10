import { createSobokAuthority } from '@sobok/auth/authority'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as authSchema from '../worker/db/schema'
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

const databaseUrl = required('ACCOUNTS_POSTGRES_URL_DIRECT')
const origin = new URL(required('ACCOUNTS_PUBLIC_ORIGIN')).origin
const clientId = required('SOBOK_OAUTH_CLIENT_ID')
const fullClientSecret = required('SOBOK_OAUTH_CLIENT_SECRET')
const clientName = required('SOBOK_OAUTH_CLIENT_NAME')
const clientOrigin = new URL(required('SOBOK_OAUTH_CLIENT_ORIGIN')).origin
const redirectUris = commaSeparated('SOBOK_OAUTH_REDIRECT_URIS')
const secretPrefix = 'sobok_cs_'

if (!fullClientSecret.startsWith(secretPrefix) || fullClientSecret.length < secretPrefix.length + 32) {
  throw new Error(`SOBOK_OAUTH_CLIENT_SECRET must start with ${secretPrefix} and contain at least 32 random characters`)
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
  const [existing] = await db.select().from(oauthClient).where(eq(oauthClient.clientId, clientId)).limit(1)
  if (existing) {
    if (
      existing.name !== clientName ||
      existing.uri !== clientOrigin ||
      existing.tokenEndpointAuthMethod !== 'client_secret_basic' ||
      existing.requirePKCE !== true ||
      existing.skipConsent !== true ||
      !sameValues(existing.redirectUris, redirectUris) ||
      !sameValues(existing.scopes, ['openid', 'profile', 'email'])
    ) {
      throw new Error(`OAuth client ${clientId} already exists with different reviewed metadata`)
    }
    process.stdout.write(`OAuth client ${clientId} already exists; no changes made.\n`)
    process.exitCode = 0
  } else {
    const auth = createSobokAuthority({
      database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
      baseURL: origin,
      issuer: origin,
      // The admin method only hashes and inserts the reviewed OAuth credential; it does not validate or mint
      // an authority session. Keeping this bootstrap-only value here avoids exporting the runtime signing
      // secret from Secrets Store or Terraform merely to seed a client row.
      secret: 'sobok-oauth-client-bootstrap-only-secret',
      trustedOrigins: [origin],
      passkey: { rpID: new URL(origin).hostname, origin },
      turnstile: {
        secretKey: 'bootstrap-not-used',
        allowedHostnames: [new URL(origin).hostname],
        action: 'sobok-auth',
      },
      firstPartyClientIds: [clientId],
      sendEmail: async () => undefined,
      defer: () => undefined,
      oauthClientGenerators: {
        clientId: () => clientId,
        clientSecret: () => fullClientSecret.slice(secretPrefix.length),
      },
    })

    const created = await auth.api.adminCreateOAuthClient({
      body: {
        client_name: clientName,
        client_uri: clientOrigin,
        redirect_uris: redirectUris,
        scope: 'openid profile email',
        token_endpoint_auth_method: 'client_secret_basic',
        grant_types: ['authorization_code'],
        response_types: ['code'],
        type: 'web',
        skip_consent: true,
        require_pkce: true,
        subject_type: 'public',
      },
    })

    if (created.client_id !== clientId || created.client_secret !== fullClientSecret) {
      throw new Error('OAuth provider returned credentials different from the reviewed bootstrap input')
    }
    process.stdout.write(`Created OAuth client ${clientId}. Secret was not printed.\n`)
  }
} finally {
  await sql.end({ timeout: 5 })
}
