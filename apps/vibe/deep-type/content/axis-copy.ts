import type { Locale } from '@sobok/domain/locale'

import type { AxisId } from '../model'
import { enAxisContent } from './axes.en'
import { jaAxisContent } from './axes.ja'
import { koAxisContent } from './axes.ko'
import { zhAxisContent } from './axes.zh'
import type { AxisContent } from './axis-content'

// The one axis-copy lookup, read by the result screen and by the paid rule engine.
//
// It lives here rather than in worker/report because the engine is not its only reader, and the arrangement it
// replaces had the direction backwards: `worker/report/axis-copy.ts` imported the four locale modules out of
// `src/app/[locale]/deep-type/_content/`, so a Worker build reached into an App Router private folder. A second
// table is what this prevents — the report calling RM one thing and the axis bar above it calling RM another on
// the same page.
//
// Plain data, not `_lib/content.ts`'s dynamic loader: that module opens with `import 'server-only'` and loads
// asynchronously, which would make the profile builder async for no gain.
export type AxisCopy = Readonly<Record<AxisId, AxisContent>>

const AXIS_COPY_BY_LOCALE = {
  en: enAxisContent,
  ja: jaAxisContent,
  ko: koAxisContent,
  zh: zhAxisContent,
} as const satisfies Record<Locale, AxisCopy>

export function axisCopyFor(locale: Locale): AxisCopy {
  return AXIS_COPY_BY_LOCALE[locale]
}
