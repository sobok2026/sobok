/**
 * The shape of one locale's message tree.
 *
 * Values must be strings all the way down. A number leaf is silently dropped from the compiled catalogue
 * rather than rejected, so it type-checks and then goes missing at runtime — writing `'1'` instead of `1`
 * is the fix.
 */
export type MessageValue = string | { [key: string]: MessageValue }

export type Messages = { [key: string]: MessageValue }
