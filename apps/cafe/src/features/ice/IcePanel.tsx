import { PanelNow, PanelRow, PanelSection, PanelStatus, RowButton } from '../../shared/ui/PanelControls'
import { HoldAction } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { ICE, iceKilograms } from './rules'

export default function IcePanel({
  state,
  act,
  bar = false,
}: {
  state: GameState
  act: (action: Action) => void
  bar?: boolean
}) {
  const ice = state.ice
  const full = ice.stored >= ICE.capacity
  const running = ice.enabled && !full
  const remaining = ice.cycleStartedAt === null ? 0 : Math.max(0, ICE.cycleSeconds - (state.time - ice.cycleStartedAt))
  const status = ice.enabled ? '자동 제빙' : '전원 꺼짐'

  return (
    <>
      <PanelStatus>
        {bar ? '백룸 제빙기에서 얼음을 담아 이곳에 보충해요.' : 'Ice-O-Matic · 저장고가 차면 자동으로 생산을 멈춰요.'}
      </PanelStatus>
      <PanelNow
        title={bar ? `바에 남은 얼음 ${iceKilograms(ice.bar)}` : status}
        detail={
          running ? `다음 탈빙까지 ${Math.ceil(remaining / 60)}분 · 한 번에 ${iceKilograms(ICE.batchGrams)}` : undefined
        }
      >
        {!bar && (
          <RowButton disabled={ice.bucketHeld} onClick={() => act({ type: 'ice-toggle' })}>
            {ice.enabled ? '제빙 끄기' : '자동 제빙 켜기'}
          </RowButton>
        )}
      </PanelNow>
      <PanelSection title="얼음 보관·운반">
        <PanelRow title="제빙기 저장고" note={`${iceKilograms(ice.stored)} / ${iceKilograms(ICE.capacity)}`}>
          {!bar && (
            <RowButton primary disabled={!ice.stored || ice.bucketHeld} onClick={() => act({ type: 'ice-take' })}>
              얼음통에 담아 들기
            </RowButton>
          )}
        </PanelRow>
        <PanelRow title="바 아이스 빈" note={`${iceKilograms(ice.bar)} / ${iceKilograms(ICE.barCapacity)}`}>
          {bar && ice.bucketHeld && ice.bucket > 0 && (
            <RowButton primary onClick={() => act({ type: 'ice-fill' })}>
              얼음 보충
            </RowButton>
          )}
        </PanelRow>
        {ice.bucketHeld && (
          <PanelRow title="운반 중인 얼음" note={iceKilograms(ice.bucket)}>
            {!bar && ice.bucket > 0 && (
              <HoldAction onConfirm={() => act({ type: 'ice-return' })}>남은 얼음 비우고 통 걸기</HoldAction>
            )}
            {!bar && ice.bucket === 0 && (
              <RowButton onClick={() => act({ type: 'ice-return' })}>빈 얼음통 걸기</RowButton>
            )}
          </PanelRow>
        )}
      </PanelSection>
    </>
  )
}
