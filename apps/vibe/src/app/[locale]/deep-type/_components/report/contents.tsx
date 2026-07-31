import { cn } from '@/utils/cn'

import { FOCUS_CLASS_NAME } from '../../../../../components/focus'
import { CARD_CLASS_NAME, REPORT_TYPE } from '../../_lib/surface'
import type { DeepTypeContent } from '../../_lib/types'
import { type ReportPart, sectionAnchorId } from './parts'

/**
 * The contents list.
 *
 * The report is roughly twenty thousand pixels at phone width — about twenty-four screens — and until this
 * existed there was no way to see how much of it there was, no way to jump, and no way back to a section a
 * reader had already passed. That is the difference between a document and a feed, and a document is what was
 * paid for.
 *
 * Plain anchors, no script. They survive the page being printed, they work before hydration, and the browser's
 * own back button undoes a jump — which is the behaviour a reader expects from a contents list and the one a
 * scroll-into-view handler would have to reimplement.
 */
export function ReportContents({ content, parts }: { content: DeepTypeContent; parts: readonly ReportPart[] }) {
  const { ui } = content

  return (
    <nav aria-labelledby="report-contents-title" className={cn(CARD_CLASS_NAME, 'print:hidden')}>
      <h2 className={REPORT_TYPE.title} id="report-contents-title">
        {ui.reportTocTitle}
      </h2>
      <p className={cn('mt-2', REPORT_TYPE.meta)}>{ui.reportTocNote}</p>

      <ol className="mt-5 grid gap-6">
        {parts.map((part) => (
          <li key={part.id}>
            <PartLabel number={part.number} template={ui.reportPartLabel} title={ui.reportParts[part.id].title} />
            <ol className="mt-2 grid">
              {part.sections.map(({ number, section }) => (
                <li key={section.key}>
                  <a
                    // The row a finger gets and the row a pointer lights up are the same box, and the box is
                    // symmetric around its text: `py-2` on a 28px line is the 44px target both platforms ask
                    // for, where `min-h-11` over `py-1.5` left 4px of the highlight hanging below the words.
                    // `-mx-2 px-2` bleeds that box into the card's own padding so the highlight has room
                    // around the text it covers while the numerals stay on the part label's left edge.
                    className={cn(
                      '-mx-2 flex items-baseline gap-3 rounded-2xl p-2 transition-colors hover:bg-page-soft/70',
                      FOCUS_CLASS_NAME,
                    )}
                    href={`#${sectionAnchorId(section.key)}`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-6 shrink-0 font-black text-page-ink-muted text-sm tabular-nums"
                    >
                      {String(number).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 font-bold text-[0.9375rem] text-page-ink leading-7">{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * A part divider between two runs of sections. The same label the contents list prints, so a reader who jumped
 * from the list lands on the words they tapped.
 */
export function PartDivider({ content, part }: { content: DeepTypeContent; part: ReportPart }) {
  const copy = content.ui.reportParts[part.id]

  return (
    <div className="px-1 pt-3">
      {/* A real heading, and the level the sections under it are nested below. The parts are how this document
          is divided; a <p> made that division visible to sighted readers and to nobody else. */}
      <PartLabel as="h2" number={part.number} template={content.ui.reportPartLabel} title={copy.title} />
      <p className={cn('mt-2 max-w-md', REPORT_TYPE.meta)}>{copy.body}</p>
    </div>
  )
}

function PartLabel({
  as: Tag = 'p',
  number,
  template,
  title,
}: {
  as?: 'h2' | 'p'
  number: number
  template: string
  title: string
}) {
  return (
    <Tag className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className="rounded-full bg-page-accent/12 px-2.5 py-0.5 font-black text-page-accent-strong text-xs">
        {template.replace('{number}', String(number))}
      </span>
      <span className="font-black text-lg text-page-ink">{title}</span>
    </Tag>
  )
}
