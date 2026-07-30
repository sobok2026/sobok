import type { AxisCopy } from '../content/axis-copy'
import {
  AXIS_BAND_TAIL,
  AXIS_SCENE,
  type AxisScene,
  GEM_CORE_READING,
  INNER_FAMILY_READING,
  READING_CHAPTER,
  READING_CHAPTER_ORDER,
  READING_CLOSING_NOTE,
  READING_CLOSING_PARAGRAPHS,
  READING_KICKER,
  type ReadingChapterId,
} from '../content/reading.free'
import { type AxisId, type GemCode, type InnerCode, isFirstPole, leadingPole, type TentativeBand } from '../model'

// The composer for the free long-form reading. Pure and total, like the engine it sits beside: no clock, no
// random, no throw. Every table it reads is complete over its key type, so there is no case it cannot write.
//
// What it is FOR. The free result used to be four blocks of labels — eight letters with a band beside each, a
// job name, three drain chips and a row of cards — and a label is not a reading. The cards stay exactly as they
// are; this is the prose underneath them, and it is composed rather than authored per reader so that the eight
// letters and the world job are explained in the same words the paid opening explains them in.
//
// What it is NOT. It never repeats a card. The axis chapters carry the pole SCENE, which appears nowhere else
// on the screen, and only a one-line tail from the band — the band's own two-sentence copy is already printed
// on the axis card above. The strength cards and the drain block have their own sections and are not narrated
// here.

export interface ReadingParagraph {
  /** Names which part of the result the paragraph came out of. Never a finding of its own. */
  kicker: string | null
  /** An aside the kicker cannot hold — on the axis chapters, how firmly the axis landed. */
  note: string | null
  text: string
}

export interface ReadingChapter {
  id: ReadingChapterId
  intro: string
  paragraphs: readonly ReadingParagraph[]
  title: string
}

export interface FreeReading {
  chapters: readonly ReadingChapter[]
  /** One line to put the reading down on. Rendered under the last chapter, outside it. */
  closing: string
}

/**
 * Exactly what the composer needs from an axis. Structurally satisfied by `FreeAxisBand`, so `buildFreeReport`
 * hands its own arrays straight over — but declared here rather than imported, because importing it would make
 * this module and `free.ts` mutually dependent for the sake of three fields.
 */
export interface ReadingAxis {
  band3: TentativeBand
  id: AxisId
  /** The frozen code letter. Folded onto a declared pole before any table lookup. */
  leading: string
}

export interface FreeReadingInput {
  axes: { gem: readonly ReadingAxis[]; inner: readonly ReadingAxis[] }
  codes: { gem: GemCode; inner: InnerCode }
  copy: AxisCopy
}

export function composeFreeReading(input: FreeReadingInput): FreeReading {
  const chapters: Record<ReadingChapterId, ReadingChapter> = {
    worldJob: chapter('worldJob', worldJobParagraphs(input.codes)),
    inner: chapter('inner', axisParagraphs(input.axes.inner, input.copy)),
    gem: chapter('gem', axisParagraphs(input.axes.gem, input.copy)),
    closing: chapter(
      'closing',
      READING_CLOSING_PARAGRAPHS.map((text) => ({ kicker: null, note: null, text })),
    ),
  }

  return {
    chapters: READING_CHAPTER_ORDER.map((id) => chapters[id]),
    closing: READING_CLOSING_NOTE,
  }
}

function chapter(id: ReadingChapterId, paragraphs: readonly ReadingParagraph[]): ReadingChapter {
  return { id, intro: READING_CHAPTER[id].intro, paragraphs, title: READING_CHAPTER[id].title }
}

// The two halves of the world job, in the order the codes are printed in: the method first, then what pushes
// it. The job NAME is not repeated here — the hero above the reading is that name at display size, and the
// chapter's own intro already says the name came from these two halves.
function worldJobParagraphs(codes: { gem: GemCode; inner: InnerCode }): readonly ReadingParagraph[] {
  return [
    { kicker: READING_KICKER.family, note: null, text: INNER_FAMILY_READING[codes.inner] },
    { kicker: READING_KICKER.core, note: null, text: GEM_CORE_READING[codes.gem] },
  ]
}

/**
 * Every axis of the layer, in the order its letters are printed. All four, never a selection: which axes are
 * worth reading is a comparison across axes measured by three items each, and §4.3 rules that out. The band
 * tail is what distinguishes them, and it says only what its own axis did.
 */
function axisParagraphs(axes: readonly ReadingAxis[], copy: AxisCopy): readonly ReadingParagraph[] {
  return axes.map((axis) => {
    const content = copy[axis.id]
    // `AXIS_SCENE[id]` is one of eight two-key objects and the checker cannot correlate it with a runtime
    // letter, so the widening happens once here. `leadingPole` returns only letters the table declares.
    const poles: Readonly<Record<string, AxisScene>> = AXIS_SCENE[axis.id]
    const pole = isFirstPole(axis.id, axis.leading) ? content.first : content.second

    return {
      kicker: `${content.name} · ${pole.label}`,
      note: AXIS_BAND_TAIL[axis.band3],
      text: poles[leadingPole(axis.id, axis.leading)].scene,
    }
  })
}
