export { BattleBriefing } from './BattleBriefing'
export { BattleCommandControls, BattleLaunch } from './BattleCommandCenter'
export { BattleDirectives } from './BattleDirectives'
export { EnemyFormation, PlayerFormation } from './BattleFormations'
export { BattleReadiness } from './BattleReadiness'
export { CampActions, CampUndoNotice, QuartermasterLedger } from './CampInvestments'
export { CampOverview } from './CampOverview'
export { CampRosterGrid, SelectedUnitReadout } from './CampRoster'
export { MobileCommandDock } from './MobileCommandDock'
export { TutorialCoach } from './TutorialCoach'

export function CampaignStageGate({ onReady }: { onReady: (ready: true) => void }) {
  useEffect(() => onReady(true), [onReady])
  return null
}

import { useEffect } from 'react'
