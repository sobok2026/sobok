/**
 * The PostgreSQL schema is a deployment build constant. Production and staging
 * share one managed PostgreSQL project and one least-privilege connection role,
 * while every generated query remains schema-qualified.
 */
declare const ACCOUNTS_DB_SCHEMA: string | undefined

export type AccountsDbSchema = 'identity' | 'identity_stg'

function isAccountsDbSchema(value: string | undefined): value is AccountsDbSchema {
  return value === 'identity' || value === 'identity_stg'
}

function resolveSchemaName(): AccountsDbSchema {
  if (typeof ACCOUNTS_DB_SCHEMA === 'string' && ACCOUNTS_DB_SCHEMA) {
    if (isAccountsDbSchema(ACCOUNTS_DB_SCHEMA)) {
      return ACCOUNTS_DB_SCHEMA
    }
    throw new Error(`Invalid ACCOUNTS_DB_SCHEMA: ${ACCOUNTS_DB_SCHEMA}`)
  }

  const fromNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.ACCOUNTS_DB_SCHEMA
  if (isAccountsDbSchema(fromNode)) {
    return fromNode
  }
  if (fromNode) {
    throw new Error(`Invalid ACCOUNTS_DB_SCHEMA: ${fromNode}`)
  }

  throw new Error('ACCOUNTS_DB_SCHEMA is unset')
}

export const DB_SCHEMA = resolveSchemaName()
