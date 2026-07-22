import type { AssessmentProfile } from '@deep-type/model'

import type { ResultForReport } from '../db/queries/result'

export interface ReportProfile {
  assessment: AssessmentProfile
  locale: 'ko' | 'en' | 'ja' | 'zh'
}

export function buildReportProfile(result: ResultForReport): ReportProfile {
  return { assessment: result.profile, locale: result.locale }
}
