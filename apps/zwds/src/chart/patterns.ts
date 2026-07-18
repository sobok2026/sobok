// 격국 detection — pure, deterministic rules over the finished chart. Every
// rule anchors on the 명궁 (or its 협·대궁·삼방사정) following the common
// textbook framing; scoring lives in signature.ts, copy in content/.

import type { PatternKey } from '@/content/interpretations/types'

import type { MajorStarKey, MutagenKey, StarKey } from './keys'
import type { ZwdsChart, ZwdsPalace } from './types'

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

function branchAt(branch: string, offset: number): string {
  const index = BRANCH_ORDER.indexOf(branch as (typeof BRANCH_ORDER)[number])
  return BRANCH_ORDER[(index + offset + 12) % 12]
}

export function palaceByBranch(chart: ZwdsChart, branch: string): ZwdsPalace | undefined {
  return chart.palaces.find((palace) => palace.branch === branch)
}

export function lifePalace(chart: ZwdsChart): ZwdsPalace | undefined {
  return chart.palaces.find((palace) => palace.key === 'life')
}

export function oppositePalace(chart: ZwdsChart, palace: ZwdsPalace): ZwdsPalace | undefined {
  return palaceByBranch(chart, branchAt(palace.branch, 6))
}

/** 삼방사정 — the palace itself, its 대궁 and the two 삼합 partners. */
export function trinityPalaces(chart: ZwdsChart, palace: ZwdsPalace): ZwdsPalace[] {
  return [0, 4, 6, 8]
    .map((offset) => palaceByBranch(chart, branchAt(palace.branch, offset)))
    .filter((found): found is ZwdsPalace => found !== undefined)
}

/** 협궁 — the two adjacent palaces. */
export function flankingPalaces(chart: ZwdsChart, palace: ZwdsPalace): ZwdsPalace[] {
  return [-1, 1]
    .map((offset) => palaceByBranch(chart, branchAt(palace.branch, offset)))
    .filter((found): found is ZwdsPalace => found !== undefined)
}

function majorKeys(palace: ZwdsPalace): Set<MajorStarKey> {
  const keys = new Set<MajorStarKey>()
  for (const star of palace.majorStars) {
    if (star.key) {
      keys.add(star.key)
    }
  }
  return keys
}

function allStarKeys(palace: ZwdsPalace): Set<StarKey> {
  const keys = new Set<StarKey>()
  for (const star of [...palace.majorStars, ...palace.luckyStars, ...palace.unluckyStars]) {
    if (star.key) {
      keys.add(star.key)
    }
  }
  return keys
}

function unionMajors(palaces: readonly ZwdsPalace[]): Set<MajorStarKey> {
  const keys = new Set<MajorStarKey>()
  for (const palace of palaces) {
    for (const key of majorKeys(palace)) {
      keys.add(key)
    }
  }
  return keys
}

function mutagensIn(palaces: readonly ZwdsPalace[]): Set<MutagenKey> {
  const found = new Set<MutagenKey>()
  for (const palace of palaces) {
    for (const star of [...palace.majorStars, ...palace.luckyStars, ...palace.unluckyStars]) {
      if (star.mutagenKey) {
        found.add(star.mutagenKey)
      }
    }
  }
  return found
}

function hasAll<T>(set: Set<T>, values: readonly T[]): boolean {
  return values.every((value) => set.has(value))
}

/**
 * Detects every matching 격국, ordered rarest-signal first (the order below is
 * the tie-break order signature.ts preserves).
 */
export function findPatterns(chart: ZwdsChart): PatternKey[] {
  const life = lifePalace(chart)

  if (!life) {
    return []
  }

  const trinity = trinityPalaces(chart, life)
  const trinityWithoutLife = trinity.filter((palace) => palace.branch !== life.branch)
  const flanks = flankingPalaces(chart, life)
  const lifeMajors = majorKeys(life)
  const lifeStars = allStarKeys(life)
  const trinityMajors = unionMajors(trinity)
  const trinityMutagens = mutagensIn(trinity)
  const trinityStars = trinity.map(allStarKeys)
  const oppositeStars = allStarKeys(oppositePalace(chart, life) ?? life)

  const found: PatternKey[] = []

  // 삼기가회 — 화록·화권·화과가 명궁 삼방사정에 모두 회합.
  if (hasAll(trinityMutagens, ['lu', 'quan', 'ke'])) {
    found.push('sanqiJiahui')
  }

  // 군신경회 — 자미 명궁에 좌보·우필이 동궁하거나 삼방에서 회합.
  if (
    lifeMajors.has('ziwei') &&
    (lifeStars.has('zuofu') ||
      lifeStars.has('youbi') ||
      (trinityStars.some((stars) => stars.has('zuofu')) && trinityStars.some((stars) => stars.has('youbi'))))
  ) {
    found.push('junchenQinghui')
  }

  // 창곡협명 — 문창·문곡이 명궁을 양옆에서 끼거나 함께 앉음.
  const [flankA, flankB] = [allStarKeys(flanks[0] ?? life), allStarKeys(flanks[1] ?? life)]
  if (
    (lifeStars.has('wenchang') && lifeStars.has('wenqu')) ||
    (flankA.has('wenchang') && flankB.has('wenqu')) ||
    (flankA.has('wenqu') && flankB.has('wenchang'))
  ) {
    found.push('changquJiaming')
  }

  // 괴월협명(좌귀향귀) — 천괴·천월이 명궁·대궁 또는 양 협궁에 나뉘어 앉음.
  if (
    (lifeStars.has('tiankui') && oppositeStars.has('tianyue')) ||
    (lifeStars.has('tianyue') && oppositeStars.has('tiankui')) ||
    (flankA.has('tiankui') && flankB.has('tianyue')) ||
    (flankA.has('tianyue') && flankB.has('tiankui'))
  ) {
    found.push('kuiyueJiaming')
  }

  // 자부동궁 — 자미·천부가 명궁에 동궁 (寅·申에서만 성립).
  if (lifeMajors.has('ziwei') && lifeMajors.has('tianfu')) {
    found.push('zifuTonggong')
  }

  // 월랑천문 — 태음이 亥 명궁에 앉음.
  if (life.branch === '亥' && lifeMajors.has('taiyin')) {
    found.push('yuelangTianmen')
  }

  // 일조뇌문 — 태양이 卯 명궁에 앉음.
  if (life.branch === '卯' && lifeMajors.has('taiyang')) {
    found.push('rizhaoLeimen')
  }

  // 쌍록조원 — 녹존과 화록이 명궁 삼방사정에서 함께 회합.
  if (
    trinityStars.some((stars) => stars.has('lucun')) &&
    trinity.some((palace) => [...palace.majorStars, ...palace.luckyStars].some((star) => star.mutagenKey === 'lu'))
  ) {
    found.push('shuangluChaoyuan')
  }

  // 녹마교치 — 녹존과 천마가 명궁 삼방사정의 한 궁에 동궁.
  if (trinityStars.some((stars) => stars.has('lucun') && stars.has('tianma'))) {
    found.push('lumaJiaochi')
  }

  // 부상조원 — 천부·천상이 삼방(재백·관록 방향)에서 명궁을 향해 조회.
  const supportMajors = unionMajors(trinityWithoutLife)
  if (supportMajors.has('tianfu') && supportMajors.has('tianxiang')) {
    found.push('fuxiangChaoyuan')
  }

  // 일월동궁 — 태양·태음이 명궁에 동궁 (丑·未에서만 성립).
  if (lifeMajors.has('taiyang') && lifeMajors.has('taiyin')) {
    found.push('riyueTonggong')
  }

  // 영성입묘(자오파군) — 파군이 子·午 명궁에 앉음.
  if (lifeMajors.has('pojun') && (life.branch === '子' || life.branch === '午')) {
    found.push('yingxingRumiao')
  }

  // 칠살조두 — 칠살이 寅·申·子·午 명궁에 앉음.
  if (lifeMajors.has('qisha') && ['寅', '申', '子', '午'].includes(life.branch)) {
    found.push('qishaChaodou')
  }

  // 탐무동행 — 무곡·탐랑이 명궁에 동궁 (丑·未에서만 성립).
  if (lifeMajors.has('wuqu') && lifeMajors.has('tanlang')) {
    found.push('tanwuTongxing')
  }

  // 화탐·영탐 — 탐랑과 화성/영성이 같은 궁에 동궁 (횡발의 상).
  const tanlangPalace = chart.palaces.find((palace) => majorKeys(palace).has('tanlang'))
  if (tanlangPalace) {
    const tanlangStars = allStarKeys(tanlangPalace)
    if (tanlangStars.has('huoxing')) {
      found.push('huoTan')
    }
    if (tanlangStars.has('lingxing')) {
      found.push('lingTan')
    }
  }

  // 살파랑 — 칠살·파군·탐랑이 명궁 삼방사정을 이룸.
  if (hasAll(trinityMajors, ['qisha', 'pojun', 'tanlang'])) {
    found.push('shapolang')
  }

  // 기월동량 — 천기·태음·천동·천량이 명궁 삼방사정에 모두 모임.
  if (hasAll(trinityMajors, ['tianji', 'taiyin', 'tiantong', 'tianliang'])) {
    found.push('jiyueTongliang')
  }

  return found
}
