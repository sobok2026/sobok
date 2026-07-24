import { defineConfig } from 'drizzle-kit'

// Schema push for the stella comment board — a DEDICATED `stella` schema on the SHARED Supabase Postgres.
// Run with the OWNER role (DDL rights) via STELLA_POSTGRES_URL_DIRECT (session pooler, sslmode=require); the
// Worker runtime authenticates as the least-privilege `stella_app` role via Hyperdrive instead.
//
// schemaFilter:['stella'] is load-bearing: push then sees ONLY the stella schema, so it never proposes
// dropping the deeptype_* payment tables that share this database. No migration files (repo convention).
//
// Run `worker/db/bootstrap.sql` (creates the schema + role + grants) BEFORE the first push.
export default defineConfig({
  schema: './worker/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: ['stella'],
  dbCredentials: { url: process.env.STELLA_POSTGRES_URL_DIRECT ?? '' },
  strict: true,
})
