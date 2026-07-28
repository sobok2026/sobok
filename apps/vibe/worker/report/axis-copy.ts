import type { AxisId } from '@deep-type/model'

import { deepTypeContent as enContent } from '../../src/app/[locale]/deep-type/_content/en'
import { deepTypeContent as jaContent } from '../../src/app/[locale]/deep-type/_content/ja'
import { deepTypeContent as koContent } from '../../src/app/[locale]/deep-type/_content/ko'
import { deepTypeContent as zhContent } from '../../src/app/[locale]/deep-type/_content/zh'
import type { AxisContent } from '../../src/app/[locale]/deep-type/_lib/types'

// Axis names and pole labels are read out of the locale content the result screen already renders. A second
// table would let the report call RM one thing and the axis bar above it call RM another on the same page.
// `_lib/content.ts` is not reused: it opens with `import 'server-only'` and loads dynamically, which would make
// the profile builder async for no gain. These four modules are plain data.

export type ReportLocale = 'en' | 'ja' | 'ko' | 'zh'

export type AxisCopy = Readonly<Record<AxisId, AxisContent>>

export const AXIS_COPY_BY_LOCALE = {
  en: enContent.axes,
  ja: jaContent.axes,
  ko: koContent.axes,
  zh: zhContent.axes,
} as const satisfies Record<ReportLocale, AxisCopy>

export function axisCopyFor(locale: ReportLocale): AxisCopy {
  return AXIS_COPY_BY_LOCALE[locale]
}
