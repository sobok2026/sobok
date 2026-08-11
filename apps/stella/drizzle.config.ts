import { defineConfig } from 'drizzle-kit'

const migratorUrl = process.env.SOBOK_MIGRATOR_URL
if (!migratorUrl) throw new Error('SOBOK_MIGRATOR_URL is required for schema push')

const parsedUrl = new URL(migratorUrl)
if (parsedUrl.searchParams.get('sslmode') !== 'verify-full') {
  throw new Error('SOBOK_MIGRATOR_URL must use sslmode=verify-full')
}
if (decodeURIComponent(parsedUrl.username).split('.')[0] !== 'stella_migrator') {
  throw new Error('SOBOK_MIGRATOR_URL must use stella_migrator')
}

export default defineConfig({
  schema: './worker/db/schema/*.ts',
  dialect: 'postgresql',
  schemaFilter: ['stella'],
  dbCredentials: { url: migratorUrl },
})
