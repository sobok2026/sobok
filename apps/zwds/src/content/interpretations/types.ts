// Shared types + helpers for the per-locale reading modules, mirroring
// apps/stella/src/content/interpretations/types.ts. Data files stay pure string
// tables; ko is canonical and en/ja/zh keep the identical key structure with
// empty strings until translated — the composer skips falsy text, so a locale
// without copy simply renders no reading.

import type { FiveElementsKey, MajorStarKey, MutagenKey, PalaceKey } from '@/chart/keys'

/**
 * The atomic reading unit: one major star seated in one palace. The palace is
 * the "where in life", the star is the "how" — the pair collapses stella's
 * sign×house double axis into a single 14×12 table.
 */
export type StarPalaceReadings = Record<MajorStarKey, Record<PalaceKey, string>>

/**
 * 생년 사화 copy, keyed by which star carries the transformation. Only the
 * (mutagen, star) pairs the ten heavenly stems can actually produce exist —
 * e.g. 화록 never lands on 자미, so `lu.ziwei` is absent by design.
 */
export type MutagenStarKey = MajorStarKey | 'wenchang' | 'wenqu' | 'youbi' | 'zuofu'
export type MutagenReadings = Record<MutagenKey, Partial<Record<MutagenStarKey, string>>>

/** 공궁 — no major star in the palace; the reading covers the 차성안궁 borrowing stance. */
export type EmptyPalaceReadings = Record<PalaceKey, string>

/** Deterministically detectable 격국. Detection rules live in chart/patterns.ts. */
export const PATTERN_KEYS = [
  'changquJiaming',
  'fuxiangChaoyuan',
  'huoTan',
  'jiyueTongliang',
  'junchenQinghui',
  'kuiyueJiaming',
  'lingTan',
  'lumaJiaochi',
  'qishaChaodou',
  'riyueTonggong',
  'rizhaoLeimen',
  'sanqiJiahui',
  'shapolang',
  'shuangluChaoyuan',
  'tanwuTongxing',
  'yingxingRumiao',
  'yuelangTianmen',
  'zifuTonggong',
] as const

export type PatternKey = (typeof PATTERN_KEYS)[number]

export type PatternReadings = Record<PatternKey, string>

/**
 * 십천간이 실제로 만들 수 있는 (사화, 별) 조합 — iztro heavenlyStems 표 기준.
 * 콘텐츠 테이블은 이 조합만 채운다.
 */
export const MUTAGEN_STAR_KEYS: Readonly<Record<MutagenKey, readonly MutagenStarKey[]>> = {
  lu: ['lianzhen', 'tianji', 'tiantong', 'taiyin', 'tanlang', 'wuqu', 'taiyang', 'jumen', 'tianliang', 'pojun'],
  quan: ['pojun', 'tianliang', 'tianji', 'tiantong', 'taiyin', 'tanlang', 'wuqu', 'taiyang', 'ziwei', 'jumen'],
  ke: ['wuqu', 'ziwei', 'wenchang', 'tianji', 'youbi', 'tianliang', 'taiyin', 'wenqu', 'zuofu'],
  ji: ['taiyang', 'taiyin', 'lianzhen', 'jumen', 'tianji', 'wenqu', 'tiantong', 'wenchang', 'wuqu', 'tanlang'],
}

/** 안신 규칙이 신궁을 앉힐 수 있는 여섯 자리. */
export const BODY_PALACE_KEYS = ['life', 'spouse', 'wealth', 'travel', 'career', 'wellbeing'] as const

export type ReportChapterId =
  | 'closing'
  | 'core'
  | 'family'
  | 'health'
  | 'love'
  | 'mind'
  | 'money'
  | 'path'
  | 'people'
  | 'signature'
  | 'work'

/**
 * Paragraph-level kicker templates. `{star}`, `{palace}`, `{mutagen}` are
 * filled with Korean-first labels from chart/labels.ts.
 */
export type ReportKicker = {
  lifeStar: string
  bodyPalace: string
  mutagen: string
  pattern: string
  palaceStar: string
  borrowed: string
  decade: string
  fiveElements: string
  /** 공궁 문단 키커 — `{palace}` 채움. */
  empty: string
}

/**
 * Scaffolding for the composed long-form reading — chapter titles, kickers,
 * bridges and note lines. Fragment tables above stay the raw material.
 */
export type ReportContent = {
  title: string
  subtitle: string
  chapterTitles: Record<ReportChapterId, string>
  signatureIntro: string
  kicker: ReportKicker
  /** 격국 표시 이름 — kicker에 들어가는 짧은 명칭. */
  patternNames: Record<PatternKey, string>
  /** 신궁 seat — iztro's 안신 rule only ever places it on these six palaces (or 명궁). */
  bodyPalace: Partial<Record<PalaceKey, string>>
  /** 오행국이 말하는 그릇·속도 — core chapter bridge material. */
  fiveElements: Record<FiveElementsKey, string>
  /** 밝기 강조·완충 note lines: `{star}` filled. */
  brightness: { strong: string; weak: string }
  /** 길성·살성 동반 note lines: `{stars}` filled with a joined list. */
  companions: { lucky: string; unlucky: string }
  /** 생년 사화가 궁에 앉을 때 붙는 짧은 문맥 노트. */
  mutagenNotes: Record<MutagenKey, string>
  core: { bridge: string }
  /** 차성안궁 — 공궁이 대궁 별을 빌려 읽힐 때 앞에 붙는 안내. */
  borrowedNote: string
  path: { intro: string; empty: string }
  health: { disclaimer: string }
  closing: { outro: string }
}

/** Everything one locale's reading chunk carries, as `loadInterpretations` returns it. */
export type Interpretations = {
  stars: StarPalaceReadings
  mutagens: MutagenReadings
  emptyPalace: EmptyPalaceReadings
  patterns: PatternReadings
  report: ReportContent
}

/** Replaces `{key}` placeholders in reading copy — plain templates, not ICU. */
export function fill(template: string, params: Record<string, number | string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match))
}
