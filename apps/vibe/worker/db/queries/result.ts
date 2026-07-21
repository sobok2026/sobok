import { eq } from 'drizzle-orm'

import type { Db } from '../client'
import { purchaseTable, resultTable } from '../schema'
import type { PurchaseStatus } from './purchase'

export interface NewResult {
  resultToken: string
  locale: 'ko' | 'en' | 'ja' | 'zh'
  selfClaim?: string
  persona: string
  innerType: string
  gem: string
  baseAnswers: unknown[]
  innerAnswers: unknown[]
  gemAnswers: unknown[]
}

export async function insertResult(db: Db, input: NewResult): Promise<void> {
  await db.insert(resultTable).values({
    resultToken: input.resultToken,
    locale: input.locale,
    selfClaim: input.selfClaim,
    persona: input.persona,
    innerType: input.innerType,
    gem: input.gem,
    baseAnswers: input.baseAnswers,
    innerAnswers: input.innerAnswers,
    gemAnswers: input.gemAnswers,
  })
}

// The internal bigint id backing a result_token — used to link a purchase. Returns null if the token is
// unknown (uniform 404 upstream; never reveal whether a token exists).
export async function getResultIdByToken(db: Db, resultToken: string): Promise<number | null> {
  const [row] = await db
    .select({ id: resultTable.id })
    .from(resultTable)
    .where(eq(resultTable.resultToken, resultToken))
    .limit(1)
  return row?.id ?? null
}

export interface ResultForReport {
  locale: 'ko' | 'en' | 'ja' | 'zh'
  selfClaim: string | null
  persona: string | null
  innerType: string | null
  gem: string | null
  axisStrengths: Record<string, number> | null
  profile: Record<string, unknown> | null
}

export interface PurchaseResultContext {
  purchaseId: number
  status: PurchaseStatus
  resultId: number
  innerType: string | null
  gem: string | null
}

// Resolve a report access_token to its purchase + the free codes precision needs (inner/gem) to compute
// "contested" axes. FRESH-only (entitlement + write path).
export async function getPurchaseResultByAccessToken(
  db: Db,
  accessToken: string,
): Promise<PurchaseResultContext | null> {
  const [row] = await db
    .select({
      purchaseId: purchaseTable.id,
      status: purchaseTable.status,
      resultId: purchaseTable.resultId,
      innerType: resultTable.innerType,
      gem: resultTable.gem,
    })
    .from(purchaseTable)
    .innerJoin(resultTable, eq(purchaseTable.resultId, resultTable.id))
    .where(eq(purchaseTable.accessToken, accessToken))
    .limit(1)
  return row ?? null
}

// Persist the server-scored precision layer onto the result. axisStrengths + profile are what the LLM
// report reads (never the client's own numbers).
export async function persistPrecision(
  db: Db,
  resultId: number,
  input: {
    precisionAnswers: unknown[]
    axisStrengths: Record<string, number>
    profile: Record<string, unknown>
  },
): Promise<void> {
  await db
    .update(resultTable)
    .set({
      precisionAnswers: input.precisionAnswers,
      axisStrengths: input.axisStrengths,
      profile: input.profile,
    })
    .where(eq(resultTable.id, resultId))
}

// The scored result a purchase points at — the raw material the LLM report narrates. No email, no raw
// answers: only the computed codes + (Phase 5) the server-scored axis strengths and sanitized profile.
export async function getResultForReport(db: Db, purchaseId: number): Promise<ResultForReport | null> {
  const [row] = await db
    .select({
      locale: resultTable.locale,
      selfClaim: resultTable.selfClaim,
      persona: resultTable.persona,
      innerType: resultTable.innerType,
      gem: resultTable.gem,
      axisStrengths: resultTable.axisStrengths,
      profile: resultTable.profile,
    })
    .from(purchaseTable)
    .innerJoin(resultTable, eq(purchaseTable.resultId, resultTable.id))
    .where(eq(purchaseTable.id, purchaseId))
    .limit(1)
  return row ?? null
}
