import { defineConfig } from 'drizzle-kit'

// A push can create or drop objects, so it must name its target explicitly. There is no schema fallback and
// `schemaFilter` keeps the diff inside only `stella` or `stella_stg`.
const directUrl = process.env.SOBOK_POSTGRES_URL_DIRECT
const schema = process.env.SOBOK_DB_SCHEMA

if (!directUrl) {
  throw new Error('SOBOK_POSTGRES_URL_DIRECT is required for schema push')
}
if (new URL(directUrl).searchParams.get('sslmode') !== 'verify-full') {
  throw new Error('SOBOK_POSTGRES_URL_DIRECT must use sslmode=verify-full')
}
if (schema !== 'stella' && schema !== 'stella_stg') {
  throw new Error('SOBOK_DB_SCHEMA must explicitly be stella or stella_stg')
}

export default defineConfig({
  schema: './worker/db/schema/*.ts',
  dialect: 'postgresql',
  schemaFilter: [schema],
  dbCredentials: { url: directUrl },
})
