// The long-form reading composer — a pure function from chart + signature +
// content tables to ordered chapters, mirroring stella's report.ts. A per-call
// `used` set dedupes fragments globally (first chapter to claim a key wins),
// falsy copy is skipped so a locale shipping empty strings simply renders
// nothing, and chapters with zero paragraphs are dropped.

import type { Locale } from '@sobok/domain/locale'

import type { MutagenKey, PalaceKey } from '@/chart/keys'
import { pickLabel } from '@/chart/labels'
import { oppositePalace } from '@/chart/patterns'
import type { SignatureFeature } from '@/chart/signature'
import { SIGNATURE_COUNT, SIGNATURE_FLOOR } from '@/chart/signature'
import type { ZwdsChart, ZwdsPalace } from '@/chart/types'
import type { Interpretations, MutagenStarKey, ReportChapterId } from '@/content/interpretations/types'
import { fill } from '@/content/interpretations/types'

export type ReportParagraph = {
  kicker?: string
  note?: string
  text: string
}

export type ReportChapter = {
  id: ReportChapterId
  title: string
  intro?: string
  paragraphs: ReportParagraph[]
}

export type ReportOptions = {
  /** 세는나이 — 대한 구간 판정 기준. */
  nominalAge: number
}

type Composer = {
  chart: ZwdsChart
  interp: Interpretations
  locale: Locale
  used: Set<string>
}

function claim(composer: Composer, key: string): boolean {
  if (composer.used.has(key)) {
    return false
  }
  composer.used.add(key)
  return true
}

function palaceByKey(chart: ZwdsChart, key: PalaceKey): ZwdsPalace | undefined {
  return chart.palaces.find((palace) => palace.key === key)
}

function joinNames(names: readonly string[]): string {
  return names.join('·')
}

function starPalaceText(composer: Composer, star: string, palace: PalaceKey): string {
  const table = composer.interp.stars[star as keyof typeof composer.interp.stars]
  return table ? table[palace] : ''
}

function mutagenText(composer: Composer, mutagen: MutagenKey, star: string): string {
  return composer.interp.mutagens[mutagen][star as MutagenStarKey] ?? ''
}

/** 밝기·사화가 만드는 보조 노트 — 사화가 밝기보다 우선한다. */
function starNote(composer: Composer, star: ZwdsPalace['majorStars'][number]): string | undefined {
  const { report } = composer.interp
  const name = pickLabel(star.label, composer.locale)

  if (star.mutagenKey && star.mutagen) {
    const note = fill(report.mutagenNotes[star.mutagenKey], { star: name })
    return note || undefined
  }
  if (star.brightnessKey === 'miao' || star.brightnessKey === 'wang') {
    const note = fill(report.brightness.strong, { star: name })
    return note || undefined
  }
  if (star.brightnessKey === 'xian') {
    const note = fill(report.brightness.weak, { star: name })
    return note || undefined
  }
  return undefined
}

/** 궁 하나를 문단들로 풀어낸다 — 주성 해석, 공궁 차성, 길살성 동반 노트. */
function palaceParagraphs(composer: Composer, palaceKey: PalaceKey, kickerTemplate: string): ReportParagraph[] {
  const { chart, interp, locale } = composer
  const palace = palaceByKey(chart, palaceKey)

  if (!palace) {
    return []
  }

  const palaceName = pickLabel(palace.name, locale)
  const paragraphs: ReportParagraph[] = []

  if (palace.majorStars.length === 0) {
    if (claim(composer, `emptyPalace.${palaceKey}`)) {
      const text = interp.emptyPalace[palaceKey]
      if (text) {
        paragraphs.push({ kicker: fill(interp.report.kicker.empty, { palace: palaceName }), text })
      }
    }

    const opposite = oppositePalace(chart, palace)
    let firstBorrowed = true
    for (const star of opposite?.majorStars ?? []) {
      if (!star.key || !claim(composer, `stars.${star.key}.${palaceKey}`)) {
        continue
      }
      const text = starPalaceText(composer, star.key, palaceKey)
      if (!text) {
        continue
      }
      paragraphs.push({
        kicker: fill(interp.report.kicker.borrowed, {
          star: pickLabel(star.label, locale),
          palace: palaceName,
        }),
        note: firstBorrowed ? interp.report.borrowedNote || undefined : undefined,
        text,
      })
      firstBorrowed = false
    }
  } else {
    for (const star of palace.majorStars) {
      if (!star.key || !claim(composer, `stars.${star.key}.${palaceKey}`)) {
        continue
      }
      const text = starPalaceText(composer, star.key, palaceKey)
      if (!text) {
        continue
      }
      paragraphs.push({
        kicker: fill(kickerTemplate, { star: pickLabel(star.label, locale), palace: palaceName }),
        note: starNote(composer, star),
        text,
      })
    }
  }

  // 길성·살성 동반 — 노트가 비어 있는 첫 문단에 붙인다.
  const companionNotes: string[] = []
  if (palace.luckyStars.length > 0 && interp.report.companions.lucky) {
    companionNotes.push(
      fill(interp.report.companions.lucky, {
        stars: joinNames(palace.luckyStars.map((star) => pickLabel(star.label, locale))),
      }),
    )
  }
  if (palace.unluckyStars.length > 0 && interp.report.companions.unlucky) {
    companionNotes.push(
      fill(interp.report.companions.unlucky, {
        stars: joinNames(palace.unluckyStars.map((star) => pickLabel(star.label, locale))),
      }),
    )
  }
  if (companionNotes.length > 0) {
    const slot = paragraphs.find((paragraph) => !paragraph.note)
    if (slot) {
      slot.note = companionNotes.join(' ')
    }
  }

  return paragraphs
}

function coreChapter(composer: Composer): ReportParagraph[] {
  const { chart, interp, locale } = composer
  const paragraphs = palaceParagraphs(composer, 'life', interp.report.kicker.lifeStar)

  const bodyPalace = chart.palaces.find((palace) => palace.isBodyPalace)
  if (bodyPalace?.key) {
    const text = interp.report.bodyPalace[bodyPalace.key]
    if (text && claim(composer, `bodyPalace.${bodyPalace.key}`)) {
      paragraphs.push({
        kicker: fill(interp.report.kicker.bodyPalace, { palace: pickLabel(bodyPalace.name, locale) }),
        text,
      })
    }
  }

  if (chart.fiveElementsKey) {
    const text = interp.report.fiveElements[chart.fiveElementsKey]
    if (text) {
      paragraphs.push({
        kicker: fill(interp.report.kicker.fiveElements, { fiveElements: pickLabel(chart.fiveElementsClass, locale) }),
        text,
      })
    }
  }

  const life = palaceByKey(chart, 'life')
  const lifeStars = life?.majorStars.length
    ? life.majorStars.map((star) => pickLabel(star.label, locale))
    : (oppositePalace(chart, life ?? chart.palaces[0])?.majorStars.map((star) => pickLabel(star.label, locale)) ?? [])
  if (paragraphs.length > 0 && interp.report.core.bridge && bodyPalace && lifeStars.length > 0) {
    paragraphs.push({
      text: fill(interp.report.core.bridge, {
        stars: joinNames(lifeStars),
        bodyPalace: pickLabel(bodyPalace.name, locale),
        fiveElements: pickLabel(chart.fiveElementsClass, locale),
      }),
    })
  }

  return paragraphs
}

function signatureParagraph(composer: Composer, feature: SignatureFeature): ReportParagraph | null {
  const { interp, locale } = composer
  const { kicker } = interp.report

  if (feature.kind === 'pattern') {
    if (!claim(composer, `patterns.${feature.pattern}`)) {
      return null
    }
    const text = interp.patterns[feature.pattern]
    if (!text) {
      return null
    }
    return { kicker: fill(kicker.pattern, { pattern: interp.report.patternNames[feature.pattern] }), text }
  }

  if (feature.kind === 'mutagen') {
    if (!claim(composer, `mutagens.${feature.mutagen}.${feature.star}`)) {
      return null
    }
    const text = mutagenText(composer, feature.mutagen, feature.star)
    if (!text) {
      return null
    }
    return {
      kicker: fill(kicker.mutagen, {
        star: pickLabel(feature.starLabel, locale),
        mutagen: pickLabel(feature.mutagenLabel, locale),
        palace: pickLabel(feature.palaceName, locale),
      }),
      text,
    }
  }

  if (feature.kind === 'palaceStar') {
    if (!claim(composer, `stars.${feature.star}.${feature.palace}`)) {
      return null
    }
    const text = starPalaceText(composer, feature.star, feature.palace)
    if (!text) {
      return null
    }
    return {
      kicker: fill(kicker.palaceStar, {
        star: pickLabel(feature.starLabel, locale),
        palace: pickLabel(feature.palaceName, locale),
      }),
      text,
    }
  }

  if (!claim(composer, 'emptyPalace.life')) {
    return null
  }
  const life = palaceByKey(composer.chart, 'life')
  const text = composer.interp.emptyPalace.life
  if (!text || !life) {
    return null
  }
  return { kicker: fill(kicker.empty, { palace: pickLabel(life.name, locale) }), text }
}

function signatureChapter(composer: Composer, features: readonly SignatureFeature[]): ReportParagraph[] {
  const paragraphs: ReportParagraph[] = []

  for (const feature of features) {
    if (paragraphs.length >= SIGNATURE_COUNT) {
      break
    }
    if (feature.score < SIGNATURE_FLOOR) {
      break
    }
    const paragraph = signatureParagraph(composer, feature)
    if (paragraph) {
      paragraphs.push(paragraph)
    }
  }

  return paragraphs
}

function pathChapter(composer: Composer, nominalAge: number): ReportParagraph[] {
  const { chart, interp, locale } = composer
  const decade = chart.palaces.find((palace) => nominalAge >= palace.decadal.from && nominalAge <= palace.decadal.to)

  if (!decade?.key) {
    return []
  }

  const palaceName = pickLabel(decade.name, locale)
  const paragraphs: ReportParagraph[] = []

  if (interp.report.path.intro) {
    paragraphs.push({
      kicker: fill(interp.report.kicker.decade, { palace: palaceName }),
      text: fill(interp.report.path.intro, { from: decade.decadal.from, to: decade.decadal.to, palace: palaceName }),
    })
  }

  if (decade.majorStars.length === 0) {
    if (interp.report.path.empty) {
      paragraphs.push({ text: fill(interp.report.path.empty, { palace: palaceName }) })
    }
    return paragraphs
  }

  for (const star of decade.majorStars) {
    if (!star.key || !decade.key || !claim(composer, `stars.${star.key}.${decade.key}`)) {
      continue
    }
    const text = starPalaceText(composer, star.key, decade.key)
    if (text) {
      paragraphs.push({
        kicker: fill(interp.report.kicker.palaceStar, {
          star: pickLabel(star.label, locale),
          palace: palaceName,
        }),
        text,
      })
    }
  }

  return paragraphs
}

export function buildReport(
  chart: ZwdsChart,
  features: readonly SignatureFeature[],
  interp: Interpretations,
  locale: Locale,
  options: ReportOptions,
): ReportChapter[] {
  const composer: Composer = { chart, interp, locale, used: new Set() }
  const titles = interp.report.chapterTitles

  const chapters: ReportChapter[] = [
    { id: 'core', title: titles.core, paragraphs: coreChapter(composer) },
    {
      id: 'signature',
      title: titles.signature,
      intro: interp.report.signatureIntro || undefined,
      paragraphs: signatureChapter(composer, features),
    },
    {
      id: 'love',
      title: titles.love,
      paragraphs: palaceParagraphs(composer, 'spouse', interp.report.kicker.palaceStar),
    },
    {
      id: 'work',
      title: titles.work,
      paragraphs: [
        ...palaceParagraphs(composer, 'career', interp.report.kicker.palaceStar),
        ...palaceParagraphs(composer, 'travel', interp.report.kicker.palaceStar),
      ],
    },
    {
      id: 'money',
      title: titles.money,
      paragraphs: [
        ...palaceParagraphs(composer, 'wealth', interp.report.kicker.palaceStar),
        ...palaceParagraphs(composer, 'property', interp.report.kicker.palaceStar),
      ],
    },
    {
      id: 'people',
      title: titles.people,
      paragraphs: [
        ...palaceParagraphs(composer, 'friends', interp.report.kicker.palaceStar),
        ...palaceParagraphs(composer, 'siblings', interp.report.kicker.palaceStar),
      ],
    },
    {
      id: 'family',
      title: titles.family,
      paragraphs: [
        ...palaceParagraphs(composer, 'parents', interp.report.kicker.palaceStar),
        ...palaceParagraphs(composer, 'children', interp.report.kicker.palaceStar),
      ],
    },
    {
      id: 'mind',
      title: titles.mind,
      paragraphs: palaceParagraphs(composer, 'wellbeing', interp.report.kicker.palaceStar),
    },
    {
      id: 'health',
      title: titles.health,
      intro: interp.report.health.disclaimer || undefined,
      paragraphs: palaceParagraphs(composer, 'health', interp.report.kicker.palaceStar),
    },
    { id: 'path', title: titles.path, paragraphs: pathChapter(composer, options.nominalAge) },
    {
      id: 'closing',
      title: titles.closing,
      paragraphs: interp.report.closing.outro ? [{ text: interp.report.closing.outro }] : [],
    },
  ]

  return chapters.filter((chapter) => chapter.title && chapter.paragraphs.length > 0)
}
