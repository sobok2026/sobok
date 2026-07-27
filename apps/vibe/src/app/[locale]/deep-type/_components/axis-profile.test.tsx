import { describe, expect, test } from 'bun:test'
import { type FreeAxisScore, type RefinedAxisScore, TYPE_AXES, type TypeAxisId } from '@deep-type/model'
import { renderToStaticMarkup } from 'react-dom/server'

import { deepTypeContent as ko } from '../_content/ko'
import { AxisProfile } from './axis-profile'

// Static markup rather than a DOM: the component is a pure projection of a score record, and the assertion is
// about which sentences reach the page.
function markup(element: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(element)
}

const BASE = {
  answered: 5,
  firstShare: 40,
  lean: -0.2,
  pole: 'E',
  score: -3,
  secondShare: 60,
} as const

function refined(overrides: Partial<RefinedAxisScore>): RefinedAxisScore {
  return { ...BASE, band3: 'moderate3', band5: 'faint', evidenceSplit: false, shift: 'down', ...overrides }
}

function refinedAxes(overrides: Partial<Record<TypeAxisId, Partial<RefinedAxisScore>>>) {
  return Object.fromEntries(TYPE_AXES.map((axis) => [axis, refined(overrides[axis] ?? {})])) as Record<
    TypeAxisId,
    RefinedAxisScore
  >
}

const FREE_AXES = Object.fromEntries(
  TYPE_AXES.map((axis) => [axis, { ...BASE, answered: 3, band3: 'moderate3' } satisfies FreeAxisScore]),
) as Record<TypeAxisId, FreeAxisScore>

describe('axis profile split notice', () => {
  // The bar is drawn from the cumulative `firstShare` while `pole` is frozen at the free pass, so on a split
  // axis the two point opposite ways on purpose. Showing the cumulative evidence is the honest half; naming the
  // disagreement is the other half, and it must not be droppable.
  test('names the split on every axis whose added items lean against the frozen letter', () => {
    const html = markup(
      <AxisProfile
        axisIds={TYPE_AXES}
        content={ko}
        scores={refinedAxes({ EI: { evidenceSplit: true }, TF: { evidenceSplit: true } })}
        splitNotice={ko.ui.evidenceSplitNote}
        title="t"
      />,
    )
    const occurrences = html.split(ko.ui.evidenceSplitNote).length - 1
    expect(occurrences).toBe(2)
  })

  test('stays silent when the added items agree', () => {
    const html = markup(
      <AxisProfile
        axisIds={TYPE_AXES}
        content={ko}
        scores={refinedAxes({})}
        splitNotice={ko.ui.evidenceSplitNote}
        title="t"
      />,
    )
    expect(html).not.toContain(ko.ui.evidenceSplitNote)
  })

  // The free tier has no fifth item and therefore no split to report. It also must not be able to pass the
  // sentence: `splitNotice?: never` on that member of the props union is what stops a free screen from quoting
  // paid wording, the same rule §8.2 enforces for the band labels.
  test('renders the free tier without the notice', () => {
    const html = markup(<AxisProfile axisIds={TYPE_AXES} content={ko} scores={FREE_AXES} title="t" />)
    expect(html).not.toContain(ko.ui.evidenceSplitNote)
    expect(html).toContain(ko.ui.clarityLabel)
  })

  // The requirement above rests entirely on `evidenceSplit?: never` narrowing the free member of the props
  // union: a RefinedAxisScore is structurally a FreeAxisScore, so without that key the refined call matches the
  // free member and `splitNotice` silently becomes optional. Deleting one line would undo the guard with every
  // test still green, so the guard is asserted at the type level too — this stops compiling if it comes back.
  test('requires the notice whenever the scores are refined', () => {
    // @ts-expect-error splitNotice is mandatory for refined scores
    const html = markup(<AxisProfile axisIds={TYPE_AXES} content={ko} scores={refinedAxes({})} title="t" />)
    expect(html).not.toContain(ko.ui.evidenceSplitNote)
  })
})
