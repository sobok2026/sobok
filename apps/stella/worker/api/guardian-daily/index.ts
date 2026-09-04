import { sha256Hex } from '@sobok/edge/tokens'
import { hasStellaSessionCookie, withStellaSession } from '@stella-worker/auth'
import {
  archiveGuardianDailyCard,
  findActiveGuardianPass,
  getGuardianDailyCard,
  resolveGuardianCollectionAccess,
} from '@stella-worker/db/queries/guardian'
import type { AppEnv } from '@stella-worker/env'
import { problem } from '@stella-worker/errors'
import { guardianDailyThemeForDate, selectGuardianDailyCard } from '@stella-worker/guardian/daily-card'
import {
  GUARDIAN_DAILY_BASES,
  GUARDIAN_DAILY_TONES,
  GUARDIAN_ZODIAC_SIGNS,
  type GuardianDailyCardSnapshot,
  type GuardianDailyCardView,
} from '@stella-worker/guardian/daily-contract'
import {
  GuardianAccessTokenSchema,
  GuardianDateKeySchema,
  GuardianTimeZoneSchema,
  GuardianViewerIdSchema,
} from '@stella-worker/guardian/http'
import { guardianArtworkUrl } from '@stella-worker/guardian/manifest'
import { newGuardianPublicId } from '@stella-worker/guardian/tokens'
import { NO_STORE_HEADERS, parseJson } from '@stella-worker/lib/http'
import { bearerToken } from '@stella-worker/lib/request'
import { Hono } from 'hono'
import { z } from 'zod'

const BODY_LIMIT_BYTES = 4 * 1024
const CardBody = z
  .object({
    surface: z.enum(['today', 'tomorrow']),
    locale: z.literal('ko'),
    dateKey: GuardianDateKeySchema,
    timeZone: GuardianTimeZoneSchema,
    basis: z.enum(GUARDIAN_DAILY_BASES),
    sign: z.enum(GUARDIAN_ZODIAC_SIGNS),
    skySign: z.enum(GUARDIAN_ZODIAC_SIGNS),
    tone: z.enum(GUARDIAN_DAILY_TONES).optional(),
    viewerId: GuardianViewerIdSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.basis === 'daily_moon' && value.sign !== value.skySign) {
      context.addIssue({ code: 'custom', message: 'Collective cards use the daily Moon sign', path: ['sign'] })
    }
  })

export const guardianDaily = new Hono<AppEnv>()

guardianDaily.post('/card', async (c) => {
  const rawBody = await c.req.text()
  if (new TextEncoder().encode(rawBody).byteLength > BODY_LIMIT_BYTES) return problem(413, 'payload-too-large')
  const parsed = CardBody.safeParse(parseJson(rawBody))
  if (!parsed.success) return problem(422, 'invalid-request')
  const body = parsed.data

  const localToday = dateKeyInTimeZone(new Date(), body.timeZone)
  if (!localToday) return problem(422, 'invalid-request')
  const expectedDate = body.surface === 'today' ? localToday : nextDateKey(localToday)
  if (body.dateKey !== expectedDate) return problem(409, 'card-not-found')

  const rawToken = bearerToken(c)
  const parsedToken = rawToken === null ? null : GuardianAccessTokenSchema.safeParse(rawToken)
  if (parsedToken && !parsedToken.success) return problem(403, 'forbidden')
  const accessTokenHash = parsedToken?.success ? await sha256Hex(parsedToken.data) : undefined
  const viewerSeedHash = await sha256Hex(body.viewerId)
  const hasSession = hasStellaSessionCookie(c.req.raw)

  if (!accessTokenHash && !hasSession) {
    if (body.surface === 'tomorrow') {
      return c.json(
        {
          status: 'locked' as const,
          theme: await guardianDailyThemeForDate({ seedHash: viewerSeedHash, dateKey: body.dateKey }),
          access: inactiveAccess(),
        },
        200,
        NO_STORE_HEADERS,
      )
    }
    const snapshot = await selectGuardianDailyCard({ ...body, tone: undefined, seedHash: viewerSeedHash })
    return c.json(
      {
        status: 'ready' as const,
        collectionPublicId: null,
        card: toCardView(snapshot, 'today_free', c.env.STELLA_GUARDIAN_ASSET_ORIGIN),
        access: inactiveAccess(),
        archived: false,
      },
      200,
      NO_STORE_HEADERS,
    )
  }

  const now = new Date()
  const outcome = await withStellaSession(c, async (db, session) => {
    const collection = await resolveGuardianCollectionAccess(db, {
      accessTokenHash,
      ownerUserId: session?.user.id,
    })
    if (!collection) return { status: 'no-collection' as const }

    const [existing, active] = await Promise.all([
      getGuardianDailyCard(db, collection.id, body.dateKey),
      findActiveGuardianPass(db, collection.id, now),
    ])
    if (existing) {
      return {
        status: 'ready' as const,
        snapshot: existing.snapshot,
        source: existing.source,
        archived: true,
        expiresAt: active?.expiresAt ?? null,
        collectionPublicId: collection.publicId,
      }
    }
    if (body.surface === 'tomorrow' && !active) {
      return {
        status: 'locked' as const,
        theme: await guardianDailyThemeForDate({ seedHash: collection.seedHash, dateKey: body.dateKey }),
      }
    }
    if (body.surface === 'tomorrow' && body.tone === undefined && active) {
      return {
        status: 'tone_required' as const,
        theme: await guardianDailyThemeForDate({ seedHash: collection.seedHash, dateKey: body.dateKey }),
        expiresAt: active.expiresAt,
      }
    }

    const snapshot = await selectGuardianDailyCard({
      ...body,
      tone: body.surface === 'tomorrow' ? body.tone : undefined,
      seedHash: collection.seedHash,
    })
    if (!active) {
      return {
        status: 'ready' as const,
        snapshot,
        source: 'today_free' as const,
        archived: false,
        expiresAt: null,
        collectionPublicId: collection.publicId,
      }
    }
    const archived = await archiveGuardianDailyCard(db, {
      collectionId: collection.id,
      dateKey: body.dateKey,
      snapshot,
      source: body.surface === 'tomorrow' ? 'tomorrow_pass' : 'today_free',
      publicId: newGuardianPublicId(),
      now,
    })
    if (archived.status === 'pass-required') {
      return {
        status: 'locked' as const,
        theme: await guardianDailyThemeForDate({ seedHash: collection.seedHash, dateKey: body.dateKey }),
      }
    }
    return {
      status: 'ready' as const,
      snapshot: archived.card.snapshot,
      source: archived.card.source,
      archived: true,
      expiresAt: archived.expiresAt,
      collectionPublicId: collection.publicId,
    }
  })

  if (outcome.status === 'locked') {
    return c.json({ status: 'locked' as const, theme: outcome.theme, access: inactiveAccess() }, 200, NO_STORE_HEADERS)
  }
  if (outcome.status === 'tone_required') {
    return c.json(
      {
        status: 'tone_required' as const,
        theme: outcome.theme,
        access: { active: true as const, expiresAt: outcome.expiresAt.toISOString() },
      },
      200,
      NO_STORE_HEADERS,
    )
  }
  if (outcome.status === 'no-collection') {
    if (body.surface === 'tomorrow') {
      return c.json(
        {
          status: 'locked' as const,
          theme: await guardianDailyThemeForDate({ seedHash: viewerSeedHash, dateKey: body.dateKey }),
          access: inactiveAccess(),
        },
        200,
        NO_STORE_HEADERS,
      )
    }
    const snapshot = await selectGuardianDailyCard({ ...body, tone: undefined, seedHash: viewerSeedHash })
    return c.json(
      {
        status: 'ready' as const,
        collectionPublicId: null,
        card: toCardView(snapshot, 'today_free', c.env.STELLA_GUARDIAN_ASSET_ORIGIN),
        access: inactiveAccess(),
        archived: false,
      },
      200,
      NO_STORE_HEADERS,
    )
  }

  return c.json(
    {
      status: 'ready' as const,
      collectionPublicId: outcome.collectionPublicId,
      card: toCardView(outcome.snapshot, outcome.source, c.env.STELLA_GUARDIAN_ASSET_ORIGIN),
      access: {
        active: outcome.expiresAt !== null && outcome.expiresAt > now,
        expiresAt: outcome.expiresAt?.toISOString() ?? null,
      },
      archived: outcome.archived,
    },
    200,
    NO_STORE_HEADERS,
  )
})

function toCardView(
  snapshot: GuardianDailyCardSnapshot,
  source: GuardianDailyCardView['source'],
  assetOrigin: string,
): GuardianDailyCardView {
  const { artworkObjectKey, ...card } = snapshot
  return { ...card, artworkPath: guardianArtworkUrl(artworkObjectKey, assetOrigin), source }
}

function inactiveAccess() {
  return { active: false, expiresAt: null } as const
}

function dateKeyInTimeZone(date: Date, timeZone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
    const year = parts.find(({ type }) => type === 'year')?.value
    const month = parts.find(({ type }) => type === 'month')?.value
    const day = parts.find(({ type }) => type === 'day')?.value
    return year && month && day ? `${year}-${month}-${day}` : null
  } catch {
    return null
  }
}

function nextDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + 1, 12))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
}
