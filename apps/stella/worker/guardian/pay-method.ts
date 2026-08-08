export const GUARDIAN_PAY_METHODS = ['tosspay', 'card'] as const

export type GuardianPayMethod = (typeof GUARDIAN_PAY_METHODS)[number]

export function isGuardianPayMethod(value: unknown): value is GuardianPayMethod {
  return typeof value === 'string' && (GUARDIAN_PAY_METHODS as readonly string[]).includes(value)
}

export const GUARDIAN_PAY_METHOD_SPEC = {
  tosspay: { channel: 'tosspay_v2', sdkPayMethod: 'EASY_PAY' },
  card: { channel: 'tosspayments', sdkPayMethod: 'CARD' },
} as const satisfies Record<
  GuardianPayMethod,
  { channel: 'tosspay_v2' | 'tosspayments'; sdkPayMethod: 'CARD' | 'EASY_PAY' }
>

export type GuardianSdkPayMethod = (typeof GUARDIAN_PAY_METHOD_SPEC)[GuardianPayMethod]['sdkPayMethod']
