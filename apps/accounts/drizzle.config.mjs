import { defineConfig } from 'drizzle-kit'

const directUrl = process.env.ACCOUNTS_POSTGRES_URL_DIRECT
const schema = process.env.ACCOUNTS_DB_SCHEMA

if (!directUrl) {
  throw new Error('ACCOUNTS_POSTGRES_URL_DIRECT is required for schema push')
}
if (new URL(directUrl).searchParams.get('sslmode') !== 'verify-full') {
  throw new Error('ACCOUNTS_POSTGRES_URL_DIRECT must use sslmode=verify-full')
}
if (schema !== 'identity' && schema !== 'identity_stg') {
  throw new Error('ACCOUNTS_DB_SCHEMA must explicitly be identity or identity_stg')
}

export default defineConfig({
  schema: './worker/db/schema/*.ts',
  dialect: 'postgresql',
  schemaFilter: [schema],
  dbCredentials: { url: directUrl },
  strict: true,
})
