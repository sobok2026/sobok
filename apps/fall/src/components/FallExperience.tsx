'use client'

import { useEffect, useState } from 'react'

import ExperienceScenes, { type DailyAction, type Stage } from '@/components/ExperienceScenes'
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
  type WorkResponse,
} from '@/lib/experience'

type Session = {
  profile: Profile
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
  'ending',
])

export default function FallExperience() {
  const [session, setSession] = useState<Session | null>(null)
  const [stage, setStage] = useState<Stage>('profile')
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

    if (!delay) {
      return
    }

    const timeout = window.setTimeout(() => {
      setStage(nextAutomaticStage(stage))
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [stage])

  function startExperience(profile: Profile, disclosures: DisclosureState) {
    const rankedRoutes = rankExposureRoutes(profile, disclosures)

    setSession({
      profile,
      primaryRoute: rankedRoutes[0].route,
      secondaryRoute: rankedRoutes[1].route,
    })
    setStage('identity')
  }

  function handleDailyAction(action: DailyAction) {
    setDailyActions((current) => (current.includes(action) ? current : [...current, action]))

    if (action === 'work') {
      setStage('unknownMessage')
    }
  }

  function handleDiscovery(nextDiscovery: Discovery) {
    setDiscovery(nextDiscovery)

    if (nextDiscovery === 'direct') {
      setStage('searchResults')
      return
    }

    setStage(nextDiscovery === 'friend' ? 'friendDelay' : 'accountGone')
  }

  function handleSecondaryOpen(route: ExposureRoute) {
    setOpenedRoute(route)
    setStage('responseChoice')
  }

  function handleResponse(nextResponse: FirstResponse) {
    setResponse(nextResponse)
    setStage('responseResult')
  }

  function handleWorkResponse(nextResponse: WorkResponse) {
    setWorkResponse(nextResponse)
    setStage('workplaceResult')
  }

  function handleRelationshipResponse(nextResponse: RelationshipResponse) {
    setRelationshipResponse(nextResponse)
    setStage('relationshipResult')
  }

  function handleNightResponse(nextResponse: NightResponse) {
    setNightResponse(nextResponse)
    setStage('locationResult')
  }

  function handleEvidenceMode(nextMode: EvidenceMode) {
    setEvidenceMode(nextMode)
    setStage('supportResult')
  }

  function handleDeletionResponse(nextResponse: DeletionResponse) {
    setDeletionResponse(nextResponse)
    setStage('deletionResult')
  }

  function handlePublicResponse(nextResponse: PublicResponse) {
    setPublicResponse(nextResponse)
    setStage('publicReactionResult')
  }

  function handleEmploymentExit(nextExit: EmploymentExit) {
    setEmploymentExit(nextExit)
    setStage('employmentResult')
  }

  function handleCoordination(nextCoordination: Coordination) {
    setCoordination(nextCoordination)
    setStage('jobSearch')
  }

  function handleRecruitmentResponse(nextResponse: RecruitmentResponse) {
    setRecruitmentResponse(nextResponse)
    setStage('jobRejection')
  }

  function handleLegalView(nextView: LegalView) {
    setLegalView(nextView)
    setStage('investigationResult')
  }

  function handleMonitoringResponse(nextResponse: MonitoringResponse) {
    setMonitoringResponse(nextResponse)
    setStage('judgmentResult')
  }

  return (
    <div className="fall-shell" data-stage={stage}>
      {stage === 'profile' || !session ? (
        <ProfileComposer onStart={startExperience} />
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
          onEraseName={() => setStage('nameErased')}
          onEvidenceMode={handleEvidenceMode}
          onLegalView={handleLegalView}
          onMonitoringResponse={handleMonitoringResponse}
          onNewRelationshipReply={() => setStage('networkFinal')}
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
          onAccountSearch={() => setStage('searchResults')}
          onAnswerCall={() => setStage('workplaceCall')}
          onDailyAction={handleDailyAction}
          onDiscovery={handleDiscovery}
          onFriendOpen={() => setStage('searchResults')}
          onPrimaryClose={() => setStage('secondaryRoute')}
          onResponse={handleResponse}
          onSearchAction={() => setStage('primaryRoute')}
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
