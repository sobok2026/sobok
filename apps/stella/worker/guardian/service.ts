import type { Locale } from '@sobok/domain/locale'
import type { Db } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'
import { createGuestGuardianReportDraft } from '../db/queries/guardian'
import type { GuardianSelectionContext } from './manifest'
import { newGuardianAccessToken, newGuardianPublicId } from './tokens'

/**
 * Creates the guest-owned aggregate and returns its raw capability exactly once. This service is deliberately
 * not routed yet: the eventual endpoint must add Turnstile/rate limits and decide input-retention behavior.
 */
export async function prepareGuestGuardianReport(
  db: Db,
  input: { locale: Locale; inputSnapshot: GuardianSelectionContext },
): Promise<{
  collectionPublicId: string
  reportPublicId: string
  collectionAccessToken: string
}> {
  const collectionAccessToken = newGuardianAccessToken()
  const draft = await createGuestGuardianReportDraft(db, {
    collectionPublicId: newGuardianPublicId(),
    collectionAccessTokenHash: await sha256Hex(collectionAccessToken),
    reportPublicId: newGuardianPublicId(),
    locale: input.locale,
    inputSnapshot: input.inputSnapshot,
  })

  return {
    collectionPublicId: draft.collectionPublicId,
    reportPublicId: draft.reportPublicId,
    collectionAccessToken,
  }
}
