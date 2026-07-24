import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './worker/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: ['stella'],
  dbCredentials: { url: process.env.STELLA_POSTGRES_URL_DIRECT ?? '' },
  strict: true,
})
