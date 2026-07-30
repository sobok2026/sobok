// Localized presentation layer over iztro's canonical zh-CN output. iztro is
// used as a data source only, so every user-facing term remains owned here.
// Keys are the simplified-Chinese strings iztro emits when the astrolabe is
// requested with language 'zh-CN'.

import type { Locale } from '@sobok/domain/locale'

export type Label = Readonly<Record<Locale, string>>

export function pickLabel(label: Label, locale: Locale): string {
  return label[locale]
}

function label(ko: string, en: string, zh: string, ja: string): Label {
  return {
    ko: ko,
    en: en,
    zh: zh,
    ja: ja,
  }
}

export const MAJOR_STAR_LABELS: Readonly<Record<string, Label>> = {
  紫微: label('자미', '紫微', '紫微', '紫微'),
  天机: label('천기', '天機', '天机', '天機'),
  太阳: label('태양', '太陽', '太阳', '太陽'),
  武曲: label('무곡', '武曲', '武曲', '武曲'),
  天同: label('천동', '天同', '天同', '天同'),
  廉贞: label('염정', '廉貞', '廉贞', '廉貞'),
  天府: label('천부', '天府', '天府', '天府'),
  太阴: label('태음', '太陰', '太阴', '太陰'),
  贪狼: label('탐랑', '貪狼', '贪狼', '貪狼'),
  巨门: label('거문', '巨門', '巨门', '巨門'),
  天相: label('천상', '天相', '天相', '天相'),
  天梁: label('천량', '天梁', '天梁', '天梁'),
  七杀: label('칠살', '七殺', '七杀', '七殺'),
  破军: label('파군', '破軍', '破军', '破軍'),
}

export const MINOR_STAR_LABELS: Readonly<Record<string, Label>> = {
  // 육길성 + 녹존·천마
  左辅: label('좌보', '左輔', '左辅', '左輔'),
  右弼: label('우필', '右弼', '右弼', '右弼'),
  文昌: label('문창', '文昌', '文昌', '文昌'),
  文曲: label('문곡', '文曲', '文曲', '文曲'),
  天魁: label('천괴', '天魁', '天魁', '天魁'),
  天钺: label('천월', '天鉞', '天钺', '天鉞'),
  禄存: label('녹존', '祿存', '禄存', '禄存'),
  天马: label('천마', '天馬', '天马', '天馬'),
  // 육살성
  擎羊: label('경양', '擎羊', '擎羊', '擎羊'),
  陀罗: label('타라', '陀羅', '陀罗', '陀羅'),
  火星: label('화성', '火星', '火星', '火星'),
  铃星: label('영성', '鈴星', '铃星', '鈴星'),
  地空: label('지공', '地空', '地空', '地空'),
  地劫: label('지겁', '地劫', '地劫', '地劫'),
}

export const PALACE_LABELS: Readonly<Record<string, Label>> = {
  命宫: label('명궁', '命宮', '命宫', '命宮'),
  兄弟: label('형제궁', '兄弟宮', '兄弟宫', '兄弟宮'),
  夫妻: label('부처궁', '夫妻宮', '夫妻宫', '夫妻宮'),
  子女: label('자녀궁', '子女宮', '子女宫', '子女宮'),
  财帛: label('재백궁', '財帛宮', '财帛宫', '財帛宮'),
  疾厄: label('질액궁', '疾厄宮', '疾厄宫', '疾厄宮'),
  迁移: label('천이궁', '遷移宮', '迁移宫', '遷移宮'),
  // iztro의 仆役(노복궁)은 현대 통용 명칭인 교우궁으로 표기한다.
  仆役: label('교우궁', '交友宮', '交友宫', '交友宮'),
  官禄: label('관록궁', '官祿宮', '官禄宫', '官禄宮'),
  田宅: label('전택궁', '田宅宮', '田宅宫', '田宅宮'),
  福德: label('복덕궁', '福德宮', '福德宫', '福徳宮'),
  父母: label('부모궁', '父母宮', '父母宫', '父母宮'),
}

export const BRIGHTNESS_LABELS: Readonly<Record<string, Label>> = {
  庙: label('묘', '廟', '庙', '廟'),
  旺: label('왕', '旺', '旺', '旺'),
  得: label('득', '得', '得', '得'),
  利: label('리', '利', '利', '利'),
  平: label('평', '平', '平', '平'),
  不: label('불', '不', '不', '不'),
  陷: label('함', '陷', '陷', '陥'),
}

export const MUTAGEN_LABELS: Readonly<Record<string, Label>> = {
  禄: label('화록', '化祿', '化禄', '化禄'),
  权: label('화권', '化權', '化权', '化権'),
  科: label('화과', '化科', '化科', '化科'),
  忌: label('화기', '化忌', '化忌', '化忌'),
}

export const HEAVENLY_STEM_LABELS: Readonly<Record<string, Label>> = {
  甲: label('갑', '甲', '甲', '甲'),
  乙: label('을', '乙', '乙', '乙'),
  丙: label('병', '丙', '丙', '丙'),
  丁: label('정', '丁', '丁', '丁'),
  戊: label('무', '戊', '戊', '戊'),
  己: label('기', '己', '己', '己'),
  庚: label('경', '庚', '庚', '庚'),
  辛: label('신', '辛', '辛', '辛'),
  壬: label('임', '壬', '壬', '壬'),
  癸: label('계', '癸', '癸', '癸'),
}

export const EARTHLY_BRANCH_LABELS: Readonly<Record<string, Label>> = {
  子: label('자', '子', '子', '子'),
  丑: label('축', '丑', '丑', '丑'),
  寅: label('인', '寅', '寅', '寅'),
  卯: label('묘', '卯', '卯', '卯'),
  辰: label('진', '辰', '辰', '辰'),
  巳: label('사', '巳', '巳', '巳'),
  午: label('오', '午', '午', '午'),
  未: label('미', '未', '未', '未'),
  申: label('신', '申', '申', '申'),
  酉: label('유', '酉', '酉', '酉'),
  戌: label('술', '戌', '戌', '戌'),
  亥: label('해', '亥', '亥', '亥'),
}

export const FIVE_ELEMENTS_CLASS_LABELS: Readonly<Record<string, Label>> = {
  水二局: label('수이국', '水二局', '水二局', '水二局'),
  木三局: label('목삼국', '木三局', '木三局', '木三局'),
  金四局: label('금사국', '金四局', '金四局', '金四局'),
  土五局: label('토오국', '土五局', '土五局', '土五局'),
  火六局: label('화육국', '火六局', '火六局', '火六局'),
}

/**
 * Canonical-key lookup that survives an iztro output drift: an unmapped key is
 * shown as-is (한자 그대로) instead of crashing the chart, and reported in dev.
 */
export function toLabel(table: Readonly<Record<string, Label>>, canonical: string): Label {
  const localized = table[canonical]

  if (localized) {
    return localized
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[zwds] unmapped canonical label: ${canonical}`)
  }

  return label(canonical, canonical, canonical, canonical)
}
