import { z } from 'zod'

const amount = z.number().int().min(0).max(100000000)
const identifier = z.string().min(1).max(100)
const timestamp = z.number().min(0).max(100000000000)

export const paymentMethods = [
  'cash',
  'card',
  'starbucks-card',
  'gift-certificate',
  'integrated',
  'cash-ic',
  'pay',
  'bc-qr',
  'credit',
] as const
export type PaymentMethod = (typeof paymentMethods)[number]
export const paymentNames: Record<PaymentMethod, string> = {
  cash: '현금',
  card: '신용카드',
  'starbucks-card': '소복다방 카드',
  'gift-certificate': '상품권',
  integrated: '통합결제',
  'cash-ic': '현금IC',
  pay: '간편결제',
  'bc-qr': 'BC카드 QR',
  credit: '후불결제(외상)',
}

export const paymentSchema = z.object({
  id: identifier,
  method: z.enum(paymentMethods),
  amount: amount.positive(),
  tendered: amount.positive(),
  label: z.string().min(1).max(100),
  reference: z.string().max(100).nullable(),
  cardId: identifier.nullable(),
  installments: z.number().int().min(0).max(24),
})
export type Payment = z.infer<typeof paymentSchema>
export type PaymentInput = Omit<Payment, 'amount'>

export function paymentCaption(payment: Pick<Payment, 'method' | 'label'>) {
  return payment.method === 'credit' ? `후불 · ${payment.label}` : payment.label || paymentNames[payment.method]
}

export const couponKinds = ['free-drink', 'coffee', 'size-up', 'tumbler', 'food-amount', 'amount'] as const
export const couponSchema = z.object({
  id: identifier,
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(100),
  source: z.enum(['sr', 'paper']),
  kind: z.enum(couponKinds),
  amount,
  expiresAt: timestamp,
  usedAt: timestamp.nullable(),
})
export type Coupon = z.infer<typeof couponSchema>

export const memberSchema = z.object({
  id: identifier,
  nickname: z.string().min(1).max(40),
  level: z.enum(['Welcome', 'Green', 'Gold']),
  stars: z.number().int().min(0).max(1000000),
  ecoReward: z.enum(['discount', 'star']),
  employee: z.boolean(),
  cards: z.array(z.object({ id: identifier, number: z.string().max(32), balance: amount })).max(10),
  coupons: z.array(couponSchema).max(500),
  telecom: z.object({ kt: z.enum(['general', 'VIP', 'VVIP']), lgu: z.enum(['general', 'VIP', 'VVIP']) }),
  telecomUses: z
    .array(z.object({ carrier: z.enum(['kt', 'lgu']), service: z.enum(['size-up', 'americano']), at: timestamp }))
    .max(10000),
})
export type Member = z.infer<typeof memberSchema>

export const orderOptionsSchema = z.object({
  personalCup: z.boolean(),
  cupDeposit: z.number().int().min(0).max(10000),
  packaging: z.enum(['none', 'individual', 'together']),
})
export type OrderOptions = z.infer<typeof orderOptionsSchema>
export const defaultOrderOptions = (): OrderOptions => ({ personalCup: false, cupDeposit: 0, packaging: 'none' })
export const packagingNames = { none: '기본 제공', individual: '개별 포장', together: '함께 포장' } as const

export const saleBenefitsSchema = z.object({
  memberId: identifier.nullable(),
  coupons: z.array(z.object({ coupon: couponSchema, lineId: identifier })).max(50),
  employee: z.enum(['partner', 'employee', 'mobile']).nullable(),
  telecom: z
    .object({ carrier: z.enum(['kt', 'lgu']), service: z.enum(['size-up', 'americano']), lineId: identifier })
    .nullable(),
  manual: z.object({ kind: z.enum(['amount', 'percent']), value: amount, lineId: identifier.nullable() }).nullable(),
  freeExtra: z.boolean(),
})
export type SaleBenefits = z.infer<typeof saleBenefitsSchema>
export const emptyBenefits = (): SaleBenefits => ({
  memberId: null,
  coupons: [],
  employee: null,
  telecom: null,
  manual: null,
  freeExtra: false,
})

export const discountDetailSchema = z.object({ label: z.string().max(100), amount })
export type DiscountDetail = z.infer<typeof discountDetailSchema>

export function paymentAllowsChange(method: PaymentMethod) {
  return method === 'cash' || method === 'gift-certificate'
}

export function paymentReceiptAmount(payment: Payment) {
  return ['cash', 'starbucks-card', 'gift-certificate', 'cash-ic'].includes(payment.method) ? payment.amount : 0
}
