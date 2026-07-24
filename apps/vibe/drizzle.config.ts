import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './worker/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: ['deeptype'],
  dbCredentials: { url: process.env.DEEPTYPE_POSTGRES_URL_DIRECT ?? '' },
  strict: true,
})
