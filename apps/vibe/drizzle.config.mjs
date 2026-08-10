import { defineConfig } from 'drizzle-kit'

// Keep schema tooling independent from the Next application's extended tsconfig. A push has no default and
// can see only the explicitly selected Vibe namespace.
const directUrl = process.env.SOBOK_POSTGRES_URL_DIRECT
const schema = process.env.SOBOK_DB_SCHEMA

if (!directUrl) {
  throw new Error('SOBOK_POSTGRES_URL_DIRECT is required for schema push')
}
if (new URL(directUrl).searchParams.get('sslmode') !== 'verify-full') {
  throw new Error('SOBOK_POSTGRES_URL_DIRECT must use sslmode=verify-full')
}
if (schema !== 'deeptype' && schema !== 'deeptype_stg') {
  throw new Error('SOBOK_DB_SCHEMA must explicitly be deeptype or deeptype_stg')
}

export default defineConfig({
  schema: './worker/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: [schema],
  dbCredentials: { url: directUrl },
})
