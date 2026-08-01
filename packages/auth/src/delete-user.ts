import { db } from '@sobok/db/app'
import { chatArtistTable } from '@sobok/db/app/chat'
import { invoiceTable } from '@sobok/db/app/invoice'
import { paymentMethodTable, subscriptionTable } from '@sobok/db/app/subscription'
import { userErasureTable } from '@sobok/db/app/user'
import { SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@sobok/domain/subscription/policy'
import { env } from '@sobok/env/server.auth'
import { createPaymentsClient } from '@sobok/payments'
import { and, eq, inArray } from 'drizzle-orm'

const payments =
  env.PAYMENTS_SERVICE_URL && env.PAYMENTS_SERVICE_TOKEN
    ? createPaymentsClient({ baseUrl: env.PAYMENTS_SERVICE_URL, token: env.PAYMENTS_SERVICE_TOKEN })
    : null

// better-auth deleteUser의 beforeDelete 훅 — user 행 삭제(cascade) 직전에 도메인 오프보딩을 수행한다.
export async function offboardUserBeforeDelete(userId: string): Promise<void> {
  const billingTokens = await db.transaction(async (tx) => {
    const tokens = await tx
      .select({ token: paymentMethodTable.token })
      .from(paymentMethodTable)
      .where(and(eq(paymentMethodTable.userId, userId), eq(paymentMethodTable.status, 'active')))

    // 아티스트였다면 판매된 콘텐츠(브로드캐스트·1:1 되답장)를 보존하기 위해 오퍼링만 종료한다.
    const [chatArtist] = await tx
      .update(chatArtistTable)
      .set({ isActive: false })
      .where(eq(chatArtistTable.userId, userId))
      .returning({ id: chatArtistTable.id })

    if (chatArtist) {
      // 아티스트 이탈 = 오퍼링 영구 종료 → 구독 팬을 즉시 clean terminal로 전이한다. 결제 실패가
      // 아니므로 canceled(워커의 past_due 표류 차단), expiresAt는 유지해 남은 유료기간은 보존된
      // 브로드캐스트로 존중한다(무환불).
      await tx
        .update(subscriptionTable)
        .set({
          autoRenew: false,
          status: 'canceled',
          canceledAt: new Date(),
        })
        .where(
          and(
            eq(subscriptionTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
            eq(subscriptionTable.targetId, chatArtist.id),
            inArray(subscriptionTable.status, ['incomplete', 'active', 'past_due']),
          ),
        )

      // 진행 중이던 미결제(open) 청구 슬롯을 비워 갱신이 완주하지 못하게 한다.
      await tx
        .update(invoiceTable)
        .set({ status: 'void' })
        .where(
          and(
            eq(invoiceTable.targetType, SUBSCRIPTION_TARGET_CHAT_ARTIST),
            eq(invoiceTable.targetId, chatArtist.id),
            eq(invoiceTable.status, 'open'),
          ),
        )
    }

    // Chat DB(별도 클러스터)는 cascade가 닿지 않으므로 파기 outbox를 남긴다.
    await tx.insert(userErasureTable).values({ userId }).onConflictDoNothing()

    return tokens.map((row) => row.token)
  })

  if (!payments && billingTokens.length > 0) {
    console.error('delete user: central payments service is not configured; billing keys were not revoked')
    return
  }

  const results = await Promise.allSettled(billingTokens.map((token) => payments!.revokeBillingKey(token)))

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('delete user: revokeBillingKey failed', result.reason)
    }
  }
}
