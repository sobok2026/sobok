/**
 * Fails the build when paid question text is readable in the static export (MIGRATION L6).
 *
 * The leak this exists for was not a bug in a view. `_content` exposed all the question text as one object, a
 * page passed it to a client component as a prop, and Next serialised that prop into every exported page and
 * its RSC payload — so a refinement prompt sat in `out/ko/deep-type/test.html` for anyone who pressed Ctrl+U.
 * Splitting the loaders fixed it; this scan is what keeps it fixed, because the next accidental import would
 * look exactly as innocent as the last one.
 *
 * Scope is `.html` and `.txt` on purpose: those two are what a reader gets without executing anything. The paid
 * text still ships as a lazily imported JS chunk, and that is the design — the entitlement is `POST /refinement`
 * refusing answers without a paid token, never the obscurity of the prompt.
 *
 * Run from `apps/vibe` after `next build`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { DRAIN_SPREAD_PAID } from '../deep-type/content/band-labels.paid'
import {
  DRAIN_DETAILS,
  ENVIRONMENT_DETAILS,
  INTEREST_DETAILS,
  NEED_DETAILS,
  PURPOSE_DETAILS,
} from '../deep-type/content/facet-details.paid'
import { BAND_FRAME, POLE_SIGNATURE } from '../deep-type/content/opening.paid'
import { REFLECTION_BY_DRAIN, REFLECTION_BY_INTEREST, REFLECTION_BY_NEED } from '../deep-type/content/reflection.paid'
import { BLOCK_NOTES_KO, SECTION_INTROS_KO, SELF_REPORT_AXIS_NOTES } from '../deep-type/content/section-copy.paid'
import { ENVIRONMENT_LABELS, INTEREST_LABELS, NEED_LABELS, PURPOSE_LABELS } from '../deep-type/content/work-labels.paid'
import { deepTypeContent as enContent } from '../src/app/[locale]/deep-type/_content/en'
import { deepTypeContent as jaContent } from '../src/app/[locale]/deep-type/_content/ja'
import { deepTypeContent as koContent } from '../src/app/[locale]/deep-type/_content/ko'
import { paidQuestionOptions as enOptions } from '../src/app/[locale]/deep-type/_content/question-options/en.paid'
import { paidQuestionOptions as jaOptions } from '../src/app/[locale]/deep-type/_content/question-options/ja.paid'
import { paidQuestionOptions as koOptions } from '../src/app/[locale]/deep-type/_content/question-options/ko.paid'
import { paidQuestionOptions as zhOptions } from '../src/app/[locale]/deep-type/_content/question-options/zh.paid'
import { paidQuestionPrompts as enPrompts } from '../src/app/[locale]/deep-type/_content/question-prompts/en.paid'
import { paidQuestionPrompts as jaPrompts } from '../src/app/[locale]/deep-type/_content/question-prompts/ja.paid'
import { paidQuestionPrompts as koPrompts } from '../src/app/[locale]/deep-type/_content/question-prompts/ko.paid'
import { paidQuestionPrompts as zhPrompts } from '../src/app/[locale]/deep-type/_content/question-prompts/zh.paid'
import { deepTypeContent as zhContent } from '../src/app/[locale]/deep-type/_content/zh'

const VIBE_ROOT = resolve(dirname(import.meta.path), '..')
const OUT_DIR = join(VIBE_ROOT, 'out')

/**
 * Short strings are dropped: a six-character needle collides with ordinary page text and would make the gate
 * fire on coincidence, which is how a scan gets disabled. Every real prompt and option is far longer, and the
 * untranslated locales contribute nothing because their entries are empty.
 */
const MIN_NEEDLE = 8

/**
 * Every string the free content modules own, flattened. A needle that is also one of these is not a leak: the
 * free screens render it on purpose, so finding it in the export is the export working.
 *
 * The subtraction is what makes the report tables scannable at all. `BLOCK_NOTES_KO.strengthDistinct` and
 * `ui.strengthCardsTitle` are character-for-character the same sentence — one names a band group inside the paid
 * strength section, the other titles the whole free block — and without this the gate would read the free
 * screen's own heading as the paid report escaping. `free.test.ts` subtracts the free tables from its own paid
 * literal list for exactly this reason.
 */
function freeOwnedStrings(): Set<string> {
  const owned = new Set<string>()

  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      owned.add(value.trim())
    } else if (Array.isArray(value)) {
      for (const item of value) {
        walk(item)
      }
    } else if (value && typeof value === 'object') {
      for (const item of Object.values(value)) {
        walk(item)
      }
    }
  }

  // The four locale content modules are free-facing by construction — the paid question banks are loaded
  // separately, which is the split that closed MIGRATION L6 in the first place.
  for (const content of [koContent, enContent, jaContent, zhContent]) {
    walk(content)
  }

  return owned
}

function needles(): string[] {
  const catalogs = [
    ...Object.values(koPrompts),
    ...Object.values(enPrompts),
    ...Object.values(jaPrompts),
    ...Object.values(zhPrompts),
    ...Object.values(koOptions).flat(),
    ...Object.values(enOptions).flat(),
    ...Object.values(jaOptions).flat(),
    ...Object.values(zhOptions).flat(),
  ]

  // The forced-choice options are composed from the paid label tables rather than authored per item, so the
  // labels are paid option text by another name. `DRAIN_SPREAD_PAID.single` is here for §8.2: the one-branch
  // wording is paid-only and may not reach a free surface as a literal.
  const labels = [INTEREST_LABELS, NEED_LABELS, PURPOSE_LABELS, ENVIRONMENT_LABELS].flatMap((table) =>
    Object.values(table).flatMap((entry) => [entry.name, entry.action]),
  )

  // The report's own copy. It reaches a buyer through `GET /report` and nowhere else, so a page that prerendered
  // any of it would be giving away the thing being sold — the same failure the question catalogs are scanned for,
  // one layer up. Short entries fall out on `MIN_NEEDLE`; the paragraphs and questions are all far longer.
  const report = [
    ...[DRAIN_DETAILS, NEED_DETAILS, ENVIRONMENT_DETAILS, INTEREST_DETAILS, PURPOSE_DETAILS].flatMap((table) =>
      Object.values(table),
    ),
    ...Object.values(POLE_SIGNATURE).flatMap((axis) => Object.values(axis).map((pole) => pole.line)),
    ...Object.values(BAND_FRAME),
    ...[REFLECTION_BY_DRAIN, REFLECTION_BY_INTEREST, REFLECTION_BY_NEED].flatMap((table) => Object.values(table)),
    ...Object.values(SECTION_INTROS_KO),
    ...Object.values(BLOCK_NOTES_KO),
    ...Object.values(SELF_REPORT_AXIS_NOTES).flatMap((notes) => [notes.matched, notes.split]),
  ]

  const free = freeOwnedStrings()

  return [...catalogs, ...labels, ...report, DRAIN_SPREAD_PAID.single.label, DRAIN_SPREAD_PAID.single.detail]
    .map((text) => text.trim())
    .filter((text) => text.length >= MIN_NEEDLE && !free.has(text))
}

function exportedFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      out.push(...exportedFiles(path))
    } else if (entry.endsWith('.html') || entry.endsWith('.txt')) {
      out.push(path)
    }
  }
  return out
}

function main(): void {
  let files: string[]
  try {
    files = exportedFiles(OUT_DIR)
  } catch {
    console.error('assert-paid-text-absent: no out/ directory. Run `next build` first.')
    process.exit(1)
    return
  }

  const targets = needles()
  if (targets.length === 0) {
    console.error('assert-paid-text-absent: no paid text to look for, which means the catalogs are empty.')
    process.exit(1)
    return
  }

  const hits: string[] = []
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    for (const needle of targets) {
      if (source.includes(needle)) {
        hits.push(`${file.slice(VIBE_ROOT.length + 1)} :: ${needle.slice(0, 48)}`)
      }
    }
  }

  if (hits.length > 0) {
    console.error(`assert-paid-text-absent: paid text found in ${hits.length} place(s) in the static export.`)
    for (const hit of hits) {
      console.error(`  ${hit}`)
    }
    process.exit(1)
    return
  }

  console.log(`assert-paid-text-absent: ${files.length} exported files, ${targets.length} paid strings, 0 hits.`)
}

main()
