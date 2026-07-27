import { REPORT_SECTION_KEYS, type ReportSection, type ReportSectionKey } from '../db/schema'
import type { ReportProfile } from './profile'

const TITLES: Record<ReportProfile['locale'], Record<ReportSectionKey, string>> = {
  ko: {
    summary: '세 층의 한눈 요약',
    contextShift: '상황에 따른 표현 변화',
    selfWorth: '자가치의 기준',
    relationships: '연결과 자율',
    emotionRegulation: '감정 반응과 처리',
    motivation: '목표를 움직이는 초점',
    workStyle: '선호하는 일의 조건',
    recovery: '회복 신호',
    strengths: '조건에 따라 살아나는 강점',
    friction: '함께 살펴볼 마찰 지점',
    reflectionQuestions: '스스로에게 던질 질문',
    nextSteps: '작게 시도할 다음 단계',
  },
  en: {
    summary: 'Your three layers at a glance',
    contextShift: 'Expression across contexts',
    selfWorth: 'Basis of self-worth',
    relationships: 'Connection and autonomy',
    emotionRegulation: 'Emotional response and processing',
    motivation: 'What moves your goals',
    workStyle: 'Preferred working conditions',
    recovery: 'Recovery cues',
    strengths: 'Strengths that emerge by context',
    friction: 'Trade-offs to observe',
    reflectionQuestions: 'Questions for reflection',
    nextSteps: 'Small next experiments',
  },
  ja: {
    summary: '3つの層の要約',
    contextShift: '状況による表現の変化',
    selfWorth: '自己価値の基準',
    relationships: 'つながりと自律',
    emotionRegulation: '感情反応と処理',
    motivation: '目標を動かす焦点',
    workStyle: '好みやすい仕事の条件',
    recovery: '回復のサイン',
    strengths: '状況で表れる強み',
    friction: '観察したいトレードオフ',
    reflectionQuestions: '振り返りの問い',
    nextSteps: '小さく試す次の一歩',
  },
  zh: {
    summary: '三个层面的概览',
    contextShift: '不同情境中的表达变化',
    selfWorth: '自我价值依据',
    relationships: '连接与自主',
    emotionRegulation: '情绪反应与处理',
    motivation: '推动目标的焦点',
    workStyle: '偏好的工作条件',
    recovery: '恢复信号',
    strengths: '随情境显现的优势',
    friction: '值得观察的取舍',
    reflectionQuestions: '反思问题',
    nextSteps: '可以小步尝试的下一步',
  },
}

const SAMPLE_BODY: Record<ReportProfile['locale'], (codes: string) => string> = {
  ko: (codes) =>
    `[샘플 모드] ${codes}의 연속 점수를 바탕으로 작성될 섹션입니다. 실제 운영에서는 응답이 보여 주는 관찰과 더 살펴볼 가설을 구분해 제공합니다.`,
  en: (codes) =>
    `[Sample mode] This section will be based on the continuous scores for ${codes}. In production, it separates observations supported by responses from hypotheses to explore.`,
  ja: (codes) =>
    `[サンプルモード] ${codes}の連続スコアを基に作成されるセクションです。本番では、回答が示す観察と検討する仮説を分けて提示します。`,
  zh: (codes) =>
    `[示例模式] 本章节将依据${codes}的连续分数生成。正式环境会区分回答所支持的观察与需要进一步探索的假设。`,
}

export function buildSampleReport(profile: ReportProfile): ReportSection[] {
  const assessment = profile.assessment
  const codes = `${assessment.inner.code} · ${assessment.gem.code}`
  return REPORT_SECTION_KEYS.map((key) => ({
    body: SAMPLE_BODY[profile.locale](codes),
    key,
    title: TITLES[profile.locale][key],
  }))
}
