// Signature scoring — mirrors stella's pattern (enumerate discrete features →
// weight table → sort desc → floor → top N) with ZWDS-native axes: stella's
// continuous orb-tightness has no analog here, so weight comes from brightness
// ordinals, 사화 kind and palace prominence instead.

import type { PatternKey } from '@/content/interpretations/types'

import type { BrightnessKey, MajorStarKey, MutagenKey, PalaceKey, StarKey } from './keys'
import type { Label } from './labels'
import { findPatterns, lifePalace } from './patterns'
import type { ZwdsChart } from './types'

export type SignatureFeature =
  | {
      kind: 'emptyLife'
      score: number
    }
  | {
      kind: 'mutagen'
      mutagen: MutagenKey
      mutagenLabel: Label
      star: StarKey
      starLabel: Label
      palace: PalaceKey | null
      palaceName: Label
      score: number
    }
  | {
      kind: 'palaceStar'
      star: MajorStarKey
      starLabel: Label
      palace: PalaceKey
      palaceName: Label
      brightness: BrightnessKey
      score: number
    }
  | {
      kind: 'pattern'
      pattern: PatternKey
      score: number
    }

/**
 * 격국 base scores — the 55–75 band keeps a detected 격국 headlining over
 * everything except a perfectly-placed 사화, matching how 상용 서비스 lead
 * with the rare structural signature.
 */
const PATTERN_SCORES: Readonly<Record<PatternKey, number>> = {
  sanqiJiahui: 74,
  junchenQinghui: 70,
  changquJiaming: 68,
  kuiyueJiaming: 68,
  zifuTonggong: 66,
  yuelangTianmen: 66,
  rizhaoLeimen: 66,
  shuangluChaoyuan: 64,
  lumaJiaochi: 63,
  fuxiangChaoyuan: 62,
  riyueTonggong: 62,
  yingxingRumiao: 62,
  huoTan: 61,
  shapolang: 60,
  jiyueTongliang: 60,
  qishaChaodou: 60,
  lingTan: 59,
  tanwuTongxing: 58,
}

/** 생년 사화의 기본 무게 — 화기는 긴장 신호라서 화록과 나란히 크게 읽는다. */
const MUTAGEN_BASE_SCORES: Readonly<Record<MutagenKey, number>> = {
  lu: 40,
  ji: 42,
  quan: 34,
  ke: 30,
}

/** 사화·주성이 앉은 궁의 존재감 가중치. */
const PALACE_WEIGHTS: Partial<Record<PalaceKey, number>> = {
  life: 14,
  travel: 8,
  career: 8,
  wealth: 8,
  spouse: 8,
  wellbeing: 6,
}

const BRIGHT_BONUS: Partial<Record<BrightnessKey, number>> = {
  miao: 10,
  wang: 6,
}

export const SIGNATURE_FLOOR = 40
export const SIGNATURE_COUNT = 3

export function computeSignature(chart: ZwdsChart): SignatureFeature[] {
  const features: SignatureFeature[] = []

  for (const pattern of findPatterns(chart)) {
    features.push({ kind: 'pattern', pattern, score: PATTERN_SCORES[pattern] })
  }

  for (const palace of chart.palaces) {
    for (const star of [...palace.majorStars, ...palace.luckyStars]) {
      if (!star.mutagenKey || !star.key || !star.mutagen) {
        continue
      }

      let score = MUTAGEN_BASE_SCORES[star.mutagenKey] + (palace.key ? (PALACE_WEIGHTS[palace.key] ?? 0) : 0)
      if (palace.isBodyPalace) {
        score += 6
      }
      if (star.brightnessKey) {
        score += (BRIGHT_BONUS[star.brightnessKey] ?? 0) / 2
      }
      if (star.mutagenKey === 'ji' && (palace.key === 'life' || palace.key === 'travel')) {
        score += 6
      }

      features.push({
        kind: 'mutagen',
        mutagen: star.mutagenKey,
        mutagenLabel: star.mutagen,
        star: star.key,
        starLabel: star.label,
        palace: palace.key,
        palaceName: palace.name,
        score,
      })
    }
  }

  // 명궁 밖 요처(천이·관록·재백·부처·복덕)에서 묘·왕으로 빛나는 주성.
  for (const palace of chart.palaces) {
    if (!palace.key || palace.key === 'life' || !(palace.key in PALACE_WEIGHTS)) {
      continue
    }

    for (const star of palace.majorStars) {
      if (!star.key || !star.brightnessKey || !(star.brightnessKey in BRIGHT_BONUS)) {
        continue
      }

      features.push({
        kind: 'palaceStar',
        star: star.key,
        starLabel: star.label,
        palace: palace.key,
        palaceName: palace.name,
        brightness: star.brightnessKey,
        score: 30 + (PALACE_WEIGHTS[palace.key] ?? 0) + (BRIGHT_BONUS[star.brightnessKey] ?? 0),
      })
    }
  }

  const life = lifePalace(chart)
  if (life && life.majorStars.length === 0) {
    features.push({ kind: 'emptyLife', score: 44 })
  }

  return features.sort((a, b) => b.score - a.score)
}
