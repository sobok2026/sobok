import { cn } from '@/utils/cn'

import type {
  DrainSignatureData,
  HappinessConditionsData,
  InterestProfileData,
  OpeningReadData,
  StrengthCardsData,
  WorldJobData,
} from '../../_lib/api'
import { GROUPED_LIST_CLASS_NAME, GROUPED_ROW_CLASS_NAME } from '../../_lib/surface'
import type { DeepTypeContent } from '../../_lib/types'
import { AbilityArtwork } from '../ability-artwork'
import { GemArtwork, InnerArtwork } from '../code-artwork'
import { BandLadder, DrainStrands } from './art'
import { BlockHeading, ClosingNote, FacetList, Field, Kicker } from './primitives'

// The six sections a reader reads to find out where they stand. Each one draws its own shape from its own
// data — the composed opening as kicker paragraphs, the strength cards as cards with their art, the drain
// spread as strands — instead of the twelve identical text blocks the report used to be.

/**
 * Section 11 in generation order, first on screen. The composed reading — one lead sentence, then the reader's
 * banded axes, strength combo, drain spread and interest lead, each with its own kicker.
 *
 * `data.worldJobName` is not printed. The hero two cards above is the job name at 3xl, and repeating it here
 * put the same string on screen three times before the first finding.
 */
export function OpeningReadSection({ data }: { data: OpeningReadData }) {
  return (
    <>
      <p className="break-keep text-page-ink/72 leading-8">{data.lead}</p>

      <div className="mt-6 grid gap-5">
        {data.paragraphs.map((paragraph) => (
          <div key={paragraph.kicker}>
            <Kicker>{paragraph.kicker}</Kicker>
            {paragraph.note ? (
              <p className="mt-1 break-keep font-bold text-page-ink/56 text-xs leading-5">{paragraph.note}</p>
            ) : null}
            <p className="mt-1.5 break-keep text-page-ink/72 text-sm leading-7">{paragraph.text}</p>
          </div>
        ))}
      </div>

      <ClosingNote>{data.closing}</ClosingNote>
    </>
  )
}

/** `data.name` is the hero's h1 and is not repeated here. What this section adds is the two halves it is made of. */
export function WorldJobSection({ content, data }: { content: DeepTypeContent; data: WorldJobData }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <figure>
          <InnerArtwork innerCode={data.codes.inner} />
          <figcaption className="mt-2 text-center text-page-ink/44 text-xs">
            {content.ui.layerInner} · {data.codes.inner}
          </figcaption>
        </figure>
        <figure>
          <GemArtwork gemCode={data.codes.gem} />
          <figcaption className="mt-2 text-center text-page-ink/44 text-xs">
            {content.ui.layerGem} · {data.codes.gem}
          </figcaption>
        </figure>
      </div>

      <dl className={cn('mt-5', GROUPED_LIST_CLASS_NAME, 'sm:grid sm:grid-cols-2 sm:gap-2')}>
        <div className={GROUPED_ROW_CLASS_NAME}>
          <dt className="text-page-ink/44 text-xs">{content.ui.worldJobFamilyLabel}</dt>
          <dd className="mt-1 break-keep font-black text-sm">{data.family.name}</dd>
          <dd className="mt-1.5 break-keep text-page-ink/68 text-sm leading-6">{data.family.method}</dd>
          <dd className="mt-2 break-keep text-page-ink/48 text-xs leading-5">{data.family.role}</dd>
        </div>
        <div className={GROUPED_ROW_CLASS_NAME}>
          <dt className="text-page-ink/44 text-xs">{content.ui.worldJobCoreLabel}</dt>
          <dd className="mt-1 break-keep font-black text-sm">{data.core.name}</dd>
          <dd className="mt-1.5 break-keep text-page-ink/68 text-sm leading-6">{data.core.strength}</dd>
        </div>
      </dl>
    </>
  )
}

/**
 * The cards with their art and their full copy. The paid screen used to print the card name and its one-line
 * `short` while the free screen showed the artwork and the longer `core` — so the report someone paid for was
 * the thinner of the two. All four authored fields are here, and `watch` in particular has never been on
 * screen at all.
 */
export function StrengthCardsSection({ data }: { data: StrengthCardsData }) {
  return (
    <>
      {data.emptyNote ? <p className="break-keep text-page-ink/68 leading-7">{data.emptyNote}</p> : null}

      <div className="grid gap-6">
        {data.groups.map((group) => (
          <div key={group.heading}>
            <BlockHeading>{group.heading}</BlockHeading>
            <ul className="mt-3 grid gap-3">
              {group.cards.map((card) => (
                <li
                  className="flex flex-col overflow-hidden rounded-3xl border border-page-border bg-white sm:flex-row sm:gap-4"
                  key={card.slug}
                >
                  <AbilityArtwork slug={card.slug} />
                  <div className="min-w-0 flex-1 p-4 sm:py-4 sm:pr-4 sm:pl-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="break-keep font-black text-sm leading-5">{card.copy.name}</p>
                      <span className="inline-flex h-5 min-w-9 shrink-0 items-center justify-center rounded-full bg-page-soft px-2 font-bold text-page-ink/56 text-xs">
                        {card.poles.join('')}
                      </span>
                    </div>
                    <p className="mt-2 break-keep text-page-ink/72 text-sm leading-6">{card.copy.core}</p>
                    <p className="mt-2 break-keep text-page-ink/56 text-xs leading-5">{card.copy.shine}</p>
                    <p className="mt-2 break-keep text-page-ink/44 text-xs leading-5">{card.copy.watch}</p>
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
    <div className={cn(data.groups.length > 0 && 'mt-7 border-page-border border-t pt-6')}>
      <BlockHeading>{data.movementHeading}</BlockHeading>
      <ul className="mt-3 grid gap-2.5">
        {data.bandMovement.map((axis) => (
          <li className="flex items-center justify-between gap-3" key={axis.id}>
            <div className="min-w-0">
              <p className="break-keep font-bold text-sm">{axis.name}</p>
              <p className="mt-0.5 break-keep text-page-ink/48 text-xs leading-5">
                {axis.leading} · {axis.band.label} · {axis.shift.label}
              </p>
            </div>
            <BandLadder axis={axis} />
          </li>
        ))}
      </ul>
      {data.splitAxisNames.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-page-soft/70 p-3">
          <Field label={data.splitLabel} value={data.splitAxisNames.join(' · ')} />
          <p className="mt-1.5 break-keep text-page-ink/56 text-xs leading-5">{data.splitNote}</p>
        </div>
      ) : (
        <p className="mt-4 break-keep text-page-ink/48 text-xs leading-5">{data.splitNote}</p>
      )}
      <ClosingNote>{data.clarityNote}</ClosingNote>
    </div>
  )
}

export function DrainSignatureSection({ data }: { data: DrainSignatureData }) {
  return (
    <>
      <div className="flex items-center gap-4 rounded-3xl bg-page-soft/70 p-4">
        <DrainStrands strands={data.strands} />
        <div className="min-w-0">
          <p className="break-keep font-black text-page-accent text-sm">{data.spread.label}</p>
          <p className="mt-1 break-keep text-page-ink/68 text-sm leading-6">{data.spread.detail}</p>
        </div>
      </div>

      <div className="mt-5">
        <FacetList facets={data.leaders} />
      </div>

      {/* The grouped list already draws a rule under itself at compact width, so a second divider here would
          put two lines a margin apart. From `sm` up the list loses its borders and this one has to appear. */}
      <div className="mt-6 sm:border-page-border sm:border-t sm:pt-5">
        <BlockHeading>{data.contrast.sentence}</BlockHeading>
        <div className="mt-3 grid gap-1.5">
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
        </div>
      </div>

      <ClosingNote>{data.meaning}</ClosingNote>
    </>
  )
}

export function HappinessConditionsSection({ data }: { data: HappinessConditionsData }) {
  return (
    <>
      <BlockHeading>{data.headings.needs}</BlockHeading>
      <div className="mt-3">
        <FacetList facets={data.needs} />
      </div>

      <div className="mt-6">
        <BlockHeading>{data.headings.environments}</BlockHeading>
        <div className="mt-3">
          <FacetList facets={data.environments} />
        </div>
      </div>

      <ClosingNote>{data.meaning}</ClosingNote>
    </>
  )
}

export function InterestProfileSection({ data }: { data: InterestProfileData }) {
  return (
    <>
      <BlockHeading>{data.headings.interests}</BlockHeading>
      <div className="mt-3">
        <FacetList facets={data.interests} />
      </div>

      <div className="mt-6">
        <BlockHeading>{data.headings.purposes}</BlockHeading>
        <div className="mt-3">
          <FacetList facets={data.purposes} />
        </div>
      </div>

      <ClosingNote>{data.meaning}</ClosingNote>
    </>
  )
}
