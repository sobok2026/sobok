import { defineConfig } from 'drizzle-kit'

// Schema push for the isolated deeptype Supabase Postgres. Run with the OWNER role (DDL rights); the Worker
// runtime authenticates as the least-privilege `deeptype_app` role via Hyperdrive instead. No migration
// files (repo convention): `drizzle-kit push` only. DEEPTYPE_POSTGRES_URL_DIRECT carries sslmode=require.
export default defineConfig({
  schema: './worker/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: { url: process.env.DEEPTYPE_POSTGRES_URL_DIRECT ?? '' },
  strict: true,
})
