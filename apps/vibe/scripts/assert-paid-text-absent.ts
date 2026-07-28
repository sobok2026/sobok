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
import { ENVIRONMENT_LABELS, INTEREST_LABELS, NEED_LABELS, PURPOSE_LABELS } from '../deep-type/content/work-labels.paid'
import { enPaidQuestionOptions } from '../src/app/[locale]/deep-type/_content/question-options/en.paid'
import { jaPaidQuestionOptions } from '../src/app/[locale]/deep-type/_content/question-options/ja.paid'
import { koPaidQuestionOptions } from '../src/app/[locale]/deep-type/_content/question-options/ko.paid'
import { zhPaidQuestionOptions } from '../src/app/[locale]/deep-type/_content/question-options/zh.paid'
import { enPaidQuestionPrompts } from '../src/app/[locale]/deep-type/_content/question-prompts/en.paid'
import { jaPaidQuestionPrompts } from '../src/app/[locale]/deep-type/_content/question-prompts/ja.paid'
import { koPaidQuestionPrompts } from '../src/app/[locale]/deep-type/_content/question-prompts/ko.paid'
import { zhPaidQuestionPrompts } from '../src/app/[locale]/deep-type/_content/question-prompts/zh.paid'

const VIBE_ROOT = resolve(dirname(import.meta.path), '..')
const OUT_DIR = join(VIBE_ROOT, 'out')

/**
 * Short strings are dropped: a six-character needle collides with ordinary page text and would make the gate
 * fire on coincidence, which is how a scan gets disabled. Every real prompt and option is far longer, and the
 * untranslated locales contribute nothing because their entries are empty.
 */
const MIN_NEEDLE = 8

function needles(): string[] {
  const catalogs = [
    ...Object.values(koPaidQuestionPrompts),
    ...Object.values(enPaidQuestionPrompts),
    ...Object.values(jaPaidQuestionPrompts),
    ...Object.values(zhPaidQuestionPrompts),
    ...Object.values(koPaidQuestionOptions).flat(),
    ...Object.values(enPaidQuestionOptions).flat(),
    ...Object.values(jaPaidQuestionOptions).flat(),
    ...Object.values(zhPaidQuestionOptions).flat(),
  ]

  // The forced-choice options are composed from the paid label tables rather than authored per item, so the
  // labels are paid option text by another name. `DRAIN_SPREAD_PAID.single` is here for §8.2: the one-branch
  // wording is paid-only and may not reach a free surface as a literal.
  const labels = [INTEREST_LABELS, NEED_LABELS, PURPOSE_LABELS, ENVIRONMENT_LABELS].flatMap((table) =>
    Object.values(table).flatMap((entry) => [entry.name, entry.action]),
  )

  return [...catalogs, ...labels, DRAIN_SPREAD_PAID.single.label, DRAIN_SPREAD_PAID.single.detail]
    .map((text) => text.trim())
    .filter((text) => text.length >= MIN_NEEDLE)
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
