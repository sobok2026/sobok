import type { BrightnessKey, FiveElementsKey, MajorStarKey, MutagenKey, PalaceKey, StarKey } from './keys'
import type { Label } from './labels'
import type { WallClock } from './solar-time'
import type { TimeIndex } from './time-index'

export type ZwdsGender = 'male' | 'female'

export type ZwdsStar<K extends StarKey = StarKey> = {
  /** Canonical identity — null only if iztro output drifts past keys.ts. */
  key: K | null
  label: Label
  brightness: Label | null
  brightnessKey: BrightnessKey | null
  /** 생년 사화 — 화록·화권·화과·화기 중 하나 */
  mutagen: Label | null
  mutagenKey: MutagenKey | null
}

export type ZwdsPalace = {
  key: PalaceKey | null
  name: Label
  /** Canonical earthly branch (子-亥) — the fixed grid position key. */
  branch: string
  stemLabel: Label
  branchLabel: Label
  isBodyPalace: boolean
  majorStars: readonly ZwdsStar<MajorStarKey>[]
  luckyStars: readonly ZwdsStar[]
  unluckyStars: readonly ZwdsStar[]
  decadal: { from: number; to: number }
}

export type ZwdsPillar = {
  stem: Label
  branch: Label
}

export type ZwdsChart = {
  gender: ZwdsGender
  /** 입력한 표준시 그대로의 출생 시각 */
  clock: WallClock
  /** 진태양시 보정을 거친 시각 — 명반 계산의 기준 */
  apparentClock: WallClock
  correctionMinutes: number
  timeIndex: TimeIndex
  lunar: { year: number; month: number; day: number; isLeap: boolean }
  fourPillars: { year: ZwdsPillar; month: ZwdsPillar; day: ZwdsPillar; hour: ZwdsPillar }
  fiveElementsClass: Label
  fiveElementsKey: FiveElementsKey | null
  /** 명궁·신궁의 canonical 지지 */
  soulPalaceBranch: string
  bodyPalaceBranch: string
  palaces: readonly ZwdsPalace[]
}
