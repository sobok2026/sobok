import { defineConfig } from 'drizzle-kit'

import { DB_SCHEMA } from './worker/db/schema-name'

// A push can create or drop objects, so it must name its target explicitly. `DB_SCHEMA` has no fallback and
// `schemaFilter` keeps the diff inside only `stella` or `stella_stg`.
const directURL = process.env.STELLA_POSTGRES_URL_DIRECT

if (!directURL) {
  throw new Error('STELLA_POSTGRES_URL_DIRECT is required for schema push')
}

export default defineConfig({
  schema: './worker/db/schema/*.ts',
  dialect: 'postgresql',
  schemaFilter: [DB_SCHEMA],
  dbCredentials: { url: directURL },
  strict: true,
})
