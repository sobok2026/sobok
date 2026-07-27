// Workers' console.error prints an Error's own message and stack but drops `cause` — and drizzle wraps every
// driver failure in a DrizzleQueryError whose cause holds the only diagnostic part (the postgres.js/Postgres
// error, with its code/detail/routine). Flatten the chain so a 500 is fully readable from `wrangler tail`.
//
// Depth-capped because a cause chain can be cyclic, and the whole value is JSON-serialized into a log line.
export function describeError(error: unknown, depth = 0): unknown {
  if (!(error instanceof Error) || depth > 4) {
    return error
  }

  const { code, detail, hint, routine, severity } = error as Error & Record<string, unknown>

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error.cause !== undefined && {
      cause: describeError(error.cause, depth + 1),
    }),
    ...(code !== undefined && {
      code,
      detail,
      hint,
      routine,
      severity,
    }),
  }
}
