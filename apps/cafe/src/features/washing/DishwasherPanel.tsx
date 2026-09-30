import { PanelNow, PanelRow, PanelSection, PanelStatus, RowButton } from '../../shared/ui/PanelControls'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { DISHWASHER, dishwasherJob, rackCount, rackSlots, rackSpace, WASH_NAMES, washItems, washStock } from './rules'

export default function DishwasherPanel({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const machine = state.dishwasher
  const job = dishwasherJob(state)
  const count = rackCount(machine.rack)
  const space = rackSpace(machine.rack)

  return (
    <>
      <PanelStatus>후드형 세척기 · 후드를 내리면 운전하고 올리면 멈춰요.</PanelStatus>
      {job && (
        <PanelNow
          title="세척 운전 중"
          detail={`${Math.max(0, Math.ceil(job.endsAt - state.time))}초 남음 · 다른 업무를 할 수 있어요.`}
        />
      )}
      {!job && machine.clean && (
        <PanelNow
          title="세척 완료"
          detail="후드를 올리고 랙을 건조대에 꺼내세요. 건조대에서 용기를 집어 바에 정리해요."
        />
      )}
      <PanelSection title="세척기">
        <PanelRow
          title={machine.hoodOpen ? '후드 올라감' : '후드 내려감'}
          note={`랙 ${count}개 · ${space}/${DISHWASHER.capacity}칸`}
        >
          <RowButton primary onClick={() => act({ type: 'dishwasher-hood' })}>
            {machine.hoodOpen ? '후드 내리기' : '후드 올리기'}
          </RowButton>
        </PanelRow>
        {!job && !machine.clean && (
          <PanelRow title="세척·헹굼" note="용기를 담고 후드를 내리세요. 중간에 올리면 세척이 중단돼요." />
        )}
        {count > 0 && (
          <PanelRow title={machine.clean ? '세척한 랙' : '적재한 랙'}>
            <RowButton
              primary={machine.clean}
              disabled={!!job || !machine.hoodOpen}
              onClick={() => act({ type: 'dishwasher-unload' })}
            >
              {machine.clean ? '건조대에 꺼내기' : '회수대로 되돌리기'}
            </RowButton>
          </PanelRow>
        )}
      </PanelSection>
      <PanelSection title="세척 대기 용기">
        {washItems
          .filter((item) => washStock(state, item).dirty || machine.rack[item])
          .map((item) => (
            <PanelRow
              key={item}
              title={WASH_NAMES[item]}
              note={`회수대 ${washStock(state, item).dirty}개 · 랙 ${machine.rack[item] ?? 0}개`}
            >
              <RowButton
                disabled={
                  !!job ||
                  !machine.hoodOpen ||
                  machine.clean ||
                  !washStock(state, item).dirty ||
                  space + rackSlots(item) > DISHWASHER.capacity
                }
                onClick={() => act({ type: 'dishwasher-load', item })}
              >
                랙에 담기
              </RowButton>
            </PanelRow>
          ))}
      </PanelSection>
    </>
  )
}
