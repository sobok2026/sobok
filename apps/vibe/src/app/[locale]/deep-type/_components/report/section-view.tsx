import type { NarrativeSection, ReportSection } from '../../_lib/api'
import type { DeepTypeContent } from '../../_lib/types'
import {
  ContextShiftSection,
  FitAndFrictionSection,
  ReflectionQuestionsSection,
  RoleFamiliesSection,
  ThreePathsSection,
  WeekQuestSection,
} from './action-sections'
import { SectionShell } from './primitives'
import {
  DrainSignatureSection,
  HappinessConditionsSection,
  InterestProfileSection,
  OpeningReadSection,
  StrengthCardsSection,
  WorldJobSection,
} from './reading-sections'

interface ReportSectionViewProps {
  content: DeepTypeContent
  /** The model's paragraph for this section, or null. Always rendered under the engine's own section. */
  narrative: NarrativeSection | null
  section: ReportSection
}

/**
 * One section, drawn as itself. The switch is exhaustive over `ReportSection` by construction — `body` below
 * has no default arm and every key returns — so a thirteenth section key does not compile until someone
 * decides what it looks like. That is the point of the discriminated union: the old renderer took
 * `{ key, title, body }` and printed the body, so a new section rendered as a paragraph and nobody had to
 * notice.
 */
export function ReportSectionView({ content, narrative, section }: ReportSectionViewProps) {
  return (
    <SectionShell intro={section.intro} narrative={narrative?.body ?? null} title={section.title}>
      {body(content, section)}
    </SectionShell>
  )
}

function body(content: DeepTypeContent, section: ReportSection) {
  switch (section.key) {
    case 'openingRead':
      return <OpeningReadSection data={section.data} />
    case 'worldJob':
      return <WorldJobSection content={content} data={section.data} />
    case 'strengthCards':
      return <StrengthCardsSection data={section.data} />
    case 'drainSignature':
      return <DrainSignatureSection data={section.data} />
    case 'happinessConditions':
      return <HappinessConditionsSection data={section.data} />
    case 'interestProfile':
      return <InterestProfileSection data={section.data} />
    case 'roleFamilies':
      return <RoleFamiliesSection data={section.data} />
    case 'contextShift':
      return <ContextShiftSection data={section.data} />
    case 'fitAndFriction':
      return <FitAndFrictionSection data={section.data} />
    case 'threePaths':
      return <ThreePathsSection data={section.data} />
    case 'weekQuest':
      return <WeekQuestSection data={section.data} />
    case 'reflectionQuestions':
      return <ReflectionQuestionsSection data={section.data} />
  }
}
