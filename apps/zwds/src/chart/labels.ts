// Korean presentation layer over iztro's canonical zh-CN output. iztro is used
// as a data source only — its ko-KR locale is incomplete (brightness falls back
// to raw keys), and the product decision is 한글 우선 + 한자 보조, so every
// user-facing term is owned here. Keys are the simplified-Chinese strings iztro
// emits when the astrolabe is requested with language 'zh-CN'.

import { Locale } from '@sobok/domain/locale'

export type Label = {
  ko: string
  hanja: string
}

/** 한글 우선 + 한자 보조 — ko 로케일만 한글, 나머지는 한자 표기를 쓴다. */
export function pickLabel(label: Label, locale: Locale): string {
  return locale === Locale.KO ? label.ko : label.hanja
}

export const MAJOR_STAR_LABELS: Readonly<Record<string, Label>> = {
  紫微: { ko: '자미', hanja: '紫微' },
  天机: { ko: '천기', hanja: '天機' },
  太阳: { ko: '태양', hanja: '太陽' },
  武曲: { ko: '무곡', hanja: '武曲' },
  天同: { ko: '천동', hanja: '天同' },
  廉贞: { ko: '염정', hanja: '廉貞' },
  天府: { ko: '천부', hanja: '天府' },
  太阴: { ko: '태음', hanja: '太陰' },
  贪狼: { ko: '탐랑', hanja: '貪狼' },
  巨门: { ko: '거문', hanja: '巨門' },
  天相: { ko: '천상', hanja: '天相' },
  天梁: { ko: '천량', hanja: '天梁' },
  七杀: { ko: '칠살', hanja: '七殺' },
  破军: { ko: '파군', hanja: '破軍' },
}

export const MINOR_STAR_LABELS: Readonly<Record<string, Label>> = {
  // 육길성 + 녹존·천마
  左辅: { ko: '좌보', hanja: '左輔' },
  右弼: { ko: '우필', hanja: '右弼' },
  文昌: { ko: '문창', hanja: '文昌' },
  文曲: { ko: '문곡', hanja: '文曲' },
  天魁: { ko: '천괴', hanja: '天魁' },
  天钺: { ko: '천월', hanja: '天鉞' },
  禄存: { ko: '녹존', hanja: '祿存' },
  天马: { ko: '천마', hanja: '天馬' },
  // 육살성
  擎羊: { ko: '경양', hanja: '擎羊' },
  陀罗: { ko: '타라', hanja: '陀羅' },
  火星: { ko: '화성', hanja: '火星' },
  铃星: { ko: '영성', hanja: '鈴星' },
  地空: { ko: '지공', hanja: '地空' },
  地劫: { ko: '지겁', hanja: '地劫' },
}

export const PALACE_LABELS: Readonly<Record<string, Label>> = {
  命宫: { ko: '명궁', hanja: '命宮' },
  兄弟: { ko: '형제궁', hanja: '兄弟宮' },
  夫妻: { ko: '부처궁', hanja: '夫妻宮' },
  子女: { ko: '자녀궁', hanja: '子女宮' },
  财帛: { ko: '재백궁', hanja: '財帛宮' },
  疾厄: { ko: '질액궁', hanja: '疾厄宮' },
  迁移: { ko: '천이궁', hanja: '遷移宮' },
  // iztro의 仆役(노복궁)은 현대 통용 명칭인 교우궁으로 표기한다.
  仆役: { ko: '교우궁', hanja: '交友宮' },
  官禄: { ko: '관록궁', hanja: '官祿宮' },
  田宅: { ko: '전택궁', hanja: '田宅宮' },
  福德: { ko: '복덕궁', hanja: '福德宮' },
  父母: { ko: '부모궁', hanja: '父母宮' },
}

export const BRIGHTNESS_LABELS: Readonly<Record<string, Label>> = {
  庙: { ko: '묘', hanja: '廟' },
  旺: { ko: '왕', hanja: '旺' },
  得: { ko: '득', hanja: '得' },
  利: { ko: '리', hanja: '利' },
  平: { ko: '평', hanja: '平' },
  不: { ko: '불', hanja: '不' },
  陷: { ko: '함', hanja: '陷' },
}

export const MUTAGEN_LABELS: Readonly<Record<string, Label>> = {
  禄: { ko: '화록', hanja: '化祿' },
  权: { ko: '화권', hanja: '化權' },
  科: { ko: '화과', hanja: '化科' },
  忌: { ko: '화기', hanja: '化忌' },
}

export const HEAVENLY_STEM_LABELS: Readonly<Record<string, Label>> = {
  甲: { ko: '갑', hanja: '甲' },
  乙: { ko: '을', hanja: '乙' },
  丙: { ko: '병', hanja: '丙' },
  丁: { ko: '정', hanja: '丁' },
  戊: { ko: '무', hanja: '戊' },
  己: { ko: '기', hanja: '己' },
  庚: { ko: '경', hanja: '庚' },
  辛: { ko: '신', hanja: '辛' },
  壬: { ko: '임', hanja: '壬' },
  癸: { ko: '계', hanja: '癸' },
}

export const EARTHLY_BRANCH_LABELS: Readonly<Record<string, Label>> = {
  子: { ko: '자', hanja: '子' },
  丑: { ko: '축', hanja: '丑' },
  寅: { ko: '인', hanja: '寅' },
  卯: { ko: '묘', hanja: '卯' },
  辰: { ko: '진', hanja: '辰' },
  巳: { ko: '사', hanja: '巳' },
  午: { ko: '오', hanja: '午' },
  未: { ko: '미', hanja: '未' },
  申: { ko: '신', hanja: '申' },
  酉: { ko: '유', hanja: '酉' },
  戌: { ko: '술', hanja: '戌' },
  亥: { ko: '해', hanja: '亥' },
}

export const FIVE_ELEMENTS_CLASS_LABELS: Readonly<Record<string, Label>> = {
  水二局: { ko: '수이국', hanja: '水二局' },
  木三局: { ko: '목삼국', hanja: '木三局' },
  金四局: { ko: '금사국', hanja: '金四局' },
  土五局: { ko: '토오국', hanja: '土五局' },
  火六局: { ko: '화육국', hanja: '火六局' },
}

/**
 * Canonical-key lookup that survives an iztro output drift: an unmapped key is
 * shown as-is (한자 그대로) instead of crashing the chart, and reported in dev.
 */
export function toLabel(table: Readonly<Record<string, Label>>, canonical: string): Label {
  const label = table[canonical]

  if (label) {
    return label
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[zwds] unmapped canonical label: ${canonical}`)
  }

  return { ko: canonical, hanja: canonical }
}
