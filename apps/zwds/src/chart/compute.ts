// Chart computation runs entirely in the browser: birth details never leave the
// device. iztro is queried in canonical zh-CN and every displayed term is mapped
// through the Korean-first label layer in labels.ts.

import { astro } from 'iztro'
import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'
import type { IFunctionalStar } from 'iztro/lib/star/FunctionalStar'

import {
  type StarKey,
  toBrightnessKey,
  toFiveElementsKey,
  toMajorStarKey,
  toMinorStarKey,
  toMutagenKey,
  toPalaceKey,
} from './keys'
import {
  BRIGHTNESS_LABELS,
  EARTHLY_BRANCH_LABELS,
  FIVE_ELEMENTS_CLASS_LABELS,
  HEAVENLY_STEM_LABELS,
  type Label,
  MAJOR_STAR_LABELS,
  MINOR_STAR_LABELS,
  MUTAGEN_LABELS,
  PALACE_LABELS,
  toLabel,
} from './labels'
import { toApparentSolarTime, type WallClock } from './solar-time'
import { toTimeIndex } from './time-index'
import type { ZwdsChart, ZwdsGender, ZwdsPalace, ZwdsPillar, ZwdsStar } from './types'

// 채택한 규칙을 iztro 기본값에 기대지 않고 명시적으로 고정한다:
// 연 경계 = 음력 정월 초하루, 야자시 = 당일, 안성 = 통행본.
astro.config({
  yearDivide: 'normal',
  horoscopeDivide: 'normal',
  dayDivide: 'current',
  algorithm: 'default',
})

export type ComputeInput = {
  date: string // YYYY-MM-DD (양력, 표준시)
  time: string // HH:mm
  gender: ZwdsGender
  longitude: number
  timeZone: string
}

function parseClock(date: string, time: string): WallClock {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return { year, month, day, hour, minute }
}

function toStar<K extends StarKey>(
  labelTable: Readonly<Record<string, Label>>,
  toKey: (canonical: string) => K | null,
  star: IFunctionalStar,
): ZwdsStar<K> {
  return {
    key: toKey(star.name),
    label: toLabel(labelTable, star.name),
    brightness: star.brightness ? toLabel(BRIGHTNESS_LABELS, star.brightness) : null,
    brightnessKey: star.brightness ? toBrightnessKey(star.brightness) : null,
    mutagen: star.mutagen ? toLabel(MUTAGEN_LABELS, star.mutagen) : null,
    mutagenKey: star.mutagen ? toMutagenKey(star.mutagen) : null,
  }
}

function toPillar([stem, branch]: readonly [string, string]): ZwdsPillar {
  return {
    stem: toLabel(HEAVENLY_STEM_LABELS, stem),
    branch: toLabel(EARTHLY_BRANCH_LABELS, branch),
  }
}

export function computeChart(input: ComputeInput): ZwdsChart {
  const clock = parseClock(input.date, input.time)
  const apparent = toApparentSolarTime(clock, input.longitude, input.timeZone)
  const timeIndex = toTimeIndex(apparent.clock.hour)
  const solarDate = `${apparent.clock.year}-${apparent.clock.month}-${apparent.clock.day}`
  const astrolabe: FunctionalAstrolabe = astro.bySolar(solarDate, timeIndex, input.gender, true, 'zh-CN')

  const palaces: ZwdsPalace[] = astrolabe.palaces.map((palace) => ({
    key: toPalaceKey(palace.name),
    name: toLabel(PALACE_LABELS, palace.name),
    branch: palace.earthlyBranch,
    stemLabel: toLabel(HEAVENLY_STEM_LABELS, palace.heavenlyStem),
    branchLabel: toLabel(EARTHLY_BRANCH_LABELS, palace.earthlyBranch),
    isBodyPalace: palace.isBodyPalace,
    majorStars: palace.majorStars.map((star) => toStar(MAJOR_STAR_LABELS, toMajorStarKey, star)),
    luckyStars: palace.minorStars
      .filter((star) => star.type !== 'tough')
      .map((star) => toStar(MINOR_STAR_LABELS, toMinorStarKey, star)),
    unluckyStars: palace.minorStars
      .filter((star) => star.type === 'tough')
      .map((star) => toStar(MINOR_STAR_LABELS, toMinorStarKey, star)),
    decadal: { from: palace.decadal.range[0], to: palace.decadal.range[1] },
  }))

  const { lunarDate, chineseDate } = astrolabe.rawDates

  return {
    gender: input.gender,
    clock,
    apparentClock: apparent.clock,
    correctionMinutes: apparent.correctionMinutes,
    timeIndex,
    lunar: {
      year: lunarDate.lunarYear,
      month: lunarDate.lunarMonth,
      day: lunarDate.lunarDay,
      isLeap: lunarDate.isLeap,
    },
    fourPillars: {
      year: toPillar(chineseDate.yearly),
      month: toPillar(chineseDate.monthly),
      day: toPillar(chineseDate.daily),
      hour: toPillar(chineseDate.hourly),
    },
    fiveElementsClass: toLabel(FIVE_ELEMENTS_CLASS_LABELS, astrolabe.fiveElementsClass),
    fiveElementsKey: toFiveElementsKey(astrolabe.fiveElementsClass),
    soulPalaceBranch: astrolabe.earthlyBranchOfSoulPalace,
    bodyPalaceBranch: astrolabe.earthlyBranchOfBodyPalace,
    palaces,
  }
}
