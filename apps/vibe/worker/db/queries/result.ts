import type { AssessmentProfile, ItemAnswer } from '@deep-type/model'
import { and, eq, isNull, or } from 'drizzle-orm'

import { dateIsWithinYears } from '../../lib/retention'
import type { Db } from '../client'
import { purchaseTable, resultTable } from '../schema'
import type { PurchaseStatus } from './purchase'

export interface NewResult {
  baseAnswers: ItemAnswer[]
  baseProfile: AssessmentProfile
  locale: 'ko' | 'en' | 'ja' | 'zh'
  resultToken: string
}

export async function insertResult(db: Db, input: NewResult): Promise<void> {
  await db.insert(resultTable).values({
    baseAnswers: input.baseAnswers,
    baseProfile: input.baseProfile,
    gemCode: input.baseProfile.gem.code,
    innerCode: input.baseProfile.inner.code,
    instrumentVersion: input.baseProfile.instrumentVersion,
    locale: input.locale,
    personaCode: input.baseProfile.persona.code,
    resultToken: input.resultToken,
  })
}

export async function getResultForCheckoutByToken(
  db: Db,
  resultToken: string,
): Promise<{ id: number; locale: 'ko' | 'en' | 'ja' | 'zh' } | null> {
  const [row] = await db
    .select({ id: resultTable.id, locale: resultTable.locale })
    .from(resultTable)
    .where(eq(resultTable.resultToken, resultToken))
    .limit(1)
  return row ?? null
}

export interface PurchaseResultContext {
  baseAnswers: ItemAnswer[]
  baseProfile: AssessmentProfile
  purchaseId: number
  refinedProfile: AssessmentProfile | null
  resultId: number
  status: PurchaseStatus
}

export async function getPurchaseResultByAccessToken(
  db: Db,
  accessToken: string,
): Promise<PurchaseResultContext | null> {
  const now = new Date()
  const [row] = await db
    .select({
      baseAnswers: resultTable.baseAnswers,
      baseProfile: resultTable.baseProfile,
      purchaseId: purchaseTable.id,
      refinedProfile: resultTable.refinedProfile,
      resultId: resultTable.id,
      status: purchaseTable.status,
    })
    .from(purchaseTable)
    .innerJoin(resultTable, eq(purchaseTable.resultId, resultTable.id))
    .where(
      and(
        eq(purchaseTable.accessToken, accessToken),
        or(isNull(purchaseTable.paidAt), dateIsWithinYears(purchaseTable.paidAt, now, 1)),
      ),
    )
    .limit(1)
  return row ?? null
}

export async function persistRefinement(
  db: Db,
  resultId: number,
  input: { answers: ItemAnswer[]; profile: AssessmentProfile },
): Promise<boolean> {
  const rows = await db
    .update(resultTable)
    .set({
      gemCode: input.profile.gem.code,
      innerCode: input.profile.inner.code,
      refinementAnswers: input.answers,
      refinedProfile: input.profile,
    })
    .where(and(eq(resultTable.id, resultId), isNull(resultTable.refinedProfile)))
    .returning({ id: resultTable.id })
  return rows.length > 0
}

export async function getRefinedProfile(db: Db, resultId: number): Promise<AssessmentProfile | null> {
  const [row] = await db
    .select({ profile: resultTable.refinedProfile })
    .from(resultTable)
    .where(eq(resultTable.id, resultId))
    .limit(1)
  return row?.profile ?? null
}

export interface ResultForReport {
  locale: 'ko' | 'en' | 'ja' | 'zh'
  profile: AssessmentProfile
  refined: boolean
}

export async function getResultForReport(db: Db, purchaseId: number): Promise<ResultForReport | null> {
  const [row] = await db
    .select({
      baseProfile: resultTable.baseProfile,
      locale: resultTable.locale,
      refinedProfile: resultTable.refinedProfile,
    })
    .from(purchaseTable)
    .innerJoin(resultTable, eq(purchaseTable.resultId, resultTable.id))
    .where(eq(purchaseTable.id, purchaseId))
    .limit(1)

  if (!row) {
    return null
  }
  return {
    locale: row.locale,
    profile: row.refinedProfile ?? row.baseProfile,
    refined: row.refinedProfile !== null,
  }
}
