// Double-hour (時辰) index in iztro's convention: 0 = 조자시 (00:00-01:00,
// today's early 子), 1-11 = 축시-해시 in two-hour steps, 12 = 야자시
// (23:00-24:00, still today's date — iztro dayDivide 'current'). Keeping 야자시
// on the same calendar day matches mainstream Korean practice.

import { Locale } from '@sobok/domain/locale'

export type TimeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export function toTimeIndex(hour: number): TimeIndex {
  if (hour === 23) {
    return 12
  }

  return Math.floor((hour + 1) / 2) as TimeIndex
}

/** 시진 이름 — index 0 and 12 are both 子時 but differ in day attribution. */
export const TIME_INDEX_NAMES = {
  [Locale.KO]: [
    '조자시',
    '축시',
    '인시',
    '묘시',
    '진시',
    '사시',
    '오시',
    '미시',
    '신시',
    '유시',
    '술시',
    '해시',
    '야자시',
  ],
  [Locale.EN]: [
    '早子時',
    '丑時',
    '寅時',
    '卯時',
    '辰時',
    '巳時',
    '午時',
    '未時',
    '申時',
    '酉時',
    '戌時',
    '亥時',
    '晚子時',
  ],
  [Locale.ZH]: [
    '早子时',
    '丑时',
    '寅时',
    '卯时',
    '辰时',
    '巳时',
    '午时',
    '未时',
    '申时',
    '酉时',
    '戌时',
    '亥时',
    '晚子时',
  ],
  [Locale.JA]: [
    '早子時',
    '丑時',
    '寅時',
    '卯時',
    '辰時',
    '巳時',
    '午時',
    '未時',
    '申時',
    '酉時',
    '戌時',
    '亥時',
    '晚子時',
  ],
} satisfies Record<Locale, readonly string[]>
