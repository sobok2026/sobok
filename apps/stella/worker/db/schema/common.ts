import { LOCALES } from '@sobok/domain/locale'
import { pgSchema } from 'drizzle-orm/pg-core'
import { DB_SCHEMA } from '../schema-name'

export const stella = pgSchema(DB_SCHEMA)

export const localeEnum = stella.enum('locale', [...LOCALES])
