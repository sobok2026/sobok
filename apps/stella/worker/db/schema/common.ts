import { LOCALES } from '@sobok/domain/locale'
import { pgSchema } from 'drizzle-orm/pg-core'

export const stella = pgSchema('stella')

export const localeEnum = stella.enum('locale', [...LOCALES])
