import { REPORT_SECTION_KEYS, type ReportSection, type ReportSectionKey } from '../db/schema'
import type { ReportProfile } from './profile'

// Section titles mirror the 12-section intents in prompt.ts. Used only for the sample fallback.
const SAMPLE_TITLES: Record<ReportSectionKey, string> = {
  summary: '지금의 당신',
  gap: '겉과 속의 간극',
  abyss: '마음속 결핍',
  love: '연애와 관계',
  work: '일과 방향',
  money: '돈을 대하는 습관',
  growthStory: '지금까지의 성장 서사',
  energy: '몸과 에너지',
  relationCaution: '관계에서 주의할 것',
  flow: '다가올 흐름',
  match: '잘 맞는 사람',
  thisWeek: '이번 주의 실행',
}

// Deterministic placeholder감정서 used when the LLM is disabled (DEEPTYPE_LLM_ENABLED != '1'). Lets the full
// paid flow render end-to-end without calling Anthropic / spending budget. Clearly labeled a 미리보기 so it
// can never be mistaken for the real report — NOT for production delivery (prod runs with the LLM enabled).
export function buildSampleReport(profile: ReportProfile): ReportSection[] {
  const code = [profile.persona, profile.inner, profile.gem].filter(Boolean).join(' · ') || '측정된 유형'
  return REPORT_SECTION_KEYS.map((key) => ({
    key,
    title: SAMPLE_TITLES[key],
    body: `[샘플 미리보기] "${SAMPLE_TITLES[key]}" 섹션입니다. 실제 감정서에서는 당신의 유형(${code})을 바탕으로 이 자리에 심층 해석이 들어갑니다. 지금은 LLM이 꺼진 미리보기라 예시 문구가 표시됩니다.`,
  }))
}
