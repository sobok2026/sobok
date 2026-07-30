import { Locale } from '@sobok/domain/locale'

export type NavItem = {
  // Path segment after the locale, e.g. 'couple-gyeol' → /{locale}/couple-gyeol.
  segment: string
  label: string
}

/**
 * The path under the locale, so a rule can be written once instead of four times: '/ko/couple-type/quiz' →
 * 'couple-type/quiz', and '/ko' → ''. `output: 'export'` runs without a trailing slash, so there is no empty
 * last segment to strip.
 */
function surfacePath(pathname: string) {
  return pathname.split('/').slice(2).join('/')
}

/**
 * Screens the visitor is *inside* rather than browsing: unanswered questions they have already paid attention
 * to, or a payment mid-flight. Global navigation steps aside on all of them.
 *
 * This is the platform rule rather than a preference. A linear task is a modal presentation on iOS and a
 * full-screen dialog on Android, and both cover the tab bar for the same reason — one thumb-width below the
 * answer buttons sits a link to a sibling quiz, and the run it abandons cannot be recovered by going back.
 * WCAG 2.4.5 exempts 'a step in a process' from needing more than one way to be reached, so removing the bar
 * here is what the standard allows rather than something it tolerates. The escape hatches that stay are the
 * header logo and the flow's own back control.
 *
 * `deep-type/result` is listed because most of what it renders is a step — the paywall, the refinement run,
 * the paid report. The one phase that is not (the free result) opts back in from the screen itself; see
 * `useFlowFocusOverride`.
 */
const FOCUSED_FLOWS: ReadonlySet<string> = new Set([
  'couple-gyeol/quiz',
  'couple-type/quiz',
  'deep-type/test',
  'deep-type/result',
  'deep-type/checkout-return',
  'deep-type/reopen',
])

export function isFocusedFlow(pathname: string) {
  return FOCUSED_FLOWS.has(surfacePath(pathname))
}

/**
 * Routes that own the bottom edge themselves.
 *
 * The deep-type landing is an ad destination with its own persistent CTA. Two floating layers there put ~17% of
 * a phone viewport under permanent chrome and stack two thumb-zone targets with different destinations, and the
 * one that wins the tap is the one that leaks the visitor to a sibling quiz. Unlike a focused flow this is not
 * a step in a process, so it keeps the header navigation it has at `sm` and up; on a phone the logo is the only
 * way out, which is the accepted cost of converting a paid click.
 */
const OWNS_BOTTOM_EDGE: ReadonlySet<string> = new Set(['deep-type'])

export function ownsBottomEdge(pathname: string) {
  return OWNS_BOTTOM_EDGE.has(surfacePath(pathname))
}

export const PRIMARY_NAV = {
  [Locale.KO]: [
    { segment: 'couple-gyeol', label: '결지수' },
    { segment: 'couple-type', label: '대화유형' },
    { segment: 'deep-type', label: '겉속유형' },
  ],
  [Locale.EN]: [
    { segment: 'couple-gyeol', label: 'Compatibility' },
    { segment: 'couple-type', label: 'Talk Type' },
    { segment: 'deep-type', label: 'DeepType' },
  ],
  [Locale.JA]: [
    { segment: 'couple-gyeol', label: '相性スコア' },
    { segment: 'couple-type', label: '会話タイプ' },
    { segment: 'deep-type', label: 'DeepType' },
  ],
  [Locale.ZH]: [
    { segment: 'couple-gyeol', label: '默契指数' },
    { segment: 'couple-type', label: '对话类型' },
    { segment: 'deep-type', label: 'DeepType' },
  ],
} satisfies Record<Locale, NavItem[]>
