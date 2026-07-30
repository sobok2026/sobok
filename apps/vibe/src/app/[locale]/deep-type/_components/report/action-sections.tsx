import { cn } from '@/utils/cn'

import type {
  ContextShiftData,
  FitAndFrictionData,
  ReflectionQuestionsData,
  RoleFamiliesData,
  ThreePathsData,
  WeekQuestData,
} from '../../_lib/api'
import { CodeCompare, PathFork, QuestSpine } from './art'
import { BlockHeading, ClosingNote, ConfidenceBadge, Field, Kicker } from './primitives'

// The six sections a reader acts on. Where the reading half answers "where do I stand", these answer "what do
// I do this week" — so they are drawn as things with edges: cards with a confidence badge, a seven-day spine,
// three routes at equal weight, a two-column fit and friction table, three questions to carry out the door.

export function RoleFamiliesSection({ data }: { data: RoleFamiliesData }) {
  return (
    <>
      <ul className="grid gap-4">
        {data.cards.map((card) => (
          <li className="rounded-3xl border border-page-border bg-white p-4 sm:p-5" key={card.family.name}>
            <div className="flex items-start justify-between gap-3">
              <p className="break-keep font-black text-base">{card.family.name}</p>
              <ConfidenceBadge label={card.confidenceLabel} level={card.confidence} />
            </div>
            <p className="mt-2 break-keep text-page-ink/72 text-sm leading-6">{card.family.summary}</p>

            <div className="mt-4 grid gap-1.5">
              <Field label={data.labels.whyFit} value={card.family.whyFit} />
              <Field label={data.labels.environment} value={card.family.environment} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <BlockHeading>{data.labels.dailyWork}</BlockHeading>
                <BulletList items={card.family.dailyWork} />
              </div>
              <div>
                <BlockHeading>{data.labels.checkPoints}</BlockHeading>
                <BulletList items={card.family.checkPoints} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-page-soft/70 p-3">
              <Kicker>{data.labels.experiment}</Kicker>
              <p className="mt-1.5 break-keep text-page-ink/72 text-sm leading-6">{card.family.experiment}</p>
            </div>

            <div className="mt-4 border-page-border border-t pt-3">
              <div className="flex items-center gap-2">
                <p className="font-black text-page-ink/64 text-xs">{data.labels.carryOver}</p>
                <ConfidenceBadge label={card.carryOverLabel} level={card.carryOver.confidence} />
              </div>
              <p className="mt-1.5 break-keep text-page-ink/56 text-xs leading-5">{card.carryOver.text}</p>
            </div>

            <p className="mt-3 break-keep text-page-ink/48 text-xs leading-5">
              <span className="text-page-ink/40">{data.labels.examples}</span>
              <span aria-hidden="true"> — </span>
              {card.family.exampleRoles.join(' · ')}
            </p>
          </li>
        ))}
      </ul>

      <ClosingNote>{data.notice}</ClosingNote>
    </>
  )
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-2 grid gap-1.5">
      {items.map((item) => (
        <li className="flex gap-2 break-keep text-page-ink/68 text-sm leading-6" key={item}>
          <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-page-accent" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The week as a week. Seven days on one spine, each with the minutes it takes and the check that says it is
 * done — §9.2's ten fields laid out as a plan rather than run together into a paragraph, which is what made a
 * quest that fits in half an hour a day read like homework.
 */
export function WeekQuestSection({ data }: { data: WeekQuestData }) {
  return (
    <>
      <ol className="grid gap-5">
        {data.days.map((day, index) => (
          <li className="flex gap-3" key={day.day}>
            <QuestSpine day={day.day} last={index === data.days.length - 1} />
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="break-keep font-black text-sm">{day.title}</p>
                <span className="rounded-full bg-page-soft px-2 py-0.5 font-bold text-page-ink/56 text-xs tabular-nums">
                  {data.labels.minutes} {day.estimatedMinutes}
                  {data.labels.minutesUnit}
                </span>
              </div>
              <p className="mt-1 break-keep text-page-ink/48 text-xs leading-5">{day.purpose}</p>

              {day.taskAnchor ? (
                <div className="mt-3 rounded-2xl bg-page-accent/8 px-3 py-2">
                  <Field label={day.taskAnchor.label} value={day.taskAnchor.value} />
                </div>
              ) : null}
              <p className="mt-2.5 break-keep text-page-ink/76 text-sm leading-6">{day.task}</p>

              <div className="mt-3 grid gap-1">
                <Field label={data.labels.question} value={day.reflectionQuestion} />
                <Field label={data.labels.done} value={day.completionCheck} />
              </div>
              <p className="mt-2 break-keep text-page-ink/44 text-xs leading-5">{day.safetyNote}</p>
            </div>
          </li>
        ))}
      </ol>

      <ClosingNote>{data.closing}</ClosingNote>
    </>
  )
}

/**
 * The two codes side by side. The grid is the section: a reader who has to compare two four-letter strings
 * letter by letter has been given the data and not the finding.
 */
export function ContextShiftSection({ data }: { data: ContextShiftData }) {
  return (
    <>
      <div className="rounded-3xl bg-page-soft/70 p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-page-ink/44">{data.labels.declared}</span>
          <span className="font-black text-page-ink/64 tracking-widest">{data.declaredCode}</span>
        </div>
        <div className="mt-3">
          <CodeCompare axes={data.axes} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-page-ink/44">{data.labels.measured}</span>
          <span className="font-black text-page-accent tracking-widest">{data.measuredCode}</span>
        </div>
      </div>

      <ul className="mt-5 grid gap-4">
        {data.axes.map((axis) => (
          <li key={axis.id}>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 shrink-0 rounded-full', axis.matched ? 'bg-page-ink/24' : 'bg-page-accent')}
              />
              <p className="break-keep font-black text-sm">{axis.axisName}</p>
              <p className="ml-auto shrink-0 text-page-ink/48 text-xs">
                {axis.declared.label}
                <span aria-hidden="true"> / </span>
                {axis.measured.label}
              </p>
            </div>
            <p className="mt-1.5 break-keep text-page-ink/68 text-sm leading-6">{axis.note}</p>
          </li>
        ))}
      </ul>

      <ClosingNote>{data.closing}</ClosingNote>
    </>
  )
}

export function FitAndFrictionSection({ data }: { data: FitAndFrictionData }) {
  return (
    <>
      <div className="rounded-3xl bg-page-soft/70 p-4">
        <p className="break-keep text-page-ink/68 text-sm leading-6">{data.contextNote}</p>
        <div className="mt-3">
          <ConfidenceBadge label={`${data.labels.confidence} · ${data.confidenceLabel}`} level={data.confidence} />
        </div>
      </div>

      <div className="mt-5">
        <BlockHeading>{data.labels.conditions}</BlockHeading>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {data.conditions.map((facet) => (
            <li
              className="rounded-full border border-page-border bg-white px-3 py-1 font-bold text-page-ink/68 text-xs"
              key={facet.id}
            >
              {facet.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <BlockHeading>{data.labels.fit}</BlockHeading>
          <ul className="mt-3 grid gap-3">
            {data.fits.map((fit) => (
              <li className="rounded-2xl border border-page-border bg-white p-3" key={fit.title}>
                <p className="break-keep font-black text-sm">{fit.title}</p>
                <div className="mt-2 grid gap-1">
                  <Field label={data.labels.evidence} value={fit.evidence} />
                  <Field label={data.labels.betterUse} value={fit.betterUse} />
                </div>
                <p className="mt-2 break-keep text-page-ink/48 text-xs leading-5">{fit.possibility}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <BlockHeading>{data.labels.friction}</BlockHeading>
          <ul className="mt-3 grid gap-3">
            {data.frictions.map((friction) => (
              <li className="rounded-2xl border border-page-border bg-white p-3" key={friction.title}>
                <p className="break-keep font-black text-sm">{friction.title}</p>
                <p className="mt-1.5 break-keep text-page-ink/68 text-sm leading-6">{friction.condition}</p>
                <div className="mt-2 grid gap-1">
                  <Field label={data.labels.evidence} value={friction.evidence} />
                  <Field label={data.labels.check} value={friction.checkQuestion} />
                  <Field label={data.labels.adjust} value={friction.adjustment} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

/** Three routes at equal weight. Nothing here marks one as recommended — that is the first guardrail. */
export function ThreePathsSection({ data }: { data: ThreePathsData }) {
  return (
    <>
      <PathFork />

      <ul className="mt-2 grid gap-4">
        {data.paths.map((path) => (
          <li className="rounded-3xl border border-page-border bg-white p-4" key={path.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="break-keep font-black text-base">{path.title}</p>
              <ConfidenceBadge label={path.confidenceLabel} level={path.confidence} />
            </div>
            <p className="mt-2 break-keep text-page-ink/68 text-sm leading-6">{path.purpose}</p>
            <BulletList items={path.actions} />
            {path.note ? <p className="mt-3 break-keep text-page-ink/48 text-xs leading-5">{path.note}</p> : null}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl bg-page-soft/70 p-3">
        <Kicker>{data.guardrailsHeading}</Kicker>
        <ul className="mt-2 grid gap-1">
          {data.guardrails.map((rail) => (
            <li className="break-keep text-page-ink/64 text-xs leading-5" key={rail}>
              {rail}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

/** The close. Three questions the report cannot answer, numbered so they can be carried out the door. */
export function ReflectionQuestionsSection({ data }: { data: ReflectionQuestionsData }) {
  return (
    <>
      <ol className="grid gap-4">
        {data.questions.map((question, index) => (
          <li className="flex gap-3" key={question.text}>
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-page-accent/40 font-black text-page-accent text-xs tabular-nums"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="break-keep font-bold text-page-ink/84 leading-7">{question.text}</p>
              <p className="mt-1 text-page-ink/40 text-xs">{question.source}</p>
            </div>
          </li>
        ))}
      </ol>

      <ClosingNote>{data.closing}</ClosingNote>
    </>
  )
}
