import { useLocale } from 'next-intl'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { computeBirthChartAnalysis, type UnknownBirthTimeAnalysis } from '@/chart/ephemeris'
import type { NatalChart } from '@/chart/types'
import { loadInterpretations } from '@/content/interpretations'
import type { Interpretations } from '@/content/interpretations/types'
import { track } from '@/lib/analytics/browser'
import type { StoredBirth } from '@/lib/birth-storage'
import { toBirthInput } from '@/lib/birth-storage'

/** Chart and its locale's reading tables arrive together — one reveal, no half-loaded panel. */
export type ChartData = {
  chart: NatalChart
  interpretations: Interpretations
  unknownTime: UnknownBirthTimeAnalysis | null
}

type ChartState =
  | { status: 'idle' | 'computing' | 'failed'; runId: number }
  | { status: 'ready'; data: ChartData; runId: number }

const INITIAL_CHART_STATE: ChartState = { status: 'idle', runId: 0 }

type UseNatalChartOptions = {
  birth: StoredBirth | null
  editing: boolean
  /** Clears the wheel selection whenever the chart resets or a new one lands. */
  onReset: () => void
  sourceReady: boolean
}

/**
 * Owns the async natal-chart lifecycle: computes the chart + locale readings
 * when a birth is available, resets while the form is open, and counts runs so
 * the caller can re-key reveal animations.
 */
export function useNatalChart({ birth, editing, onReset, sourceReady }: UseNatalChartOptions) {
  const [chartState, setChartState] = useState<ChartState>(INITIAL_CHART_STATE)
  const submittedRef = useRef(false)
  const locale = useLocale()

  // The reset callback is effect-only and should not retrigger chart computation
  // when the caller passes a new inline function.
  const onResetEvent = useEffectEvent(onReset)

  // Normal views resolve the visitor's profile from the layout-level provider;
  // shared views receive an isolated read-only birth from the share route. The
  // two sources never write into each other.
  useEffect(() => {
    let cancelled = false

    if (!sourceReady || editing || !birth) {
      if (sourceReady) {
        onResetEvent()
        setChartState((previous) => ({ status: 'idle', runId: previous.runId }))
      }
      return () => {
        cancelled = true
      }
    }

    const fromSubmit = submittedRef.current
    const sourceBirth = birth
    submittedRef.current = false

    async function compute() {
      setChartState((previous) => ({ status: 'computing', runId: previous.runId }))

      try {
        const input = toBirthInput(sourceBirth)
        const [analysis, interpretations] = await Promise.all([
          computeBirthChartAnalysis(input),
          loadInterpretations(locale),
        ])

        if (cancelled) {
          return
        }

        const { chart, unknownTime } = analysis

        onResetEvent()

        setChartState((previous) => ({
          status: 'ready',
          data: { chart, interpretations, unknownTime },
          runId: previous.runId + 1,
        }))

        if (fromSubmit) {
          track('generate_chart')
        }
      } catch {
        if (!cancelled) {
          setChartState((previous) => ({ status: 'failed', runId: previous.runId }))
        }
      }
    }

    compute()

    return () => {
      cancelled = true
    }
  }, [birth, editing, locale, sourceReady])

  /** Flags the next compute as user-submitted so it fires the analytics event. */
  function markSubmitted() {
    submittedRef.current = true
  }

  /** Drops the current chart immediately (the effect settles the rest). */
  function reset() {
    setChartState((previous) => ({ status: 'idle', runId: previous.runId }))
  }

  return {
    computing: chartState.status === 'computing',
    data: chartState.status === 'ready' ? chartState.data : null,
    failed: chartState.status === 'failed',
    markSubmitted,
    reset,
    runId: chartState.runId,
  }
}
