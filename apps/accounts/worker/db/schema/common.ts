import { pgSchema } from 'drizzle-orm/pg-core'
import { DB_SCHEMA } from '../schema-name'

export const identity = pgSchema(DB_SCHEMA)
