// Canonical star/palace identity layer. labels.ts owns how a term is *shown*;
// this module owns how a term is *keyed* so content tables and scoring stay
// stable even if presentation copy changes. Keys are pinyin-romanized for stars
// (the de-facto convention across ZWDS libraries) and semantic English for
// palaces. Lookup keys are the simplified-Chinese strings iztro emits with
// language 'zh-CN'.

export const MAJOR_STAR_KEYS = [
  'ziwei',
  'tianji',
  'taiyang',
  'wuqu',
  'tiantong',
  'lianzhen',
  'tianfu',
  'taiyin',
  'tanlang',
  'jumen',
  'tianxiang',
  'tianliang',
  'qisha',
  'pojun',
] as const

export type MajorStarKey = (typeof MAJOR_STAR_KEYS)[number]

/** 육길성 + 녹존·천마 */
export type SoftStarKey = 'lucun' | 'tiankui' | 'tianma' | 'tianyue' | 'wenchang' | 'wenqu' | 'youbi' | 'zuofu'

/** 육살성 */
export type ToughStarKey = 'dijie' | 'dikong' | 'huoxing' | 'lingxing' | 'qingyang' | 'tuoluo'

export type StarKey = MajorStarKey | SoftStarKey | ToughStarKey

export const PALACE_KEYS = [
  'life',
  'siblings',
  'spouse',
  'children',
  'wealth',
  'health',
  'travel',
  'friends',
  'career',
  'property',
  'wellbeing',
  'parents',
] as const

export type PalaceKey = (typeof PALACE_KEYS)[number]

export type BrightnessKey = 'bu' | 'de' | 'li' | 'miao' | 'ping' | 'wang' | 'xian'

export type MutagenKey = 'ji' | 'ke' | 'lu' | 'quan'

export type FiveElementsKey = 'earth5' | 'fire6' | 'metal4' | 'water2' | 'wood3'

const MAJOR_STAR_KEY_TABLE: Readonly<Record<string, MajorStarKey>> = {
  紫微: 'ziwei',
  天机: 'tianji',
  太阳: 'taiyang',
  武曲: 'wuqu',
  天同: 'tiantong',
  廉贞: 'lianzhen',
  天府: 'tianfu',
  太阴: 'taiyin',
  贪狼: 'tanlang',
  巨门: 'jumen',
  天相: 'tianxiang',
  天梁: 'tianliang',
  七杀: 'qisha',
  破军: 'pojun',
}

const MINOR_STAR_KEY_TABLE: Readonly<Record<string, SoftStarKey | ToughStarKey>> = {
  左辅: 'zuofu',
  右弼: 'youbi',
  文昌: 'wenchang',
  文曲: 'wenqu',
  天魁: 'tiankui',
  天钺: 'tianyue',
  禄存: 'lucun',
  天马: 'tianma',
  擎羊: 'qingyang',
  陀罗: 'tuoluo',
  火星: 'huoxing',
  铃星: 'lingxing',
  地空: 'dikong',
  地劫: 'dijie',
}

const PALACE_KEY_TABLE: Readonly<Record<string, PalaceKey>> = {
  命宫: 'life',
  兄弟: 'siblings',
  夫妻: 'spouse',
  子女: 'children',
  财帛: 'wealth',
  疾厄: 'health',
  迁移: 'travel',
  仆役: 'friends',
  官禄: 'career',
  田宅: 'property',
  福德: 'wellbeing',
  父母: 'parents',
}

const BRIGHTNESS_KEY_TABLE: Readonly<Record<string, BrightnessKey>> = {
  庙: 'miao',
  旺: 'wang',
  得: 'de',
  利: 'li',
  平: 'ping',
  不: 'bu',
  陷: 'xian',
}

const MUTAGEN_KEY_TABLE: Readonly<Record<string, MutagenKey>> = {
  禄: 'lu',
  权: 'quan',
  科: 'ke',
  忌: 'ji',
}

const FIVE_ELEMENTS_KEY_TABLE: Readonly<Record<string, FiveElementsKey>> = {
  水二局: 'water2',
  木三局: 'wood3',
  金四局: 'metal4',
  土五局: 'earth5',
  火六局: 'fire6',
}

function toKey<K extends string>(table: Readonly<Record<string, K>>, canonical: string): K | null {
  const key = table[canonical]

  if (key) {
    return key
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[zwds] unmapped canonical key: ${canonical}`)
  }

  return null
}

export function toMajorStarKey(canonical: string): MajorStarKey | null {
  return toKey(MAJOR_STAR_KEY_TABLE, canonical)
}

export function toMinorStarKey(canonical: string): SoftStarKey | ToughStarKey | null {
  return toKey(MINOR_STAR_KEY_TABLE, canonical)
}

export function toPalaceKey(canonical: string): PalaceKey | null {
  return toKey(PALACE_KEY_TABLE, canonical)
}

export function toBrightnessKey(canonical: string): BrightnessKey | null {
  return toKey(BRIGHTNESS_KEY_TABLE, canonical)
}

export function toMutagenKey(canonical: string): MutagenKey | null {
  return toKey(MUTAGEN_KEY_TABLE, canonical)
}

export function toFiveElementsKey(canonical: string): FiveElementsKey | null {
  return toKey(FIVE_ELEMENTS_KEY_TABLE, canonical)
}
