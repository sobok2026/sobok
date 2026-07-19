import { bestMatchInner, clashInner, syncRate } from './model'
import type { DeepReport, DeepTypeContent, GemCode, InnerCode, PersonaCode } from './types'

// Pure composition of the 12-section deep report from three codes + the content dictionaries — no DOM, no
// server round-trip. Mirrors scrReport()/gapOS() in the source prototype line for line; every dictionary
// key derivation below is a direct port, not a re-design — see the inline comments for exactly which
// letters of which code build each lookup key.
export function buildDeepReport(
  content: DeepTypeContent,
  outer: PersonaCode,
  inner: InnerCode,
  gemCode: GemCode,
): DeepReport {
  const outerBase = content.base[outer]
  const innerBase = content.base[inner]
  const gem = content.gem[gemCode]

  return {
    code: { gem: gemCode, inner, outer },
    sections: {
      avoid: buildAvoid(content, gemCode),
      gap: buildGap(content, outer, inner),
      goals: [content.work[outer[3]], content.work[outer[2]], content.work[gemCode[3]]].join(' '),
      lifeAttitude: content.lifeAttitude[gemCode[0] + gemCode[3]],
      love: {
        note: gemCode[1] === 'O' ? content.ui.loveNoteConnected : content.ui.loveNoteAutonomous,
        text: gem.love,
      },
      match: {
        clashGem: content.gem[clashInner(gemCode)].gemName,
        matchGem: content.gem[bestMatchInner(gemCode)].gemName,
      },
      recharge: content.recharge[inner[0] + gemCode[2]],
      social: buildSocial(content, outer, inner),
      stress: content.stressGuide[gemCode[2] + gemCode[3]],
      summary: { gemName: gem.gemName, innerNoun: innerBase.noun, outerNoun: outerBase.noun },
      thisWeek: [
        content.ctaByEI[inner[0] as 'E' | 'I'],
        content.ctaByRM[gemCode[0] as 'R' | 'M'],
        content.ctaByVH[gemCode[2] as 'V' | 'H'],
      ],
      weakSpot: gem.lack,
    },
  }
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
