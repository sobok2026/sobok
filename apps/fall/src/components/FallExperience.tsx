'use client'

import { useEffect, useState } from 'react'

import EndingScreen from '@/components/EndingScreen'
import ExperienceChrome from '@/components/ExperienceChrome'
import ExperienceScenes, { type DailyAction } from '@/components/ExperienceScenes'
import IntroScreen from '@/components/IntroScreen'
import LaterExperienceScenes from '@/components/LaterExperienceScenes'
import ProfileComposer from '@/components/ProfileComposer'
import {
  type Coordination,
  type DeletionResponse,
  type DisclosureState,
  type Discovery,
  type EmploymentExit,
  type EvidenceMode,
  type ExposureRoute,
  type FirstResponse,
  type LegalView,
  type MonitoringResponse,
  type NightResponse,
  type Profile,
  type PublicResponse,
  type RecruitmentResponse,
  type RelationshipResponse,
  rankExposureRoutes,
  type Stage,
  type WorkResponse,
} from '@/lib/experience'

type Session = {
  profile: Profile
  disclosures: DisclosureState
  primaryRoute: ExposureRoute
  secondaryRoute: ExposureRoute
}

const LATE_STAGES = new Set<Stage>([
  'workplaceCall',
  'workplaceResult',
  'relationships',
  'relationshipResult',
  'locationFear',
  'locationResult',
  'supportIntake',
  'supportResult',
  'deletedNotice',
  'deletionResult',
  'publicReaction',
  'publicReactionResult',
  'employment',
  'employmentResult',
  'coordination',
  'jobSearch',
  'jobRejection',
  'investigation',
  'investigationResult',
  'judgment',
  'judgmentResult',
  'newRelationship',
  'networkFinal',
  'nameErased',
])

/** Stages that own the whole viewport instead of rendering inside the phone frame. */
const FULL_SCREEN_STAGES = new Set<Stage>(['intro', 'profile', 'ending'])

/** Scenes the reader only watches. Going back lands on the last scene they acted on,
    so these are skipped — `morning` is excluded because its notifications are tappable. */
const PASS_THROUGH_STAGES = new Set<Stage>([
  'identity',
  'friendDelay',
  'responseResult',
  'workplaceResult',
  'relationshipResult',
  'locationResult',
  'supportResult',
  'deletionResult',
  'publicReactionResult',
  'employmentResult',
  'jobRejection',
  'investigationResult',
  'judgmentResult',
  'nameErased',
])

export default function FallExperience() {
  const [session, setSession] = useState<Session | null>(null)
  const [stage, setStage] = useState<Stage>('intro')
  const [history, setHistory] = useState<Stage[]>([])
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [discovery, setDiscovery] = useState<Discovery>('direct')
  const [response, setResponse] = useState<FirstResponse | null>(null)
  const [openedRoute, setOpenedRoute] = useState<ExposureRoute | null>(null)
  const [dailyActions, setDailyActions] = useState<DailyAction[]>([])
  const [workResponse, setWorkResponse] = useState<WorkResponse | null>(null)
  const [relationshipResponse, setRelationshipResponse] = useState<RelationshipResponse | null>(null)
  const [nightResponse, setNightResponse] = useState<NightResponse | null>(null)
  const [evidenceMode, setEvidenceMode] = useState<EvidenceMode | null>(null)
  const [deletionResponse, setDeletionResponse] = useState<DeletionResponse | null>(null)
  const [publicResponse, setPublicResponse] = useState<PublicResponse | null>(null)
  const [employmentExit, setEmploymentExit] = useState<EmploymentExit | null>(null)
  const [coordination, setCoordination] = useState<Coordination | null>(null)
  const [recruitmentResponse, setRecruitmentResponse] = useState<RecruitmentResponse | null>(null)
  const [legalView, setLegalView] = useState<LegalView | null>(null)
  const [monitoringResponse, setMonitoringResponse] = useState<MonitoringResponse | null>(null)

  useEffect(() => {
    const delay = getAutomaticStageDelay(stage)

    // The exit dialog holds the story still so the reader can decide.
    if (!delay || exitConfirmOpen) {
      return
    }

    const timeout = window.setTimeout(() => {
      setHistory((current) => [...current, stage])
      setStage(nextAutomaticStage(stage))
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [stage, exitConfirmOpen])

  function goToStage(next: Stage) {
    setHistory((current) => [...current, stage])
    setStage(next)
  }

  function goBack() {
    setHistory((current) => {
      const remaining = [...current]

      while (remaining.length > 0) {
        const previous = remaining.pop() as Stage

        if (!PASS_THROUGH_STAGES.has(previous)) {
          setStage(previous)
          return remaining
        }
      }

      setStage('profile')
      return []
    })
  }

  function resetToIntro() {
    setExitConfirmOpen(false)
    setSession(null)
    setHistory([])
    setStage('intro')
    setDiscovery('direct')
    setResponse(null)
    setOpenedRoute(null)
    setDailyActions([])
    setWorkResponse(null)
    setRelationshipResponse(null)
    setNightResponse(null)
    setEvidenceMode(null)
    setDeletionResponse(null)
    setPublicResponse(null)
    setEmploymentExit(null)
    setCoordination(null)
    setRecruitmentResponse(null)
    setLegalView(null)
    setMonitoringResponse(null)
  }

  function startExperience(profile: Profile, disclosures: DisclosureState) {
    const rankedRoutes = rankExposureRoutes(profile, disclosures)

    setSession({
      profile,
      disclosures,
      primaryRoute: rankedRoutes[0].route,
      secondaryRoute: rankedRoutes[1].route,
    })
    goToStage('identity')
  }

  function handleDailyAction(action: DailyAction) {
    setDailyActions((current) => (current.includes(action) ? current : [...current, action]))

    if (action === 'work') {
      goToStage('unknownMessage')
    }
  }

  function handleDiscovery(nextDiscovery: Discovery) {
    setDiscovery(nextDiscovery)

    if (nextDiscovery === 'direct') {
      goToStage('searchResults')
      return
    }

    goToStage(nextDiscovery === 'friend' ? 'friendDelay' : 'accountGone')
  }

  function handleSecondaryOpen(route: ExposureRoute) {
    setOpenedRoute(route)
    goToStage('responseChoice')
  }

  function handleResponse(nextResponse: FirstResponse) {
    setResponse(nextResponse)
    goToStage('responseResult')
  }

  function handleWorkResponse(nextResponse: WorkResponse) {
    setWorkResponse(nextResponse)
    goToStage('workplaceResult')
  }

  function handleRelationshipResponse(nextResponse: RelationshipResponse) {
    setRelationshipResponse(nextResponse)
    goToStage('relationshipResult')
  }

  function handleNightResponse(nextResponse: NightResponse) {
    setNightResponse(nextResponse)
    goToStage('locationResult')
  }

  function handleEvidenceMode(nextMode: EvidenceMode) {
    setEvidenceMode(nextMode)
    goToStage('supportResult')
  }

  function handleDeletionResponse(nextResponse: DeletionResponse) {
    setDeletionResponse(nextResponse)
    goToStage('deletionResult')
  }

  function handlePublicResponse(nextResponse: PublicResponse) {
    setPublicResponse(nextResponse)
    goToStage('publicReactionResult')
  }

  function handleEmploymentExit(nextExit: EmploymentExit) {
    setEmploymentExit(nextExit)
    goToStage('employmentResult')
  }

  function handleCoordination(nextCoordination: Coordination) {
    setCoordination(nextCoordination)
    goToStage('jobSearch')
  }

  function handleRecruitmentResponse(nextResponse: RecruitmentResponse) {
    setRecruitmentResponse(nextResponse)
    goToStage('jobRejection')
  }

  function handleLegalView(nextView: LegalView) {
    setLegalView(nextView)
    goToStage('investigationResult')
  }

  function handleMonitoringResponse(nextResponse: MonitoringResponse) {
    setMonitoringResponse(nextResponse)
    goToStage('judgmentResult')
  }

  const inStory = !FULL_SCREEN_STAGES.has(stage) && session !== null

  return (
    <div className="fall-shell" data-stage={stage} data-mode={inStory ? 'story' : 'page'}>
      {inStory ? (
        <ExperienceChrome
          canGoBack={history.length > 0}
          confirmOpen={exitConfirmOpen}
          onBack={goBack}
          onCancelExit={() => setExitConfirmOpen(false)}
          onExit={resetToIntro}
          onRequestExit={() => setExitConfirmOpen(true)}
          stage={stage}
        />
      ) : null}

      {stage === 'intro' ? (
        <IntroScreen onStart={() => goToStage('profile')} />
      ) : !session || stage === 'profile' ? (
        <ProfileComposer onBack={resetToIntro} onStart={startExperience} />
      ) : stage === 'ending' ? (
        <EndingScreen
          disclosures={session.disclosures}
          employmentExit={employmentExit}
          monitoringResponse={monitoringResponse}
          onRestart={resetToIntro}
        />
      ) : LATE_STAGES.has(stage) ? (
        <LaterExperienceScenes
          coordination={coordination}
          deletionResponse={deletionResponse}
          employmentExit={employmentExit}
          evidenceMode={evidenceMode}
          legalView={legalView}
          monitoringResponse={monitoringResponse}
          nightResponse={nightResponse}
          onCoordination={handleCoordination}
          onDeletionResponse={handleDeletionResponse}
          onEmploymentExit={handleEmploymentExit}
          onEraseName={() => goToStage('nameErased')}
          onEvidenceMode={handleEvidenceMode}
          onLegalView={handleLegalView}
          onMonitoringResponse={handleMonitoringResponse}
          onNewRelationshipReply={() => goToStage('networkFinal')}
          onNightResponse={handleNightResponse}
          onPublicResponse={handlePublicResponse}
          onRecruitmentResponse={handleRecruitmentResponse}
          onRelationshipResponse={handleRelationshipResponse}
          onWorkResponse={handleWorkResponse}
          openedRoute={openedRoute}
          primaryRoute={session.primaryRoute}
          profile={session.profile}
          publicResponse={publicResponse}
          recruitmentResponse={recruitmentResponse}
          relationshipResponse={relationshipResponse}
          stage={stage}
          workResponse={workResponse}
        />
      ) : (
        <ExperienceScenes
          dailyActions={dailyActions}
          discovery={discovery}
          onAccountSearch={() => goToStage('searchResults')}
          onAnswerCall={() => goToStage('workplaceCall')}
          onDailyAction={handleDailyAction}
          onDiscovery={handleDiscovery}
          onFriendOpen={() => goToStage('searchResults')}
          onPrimaryClose={() => goToStage('secondaryRoute')}
          onResponse={handleResponse}
          onSearchAction={() => goToStage('primaryRoute')}
          onSecondaryOpen={handleSecondaryOpen}
          openedRoute={openedRoute}
          primaryRoute={session.primaryRoute}
          profile={session.profile}
          response={response}
          secondaryRoute={session.secondaryRoute}
          stage={stage}
        />
      )}
    </div>
  )
}

function getAutomaticStageDelay(stage: Stage): number | null {
  switch (stage) {
    case 'identity':
      return 1800
    case 'morning':
      return 12000
    case 'friendDelay':
      return 8000
    case 'responseResult':
      return 5200
    case 'workplaceResult':
      return 4800
    case 'relationshipResult':
      return 4400
    case 'locationResult':
      return 4600
    case 'supportResult':
      return 6200
    case 'deletionResult':
      return 4600
    case 'publicReactionResult':
      return 5200
    case 'employmentResult':
      return 5200
    case 'jobRejection':
      return 5200
    case 'investigationResult':
      return 6500
    case 'judgmentResult':
      return 4800
    case 'nameErased':
      return 5200
    default:
      return null
  }
}

function nextAutomaticStage(stage: Stage): Stage {
  switch (stage) {
    case 'identity':
      return 'morning'
    case 'morning':
      return 'unknownMessage'
    case 'friendDelay':
      return 'friendReady'
    case 'responseResult':
      return 'incomingCall'
    case 'workplaceResult':
      return 'relationships'
    case 'relationshipResult':
      return 'locationFear'
    case 'locationResult':
      return 'supportIntake'
    case 'supportResult':
      return 'deletedNotice'
    case 'deletionResult':
      return 'publicReaction'
    case 'publicReactionResult':
      return 'employment'
    case 'employmentResult':
      return 'coordination'
    case 'jobRejection':
      return 'investigation'
    case 'investigationResult':
      return 'judgment'
    case 'judgmentResult':
      return 'newRelationship'
    case 'nameErased':
      return 'ending'
    default:
      return stage
  }
}
