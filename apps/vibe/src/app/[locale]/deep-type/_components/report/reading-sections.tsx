import { cn } from '@/utils/cn'

import type {
  DrainSignatureData,
  HappinessConditionsData,
  InterestProfileData,
  OpeningReadData,
  StrengthCardsData,
  WorldJobData,
} from '../../_lib/api'
import { GROUPED_LIST_CLASS_NAME, GROUPED_ROW_CLASS_NAME, REPORT_TYPE } from '../../_lib/surface'
import type { DeepTypeContent } from '../../_lib/types'
import { AbilityArtwork } from '../ability-artwork'
import { BandLadder, DrainStrands } from './art'
import { BlockHeading, ClosingNote, FacetList, Field, FieldList, Kicker, LabeledNote } from './primitives'

// The six sections a reader reads to find out where they stand. Each one draws its own shape from its own
// data — the composed opening as kicker paragraphs, the strength cards as cards with their art, the drain
// spread as strands — instead of the twelve identical text blocks the report used to be.

/**
 * Section 11 in generation order, first on screen. The long-form reading — one lead sentence, then every axis
 * of both layers with the settled band beside it, then what the work answers point at.
 *
 * The band line sits UNDER the scene rather than inside it. It is the one thing on this screen the free result
 * could not say, and running it into the same paragraph as the pole's description made a statement about the
 * spread of the answers read as one more sentence about the reader. It sits behind a rule for the same reason:
 * at four descending greys it was simply the fourth-quietest line in the block.
 *
 * `data.worldJobName` is not printed. The cover is the job name at 3xl, and repeating it here put the same
 * string on screen three times before the first finding.
 */
export function OpeningReadSection({ data }: { data: OpeningReadData }) {
  return (
    <>
      {/* The reader's whole result in one sentence, so it is set one step above the body rather than at it. */}
      <p className="break-prose font-medium text-[1.0625rem] text-foreground leading-8">{data.lead}</p>

      <div className="mt-8 grid gap-8">
        {data.blocks.map((block) => (
          <div key={block.heading}>
            <BlockHeading>{block.heading}</BlockHeading>
            <div className="mt-4 grid gap-6">
              {block.paragraphs.map((paragraph) => (
                <div key={paragraph.kicker}>
                  <Kicker>{paragraph.kicker}</Kicker>
                  <p className={cn('mt-2', REPORT_TYPE.body)}>{paragraph.text}</p>
                  {paragraph.note ? (
                    <p className={cn('mt-2.5 border-border border-l-2 pl-3', REPORT_TYPE.meta)}>{paragraph.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ClosingNote>{data.closing}</ClosingNote>
    </>
  )
}

/**
 * `data.name` is the cover's h1 and is not repeated here, and neither are the two code artworks — they moved
 * to the cover, where they are the result rather than a full screen of decoration in the middle of section 02.
 * What this section adds is the two halves the job is made of.
 */
export function WorldJobSection({ content, data }: { content: DeepTypeContent; data: WorldJobData }) {
  return (
    <dl className={cn(GROUPED_LIST_CLASS_NAME, 'sm:grid sm:gap-3')}>
      <WorldJobHalf
        heading={data.family.name}
        label={content.ui.worldJobFamilyLabel}
        lines={[data.family.method, data.family.role]}
        reading={data.reading.family}
      />
      <WorldJobHalf
        heading={data.core.name}
        label={content.ui.worldJobCoreLabel}
        lines={[data.core.strength]}
        reading={data.reading.core}
      />
    </dl>
  )
}

function WorldJobHalf({
  heading,
  label,
  lines,
  reading,
}: {
  heading: string
  label: string
  lines: readonly string[]
  reading: string
}) {
  return (
    <div className={GROUPED_ROW_CLASS_NAME}>
      <dt className="font-black text-accent text-sm tracking-wide">{label}</dt>
      <dd>
        <p className="mt-1.5 font-black text-lg text-foreground leading-snug">{heading}</p>
        {lines.map((line) => (
          <p className={cn('mt-1.5', REPORT_TYPE.meta)} key={line}>
            {line}
          </p>
        ))}
        <p className={cn('mt-3 border-border border-t pt-3', REPORT_TYPE.copy)}>{reading}</p>
      </dd>
    </div>
  )
}

/**
 * The cards with their art and their full copy. The paid screen used to print the card name and its one-line
 * `short` while the free screen showed the artwork and the longer `core` — so the report someone paid for was
 * the thinner of the two. All four authored fields are here, and `watch` in particular has never been on
 * screen at all.
 *
 * The pole letters that used to sit in a chip beside the card name are gone. `F` on its own answers a question
 * nobody asked at that point in the document — the axis it belongs to is not named anywhere near it — and the
 * band movement list below prints every axis with both its name and its letter.
 */
export function StrengthCardsSection({ content, data }: { content: DeepTypeContent; data: StrengthCardsData }) {
  return (
    <>
      {data.emptyNote ? <p className={REPORT_TYPE.body}>{data.emptyNote}</p> : null}

      <div className="grid gap-7">
        {data.groups.map((group) => (
          <div key={group.heading}>
            <BlockHeading>{group.heading}</BlockHeading>
            <ul className="mt-3 grid gap-4">
              {group.cards.map((card) => (
                <li
                  className="flex flex-col overflow-hidden rounded-3xl border border-border bg-white sm:flex-row sm:gap-4"
                  key={card.slug}
                >
                  <AbilityArtwork slug={card.slug} />
                  <div className="min-w-0 flex-1 p-4 sm:py-4 sm:pr-4 sm:pl-0">
                    <p className="font-black text-base text-foreground leading-6">{card.copy.name}</p>
                    <p className={cn('mt-2', REPORT_TYPE.copy)}>{card.copy.core}</p>
                    <div className="mt-3 grid gap-2">
                      <LabeledNote label={content.ui.reportCardShineLabel}>{card.copy.shine}</LabeledNote>
                      <LabeledNote label={content.ui.reportCardWatchLabel}>{card.copy.watch}</LabeledNote>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <BandMovementBlock data={data} />
    </>
  )
}

/**
 * D14's other half. The band a reader was shown tentatively on the free screen, resolved — and which way the
 * ruler moved when the extra items landed. It reached the model request and nothing else before this, so a
 * reader whose narration failed was told the free band was provisional and then never told what it settled to.
 */
function BandMovementBlock({ data }: { data: StrengthCardsData }) {
  return (
    <div className={cn(data.groups.length > 0 && 'mt-8 border-border border-t pt-6')}>
      <BlockHeading>{data.movementHeading}</BlockHeading>
      <ul className="mt-3 grid gap-3">
        {data.bandMovement.map((axis) => (
          <li className="flex items-center justify-between gap-3" key={axis.id}>
            <div className="min-w-0">
              <p className="font-bold text-[0.9375rem] text-foreground">{axis.name}</p>
              <p className={cn('mt-0.5', REPORT_TYPE.meta)}>
                {axis.leading} · {axis.band.label} · {axis.shift.label}
              </p>
            </div>
            <BandLadder axis={axis} />
          </li>
        ))}
      </ul>
      {data.splitAxisNames.length > 0 ? (
        <div className="mt-5 rounded-2xl bg-surface-2/70 p-3">
          <FieldList>
            <Field label={data.splitLabel} value={data.splitAxisNames.join(' · ')} />
          </FieldList>
          <p className={cn('mt-2', REPORT_TYPE.meta)}>{data.splitNote}</p>
        </div>
      ) : (
        <p className={cn('mt-5', REPORT_TYPE.meta)}>{data.splitNote}</p>
      )}
      <ClosingNote>{data.clarityNote}</ClosingNote>
    </div>
  )
}

export function DrainSignatureSection({ content, data }: { content: DeepTypeContent; data: DrainSignatureData }) {
  return (
    <>
      <div className="flex items-center gap-4 rounded-3xl bg-surface-2/70 p-4">
        <DrainStrands strands={data.strands} />
        <div className="min-w-0">
          <p className="font-black text-base text-accent">{data.spread.label}</p>
          <p className={cn('mt-1', REPORT_TYPE.copy)}>{data.spread.detail}</p>
        </div>
      </div>

      <div className="mt-6">
        <FacetList actionLabel={content.ui.reportFacetActionLabel} facets={data.leaders} />
      </div>

      {/* The grouped list already draws a rule under itself at compact width, so a second divider here would
          put two lines a margin apart. From `sm` up the list loses its borders and this one has to appear. */}
      <div className="mt-6 sm:border-border sm:border-t sm:pt-5">
        <BlockHeading>{data.contrast.sentence}</BlockHeading>
        <div className="mt-3">
          <FieldList>
            <Field
              label={data.contrastLabels.free}
              value={data.contrast.freeShown.map((facet) => facet.label).join(' · ')}
            />
            {data.contrast.added.length > 0 ? (
              <Field
                label={data.contrastLabels.added}
                value={data.contrast.added.map((facet) => facet.label).join(' · ')}
              />
            ) : null}
            {data.contrast.dropped.length > 0 ? (
              <Field
                label={data.contrastLabels.dropped}
                value={data.contrast.dropped.map((facet) => facet.label).join(' · ')}
              />
            ) : null}
          </FieldList>
        </div>
      </div>

      <ClosingNote>{data.meaning}</ClosingNote>
    </>
  )
}

export function HappinessConditionsSection({
  content,
  data,
}: {
  content: DeepTypeContent
  data: HappinessConditionsData
}) {
  return (
    <>
      <BlockHeading>{data.headings.needs}</BlockHeading>
      <div className="mt-3">
        <FacetList actionLabel={content.ui.reportFacetActionLabel} facets={data.needs} />
      </div>

      <div className="mt-7">
        <BlockHeading>{data.headings.environments}</BlockHeading>
        <div className="mt-3">
          <FacetList actionLabel={content.ui.reportFacetActionLabel} facets={data.environments} />
        </div>
      </div>

      <ClosingNote>{data.meaning}</ClosingNote>
    </>
  )
}

export function InterestProfileSection({ content, data }: { content: DeepTypeContent; data: InterestProfileData }) {
  return (
    <>
      <BlockHeading>{data.headings.interests}</BlockHeading>
      <div className="mt-3">
        <FacetList actionLabel={content.ui.reportFacetActionLabel} facets={data.interests} />
      </div>

      <div className="mt-7">
        <BlockHeading>{data.headings.purposes}</BlockHeading>
        <div className="mt-3">
          <FacetList actionLabel={content.ui.reportFacetActionLabel} facets={data.purposes} />
        </div>
      </div>

      <ClosingNote>{data.meaning}</ClosingNote>
    </>
  )
}
