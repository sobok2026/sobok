import { defineConfig } from 'drizzle-kit'

const directUrl = process.env.ACCOUNTS_POSTGRES_URL_DIRECT
const schema = process.env.ACCOUNTS_DB_SCHEMA

if (!directUrl) {
  throw new Error('ACCOUNTS_POSTGRES_URL_DIRECT is required for schema push')
}
const parsedDirectUrl = new URL(directUrl)
if (parsedDirectUrl.searchParams.get('sslmode') !== 'verify-full') {
  throw new Error('ACCOUNTS_POSTGRES_URL_DIRECT must use sslmode=verify-full')
}
const databaseRole = decodeURIComponent(parsedDirectUrl.username).split('.')[0]
if (schema !== 'identity' && schema !== 'identity_stg') {
  throw new Error('ACCOUNTS_DB_SCHEMA must explicitly be identity or identity_stg')
}
const expectedDatabaseRole = schema === 'identity' ? 'accounts_prod_migrator' : 'accounts_stg_migrator'
if (databaseRole !== expectedDatabaseRole) {
  throw new Error(`ACCOUNTS_POSTGRES_URL_DIRECT must use ${expectedDatabaseRole} for ${schema}`)
}

export default defineConfig({
  schema: './worker/db/schema/*.ts',
  dialect: 'postgresql',
  schemaFilter: [schema],
  dbCredentials: { url: directUrl },
  strict: true,
})
