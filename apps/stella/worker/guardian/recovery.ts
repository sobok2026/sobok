import type { Locale } from '@sobok/domain/locale'
import { openDb } from '@sobok/edge/db/client'
import { sha256Hex } from '@sobok/edge/tokens'

import {
  claimGuardianRecoveryEmail,
  type GuardianReopenCandidate,
  insertGuardianReopenLinks,
  listDueGuardianRecoveryEmails,
  listGuardianReopenCandidates,
  markGuardianRecoveryEmailSent,
  rescheduleGuardianRecoveryEmail,
} from '../db/queries/guardian-reopen'
import type { Bindings } from '../env'
import { GuardianReopenEmailError, sendGuardianReopenEmail } from '../lib/guardian-reopen-email'
import { newGuardianReopenToken } from './tokens'

export const GUARDIAN_REOPEN_LINK_TTL_MS = 15 * 60 * 1000

const DELIVERY_BATCH_SIZE = 20
const DELIVERY_LEASE_MS = 2 * 60 * 1000
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 6 * 60 * 60_000] as const

/**
 * Sends durable post-purchase recovery mail. Request handlers call it through waitUntil for immediacy; the
 * shared 15-minute scheduler calls it without a payment id to recover a crashed or transiently failed send.
 */
export async function dispatchGuardianRecoveryEmails(env: Bindings, input: { paymentId?: string } = {}): Promise<void> {
  const { db, sql } = openDb(env.HYPERDRIVE_FRESH)

  try {
    const candidates = input.paymentId
      ? [{ paymentId: input.paymentId }]
      : await listDueGuardianRecoveryEmails(db, new Date(), DELIVERY_BATCH_SIZE)
    if (candidates.length === 0) {
      return
    }

    let apiKey: string
    try {
      apiKey = await env.STELLA_RESEND_API_KEY.get()
    } catch (error) {
      console.error(
        JSON.stringify({
          error: error instanceof Error ? error.name : 'unknown',
          event: 'stella.guardian_recovery_email.secret_unavailable',
        }),
      )
      return
    }

    for (const candidate of candidates) {
      const token = newGuardianReopenToken()
      const now = new Date()
      const claimed = await claimGuardianRecoveryEmail(db, {
        paymentId: candidate.paymentId,
        tokenHash: await sha256Hex(token),
        now,
        expiresAt: new Date(now.getTime() + GUARDIAN_REOPEN_LINK_TTL_MS),
        leaseExpiresAt: new Date(now.getTime() + DELIVERY_LEASE_MS),
      })
      if (!claimed) {
        continue
      }

      try {
        const sent = await sendGuardianReopenEmail({
          apiKey,
          from: env.STELLA_EMAIL_FROM,
          idempotencyKey: `stella-guardian-purchase-${claimed.paymentId}-${claimed.attempt}`,
          links: [
            {
              paidAt: claimed.paidAt,
              timeZone: claimed.timeZone,
              url: guardianReopenUrl(env, claimed.locale, token),
            },
          ],
          locale: claimed.locale,
          reason: 'purchase',
          receipt: {
            amount: claimed.amount,
            currency: claimed.currency,
            orderName: claimed.orderName,
            paidAt: claimed.paidAt,
            accessExpiresAt: claimed.accessExpiresAt,
            paymentId: claimed.paymentId,
            timeZone: claimed.timeZone,
          },
          replyTo: env.STELLA_EMAIL_REPLY_TO,
          to: claimed.recoveryEmail,
        })
        await markGuardianRecoveryEmailSent(db, {
          purchaseId: claimed.purchaseId,
          attempt: claimed.attempt,
          sentAt: new Date(),
          providerMessageId: sent.providerMessageId,
        })
        console.log(
          JSON.stringify({
            attempt: claimed.attempt,
            event: 'stella.guardian_recovery_email.sent',
          }),
        )
      } catch (error) {
        const code = error instanceof GuardianReopenEmailError ? error.code : 'unknown'
        const delay = RETRY_DELAYS_MS[Math.min(claimed.attempt - 1, RETRY_DELAYS_MS.length - 1)] ?? 60_000
        await rescheduleGuardianRecoveryEmail(db, {
          purchaseId: claimed.purchaseId,
          attempt: claimed.attempt,
          nextAttemptAt: new Date(Date.now() + delay),
          errorCode: code,
        })
        console.error(
          JSON.stringify({
            attempt: claimed.attempt,
            error: code,
            event: 'stella.guardian_recovery_email.failed',
          }),
        )
      }
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

/**
 * Issues requested links after the API has returned its generic response. This keeps purchase lookup timing
 * private while a short email-level cooldown and the request endpoint's Turnstile/IP limits bound sends.
 */
export async function sendRequestedGuardianReopenEmail(
  env: Bindings,
  input: { locale: Locale; normalizedEmail: string; to: string },
): Promise<void> {
  try {
    const apiKey = await env.STELLA_RESEND_API_KEY.get()
    const now = new Date()
    const { db, sql } = openDb(env.HYPERDRIVE_FRESH)
    let links: (GuardianReopenCandidate & {
      token: string
      tokenHash: string
    })[] = []

    try {
      const candidates = await listGuardianReopenCandidates(db, input.normalizedEmail, now)
      links = await Promise.all(
        candidates.map(async (candidate) => {
          const token = newGuardianReopenToken()
          return { ...candidate, token, tokenHash: await sha256Hex(token) }
        }),
      )
      await insertGuardianReopenLinks(
        db,
        links.map(({ purchaseId, tokenHash }) => ({
          purchaseId,
          tokenHash,
          expiresAt: new Date(now.getTime() + GUARDIAN_REOPEN_LINK_TTL_MS),
        })),
      )
    } finally {
      await sql.end({ timeout: 5 })
    }

    const firstLink = links[0]
    if (!firstLink) {
      return
    }
    await sendGuardianReopenEmail({
      apiKey,
      from: env.STELLA_EMAIL_FROM,
      idempotencyKey: `stella-guardian-reopen-${firstLink.tokenHash}`,
      links: links.map(({ locale, paidAt, timeZone, token }) => ({
        paidAt,
        timeZone,
        url: guardianReopenUrl(env, locale, token),
      })),
      locale: input.locale,
      reason: 'request',
      replyTo: env.STELLA_EMAIL_REPLY_TO,
      to: input.to,
    })
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error instanceof GuardianReopenEmailError ? error.code : error instanceof Error ? error.name : 'unknown',
        event: 'stella.guardian_reopen_request.email_failed',
      }),
    )
  }
}

export function guardianReopenUrl(env: Bindings, locale: Locale, token: string): string {
  const url = new URL(`/${locale}/guardian-pass/reopen`, env.STELLA_PUBLIC_ORIGIN)
  url.hash = new URLSearchParams({ token }).toString()
  return url.toString()
}
