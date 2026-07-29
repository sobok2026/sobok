import { defineConfig } from 'drizzle-kit'

import { DB_SCHEMA } from './worker/db/schema-name'

// `DB_SCHEMA` throws when DEEPTYPE_DB_SCHEMA is unset, and that is the point: push is the one command that
// can create or drop tables, so it must be told which schema it is aimed at instead of defaulting into the
// live one. `schemaFilter` then keeps the diff inside that schema — without it drizzle compares against every
// schema on the database and proposes dropping the ones it does not own (`stella`, Supabase's own).
export default defineConfig({
  schema: './worker/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: [DB_SCHEMA],
  dbCredentials: { url: process.env.DEEPTYPE_POSTGRES_URL_DIRECT ?? '' },
  strict: true,
})
