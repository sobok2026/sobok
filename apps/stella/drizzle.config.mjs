import { defineConfig } from 'drizzle-kit'

// A push can create or drop objects, so it must name its target explicitly. There is no schema fallback and
// `schemaFilter` keeps the diff inside only `stella` or `stella_stg`. Keeping this config as plain ESM also
// prevents drizzle-kit from trying to resolve the Next app's workspace-extended tsconfig just to load config.
const directUrl = process.env.STELLA_POSTGRES_URL_DIRECT
const schema = process.env.STELLA_DB_SCHEMA

if (!directUrl) {
  throw new Error('STELLA_POSTGRES_URL_DIRECT is required for schema push')
}
if (schema !== 'stella' && schema !== 'stella_stg') {
  throw new Error('STELLA_DB_SCHEMA must explicitly be stella or stella_stg')
}

export default defineConfig({
  schema: './worker/db/schema/*.ts',
  dialect: 'postgresql',
  schemaFilter: [schema],
  dbCredentials: { url: directUrl },
  strict: true,
})
