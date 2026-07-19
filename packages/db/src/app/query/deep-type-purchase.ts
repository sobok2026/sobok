import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import { deepTypePurchaseTable } from '../schema/deep-type-purchase'
import { paymentTable } from '../schema/payment'

export interface CreatePendingDeepTypePurchaseInput {
  paymentId: string
  accessToken: string
  email: string
  locale: string
  orderName: string
  amount: number
  currency?: string
}

export async function createPendingDeepTypePurchase(input: CreatePendingDeepTypePurchaseInput): Promise<void> {
  await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(paymentTable)
      .values({
        paymentId: input.paymentId,
        userId: null,
        orderName: input.orderName,
        amount: input.amount,
        currency: input.currency ?? 'KRW',
      })
      .returning({ id: paymentTable.id })

    await tx.insert(deepTypePurchaseTable).values({
      paymentId: payment.id,
      accessToken: input.accessToken,
      email: input.email,
      locale: input.locale,
    })
  })
}

export interface DeepTypePurchaseStatus {
  status: typeof paymentTable.$inferSelect.status
  resultCode: string | null
  email: string
}

export async function getDeepTypePurchaseByToken(token: string): Promise<DeepTypePurchaseStatus | undefined> {
  const [row] = await db
    .select({
      status: paymentTable.status,
      resultCode: deepTypePurchaseTable.resultCode,
      email: deepTypePurchaseTable.email,
    })
    .from(deepTypePurchaseTable)
    .innerJoin(paymentTable, eq(deepTypePurchaseTable.paymentId, paymentTable.id))
    .where(eq(deepTypePurchaseTable.accessToken, token))

  return row
}

export async function setDeepTypePurchaseResult(token: string, resultCode: string): Promise<{ updated: boolean }> {
  const paidPaymentIds = db.select({ id: paymentTable.id }).from(paymentTable).where(eq(paymentTable.status, 'paid'))

  const [row] = await db
    .update(deepTypePurchaseTable)
    .set({ resultCode })
    .where(and(eq(deepTypePurchaseTable.accessToken, token), inArray(deepTypePurchaseTable.paymentId, paidPaymentIds)))
    .returning({ id: deepTypePurchaseTable.id })

  return { updated: row !== undefined }
}

export async function markDeepTypePurchaseEmailSent(paymentId: number): Promise<void> {
  await db
    .update(deepTypePurchaseTable)
    .set({ confirmationEmailSentAt: new Date() })
    .where(and(eq(deepTypePurchaseTable.paymentId, paymentId), isNull(deepTypePurchaseTable.confirmationEmailSentAt)))
}

export interface UnnotifiedDeepTypePurchase {
  paymentId: number
  accessToken: string
  email: string
  locale: string
  orderName: string
}

export async function listUnnotifiedPaidDeepTypePurchases(limit = 100): Promise<UnnotifiedDeepTypePurchase[]> {
  return db
    .select({
      paymentId: deepTypePurchaseTable.paymentId,
      accessToken: deepTypePurchaseTable.accessToken,
      email: deepTypePurchaseTable.email,
      locale: deepTypePurchaseTable.locale,
      orderName: paymentTable.orderName,
    })
    .from(deepTypePurchaseTable)
    .innerJoin(paymentTable, eq(deepTypePurchaseTable.paymentId, paymentTable.id))
    .where(and(eq(paymentTable.status, 'paid'), isNull(deepTypePurchaseTable.confirmationEmailSentAt)))
    .limit(limit)
}
