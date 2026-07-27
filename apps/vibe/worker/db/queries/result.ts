import {
  type AssessmentProfile,
  type ItemAnswer,
  PERSONA_CODES,
  type PersonaCode,
  type PersonaSource,
  type WorkAnswer,
} from '@deep-type/model'
import { and, eq, isNull, or } from 'drizzle-orm'

import { dateIsWithinYears } from '../../lib/retention'
import type { Db } from '../client'
import { purchaseTable, type RefinementDraft, resultTable } from '../schema'
import type { PurchaseStatus } from './purchase'

export interface NewResult {
  baseAnswers: ItemAnswer[]
  baseProfile: AssessmentProfile
  declaredPersona: PersonaCode | null
  freeWorkAnswers: WorkAnswer[]
  locale: 'ko' | 'en' | 'ja' | 'zh'
  resultToken: string
}

// `persona_code` holds the respondent's self-declaration, which is offered rather than measured, so absence is
// NULL — not the empty string. `persona_source` is derived here rather than accepted from the client, so a
// forged 'declared' cannot conjure a self-report comparison out of a missing code.
export async function insertResult(db: Db, input: NewResult): Promise<void> {
  await db.insert(resultTable).values({
    baseAnswers: input.baseAnswers,
    baseProfile: input.baseProfile,
    freeWorkAnswers: input.freeWorkAnswers,
    freeWorkAnswersAt: new Date(),
    gemCode: input.baseProfile.gem.code,
    innerCode: input.baseProfile.inner.code,
    instrumentVersion: input.baseProfile.instrumentVersion,
    locale: input.locale,
    personaCode: input.declaredPersona,
    personaSource: input.declaredPersona === null ? 'unknown' : 'declared',
    resultToken: input.resultToken,
  })
}

// Legacy rows predate the declaration and carry a measured code, so the source column — not the code — decides
// whether a declaration exists at all.
function toDeclaredPersona(source: PersonaSource, value: string | null): PersonaCode | null {
  if (source !== 'declared' || value === null) {
    return null
  }
  return (PERSONA_CODES as readonly string[]).includes(value) ? (value as PersonaCode) : null
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
  declaredPersona: PersonaCode | null
  freeWorkAnswers: WorkAnswer[] | null
  freeWorkAnswersAt: Date | null
  /** The instrument the stored `baseAnswers` were collected under. Compare before re-scoring them. */
  instrumentVersion: string
  personaSource: PersonaSource
  purchaseId: number
  refinedProfile: AssessmentProfile | null
  resultId: number
  status: PurchaseStatus
}

// The self-declaration columns are part of this select on purpose: the paid pass has to score against the same
// declaration the free pass did, and a Persona that changes across payment is a support incident, not a bug
// report. The free drain block and its timestamp travel with them so the paid tally can decide in one round
// trip whether the two sittings are close enough to sum. `instrument_version` rides along for the same
// reason: the caller re-scores `baseAnswers` against the CURRENT selection tables, so it has to be able to
// tell "this answer set predates the instrument" from "this payload is malformed" before it tries.
export async function getPurchaseResultByAccessToken(
  db: Db,
  accessToken: string,
): Promise<PurchaseResultContext | null> {
  const now = new Date()
  const [row] = await db
    .select({
      baseAnswers: resultTable.baseAnswers,
      baseProfile: resultTable.baseProfile,
      freeWorkAnswers: resultTable.freeWorkAnswers,
      freeWorkAnswersAt: resultTable.freeWorkAnswersAt,
      instrumentVersion: resultTable.instrumentVersion,
      personaCode: resultTable.personaCode,
      personaSource: resultTable.personaSource,
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
  if (!row) {
    return null
  }
  const { personaCode, ...context } = row
  return { ...context, declaredPersona: toDeclaredPersona(row.personaSource, personaCode) }
}

// Overwrites in place: the draft is a scratch buffer for one unfinished paid sitting, not a history.
export async function saveRefinementDraft(db: Db, resultId: number, draft: RefinementDraft): Promise<void> {
  await db
    .update(resultTable)
    .set({ refinementDraft: draft, refinementDraftAt: new Date() })
    .where(and(eq(resultTable.id, resultId), isNull(resultTable.refinedProfile)))
}

export async function getRefinementDraft(db: Db, resultId: number): Promise<RefinementDraft | null> {
  const [row] = await db
    .select({ draft: resultTable.refinementDraft })
    .from(resultTable)
    .where(eq(resultTable.id, resultId))
    .limit(1)
  return row?.draft ?? null
}

export interface RefinementInput {
  answers: ItemAnswer[]
  profile: AssessmentProfile
  /** The paid forced-choice block only. The free three keep their own column and their own timestamp. */
  workAnswers: WorkAnswer[]
}

export async function persistRefinement(db: Db, resultId: number, input: RefinementInput): Promise<boolean> {
  const rows = await db
    .update(resultTable)
    .set({
      gemCode: input.profile.gem.code,
      innerCode: input.profile.inner.code,
      refinementAnswers: input.answers,
      // The draft has served its purpose the moment the block lands; leaving it would keep a stale partial set
      // alive for the resume path to find.
      refinementDraft: null,
      refinementDraftAt: null,
      refinedProfile: input.profile,
      workAnswers: input.workAnswers,
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
