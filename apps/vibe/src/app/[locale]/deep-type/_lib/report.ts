import { bestMatchInner, clashInner, syncRate } from './codes'
import type {
  AxesResult,
  AxisDefinition,
  AxisId,
  AxisScore,
  ConfidenceBar,
  DeepReport,
  DeepTypeContent,
  DichoAxisId,
  GemAxisId,
  GemCode,
  InnerCode,
  PersonaCode,
  PersonaMismatch,
  PersonaResult,
} from './types'
import { DICHO_AXES, GEM_AXES } from './types'

// Pure composition of the deep report from the three measured results + the content dictionaries — no
// DOM, no server round-trip. The 12 psychological sections are keyed off the resolved codes exactly as
// before; the confidence bars and the self-claim mismatch insight are the new, honest-measurement layer.
export function buildDeepReport(
  content: DeepTypeContent,
  persona: PersonaResult,
  inner: AxesResult<DichoAxisId>,
  gem: AxesResult<GemAxisId>,
): DeepReport {
  const outer = persona.code
  const innerCode = inner.code as InnerCode
  const gemCode = gem.code as GemCode

  const outerBase = content.base[outer]
  const innerBase = content.base[innerCode]
  const gemContent = content.gem[gemCode]

  return {
    code: { gem: gemCode, inner: innerCode, outer },
    confidence: {
      gem: buildConfidenceBars(content, gem.axes, GEM_AXES),
      inner: buildConfidenceBars(content, inner.axes, DICHO_AXES),
      persona: buildConfidenceBars(content, persona.axes, DICHO_AXES),
    },
    mismatches: buildMismatches(content, persona),
    sections: {
      avoid: buildAvoid(content, gemCode),
      gap: buildGap(content, outer, innerCode),
      goals: [content.work[outer[3]], content.work[outer[2]], content.work[gemCode[3]]].join(' '),
      lifeAttitude: content.lifeAttitude[gemCode[0] + gemCode[3]],
      love: {
        note: gemCode[1] === 'O' ? content.ui.loveNoteConnected : content.ui.loveNoteAutonomous,
        text: gemContent.love,
      },
      match: {
        clashGem: content.gem[clashInner(gemCode)].gemName,
        matchGem: content.gem[bestMatchInner(gemCode)].gemName,
      },
      recharge: content.recharge[innerCode[0] + gemCode[2]],
      social: buildSocial(content, outer, innerCode),
      stress: content.stressGuide[gemCode[2] + gemCode[3]],
      summary: { gemName: gemContent.gemName, innerNoun: innerBase.noun, outerNoun: outerBase.noun },
      thisWeek: [
        content.ctaByEI[innerCode[0] as 'E' | 'I'],
        content.ctaByRM[gemCode[0] as 'R' | 'M'],
        content.ctaByVH[gemCode[2] as 'V' | 'H'],
      ],
      weakSpot: gemContent.lack,
    },
  }
}

export function buildConfidenceBars<TId extends AxisId>(
  content: DeepTypeContent,
  axes: Record<TId, AxisScore>,
  order: readonly AxisDefinition<TId, string, string>[],
): ConfidenceBar[] {
  return order.map((axis) => {
    const score = axes[axis.id]
    const axisContent = content.axes[axis.id]
    const poleContent = axisContent.poles[score.pole]

    return {
      axisId: axis.id,
      axisName: axisContent.name,
      borderline: score.borderline,
      confidence: score.confidence,
      pole: score.pole,
      poleDescription: poleContent.description,
      poleLabel: poleContent.label,
    }
  })
}

function buildMismatches(content: DeepTypeContent, persona: PersonaResult): PersonaMismatch[] {
  return persona.mismatches.map((axisId) => {
    const score = persona.axes[axisId]
    const axisContent = content.axes[axisId]

    return {
      axisId,
      axisName: axisContent.name,
      claimedLabel: axisContent.poles[score.claimed].label,
      measuredLabel: axisContent.poles[score.pole].label,
    }
  })
}

function buildGap(content: DeepTypeContent, outer: PersonaCode, inner: InnerCode): DeepReport['sections']['gap'] {
  if (outer === inner) {
    return { lines: [], syncRate: null, transparent: true }
  }

  const lines: { gap: string; prediction: string }[] = []

  for (let i = 0; i < 4; i++) {
    if (outer[i] !== inner[i]) {
      const key = outer[i] + inner[i]
      lines.push({ gap: content.gapOuterInner[key], prediction: content.prediction[key] })
    }
  }

  return { lines, syncRate: syncRate(outer, inner), transparent: false }
}

function buildSocial(content: DeepTypeContent, outer: PersonaCode, inner: InnerCode): DeepReport['sections']['social'] {
  const text = [content.social[outer[0]], content.social[outer[2]], content.social[outer[3]]].join(' ')

  if (outer[0] === inner[0]) {
    return { text }
  }

  const note = inner[0] === 'I' ? content.ui.socialBatteryNoteIntroverted : content.ui.socialBatteryNoteExtroverted

  return { note, text }
}

function buildAvoid(content: DeepTypeContent, gemCode: GemCode): readonly string[] {
  const fourthKey = gemCode[3] === 'U' ? 'U' : 'O2'

  return [content.avoid[gemCode[0]], content.avoid[gemCode[1]], content.avoid[gemCode[2]], content.avoid[fourthKey]]
}
