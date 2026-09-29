import { STATIONS, type StationId } from '../../content/stations'
import { josa } from '../../shared/format'
import {
  HoldAction,
  WorkActions,
  WorkBlocker,
  WorkButton,
  WorkHeader,
  WorkHud,
  WorkLink,
  WorkLinks,
  WorkMeter,
  WorkNote,
} from '../../shared/ui/WorkControls'
import { craftBlocker } from '../../simulation/guidance'
import type { GameState } from '../../simulation/state'
import { isReusableCup } from '../inventory/cups'
import { ProductionControls } from '../production/ProductionControls'
import { ProductionGauge } from '../production/ProductionGauge'
import { workReading, workTitle } from '../production/presentation'
import { PRODUCTION_EPSILON, type WorkStep } from '../production/workflow'
import { CUSTOMER_STATUS } from '../service/customer'
import {
  craftingAt,
  cupRecipe,
  misplacedVessels,
  operationFor,
  stepVessels,
  vesselBusy,
  vesselName,
  vesselToPick,
} from './rules'

type Props = {
  state: GameState
  target: StationId | null
  active: boolean
  onUse: (station: StationId) => void
  onStop: () => void
  onTool: (station: StationId) => void
  onConfirm: (station: StationId, observation?: { id: string; value: boolean }) => void
  onChoose: (station: StationId, key: string, value: string) => void
  onMove: (station: StationId) => void
  onDiscard: () => void
}

type Cup = NonNullable<GameState['cup']>

export default function CraftingHud({ state, target, ...handlers }: Props) {
  const cup = state.cup
  if (!cup || !target || !craftingAt(state, target)) {
    return null
  }

  return (
    <WorkHud aria-label="직접 제조 조작">
      <CraftingWork state={state} cup={cup} station={target} {...handlers} />
    </WorkHud>
  )
}

function CraftingWork({
  state,
  cup,
  station,
  active,
  onUse,
  onStop,
  onTool,
  onConfirm,
  onChoose,
  onMove,
  onDiscard,
}: Omit<Props, 'target'> & { cup: Cup; station: StationId }) {
  const craft = cup.craft
  const step = operationFor(cup.recipe, craft)
  const job = state.jobs.find((item) => item.cupId === cup.id && item.station === station)
  const pickable = vesselToPick(state, station)

  if (craft.fault) {
    return (
      <>
        <WorkHeader
          title={step ? workTitle(step) : '다시 만들어야 해요'}
          value={step ? (workReading(step, craft.progress) ?? undefined) : undefined}
        />
        {step && <ProductionGauge session={craft} step={step} />}
        <WorkBlocker reason={craft.fault} fix="폐기 버튼을 길게 눌러 정리하고 새 컵으로 시작하세요." fault />
        <WorkLinks>
          <HoldAction onConfirm={onDiscard}>{isReusableCup(craft.kind) ? '비우고 세척 대기로' : '컵 폐기'}</HoldAction>
        </WorkLinks>
      </>
    )
  }

  if (job) {
    const left = Math.max(0, Math.ceil(job.endsAt - state.time))

    return (
      <>
        <WorkHeader title={`${job.label} 중`} value={`${left}초`} />
        <WorkMeter
          label={job.label}
          ratio={(state.time - job.startedAt) / Math.max(PRODUCTION_EPSILON, job.endsAt - job.startedAt)}
          valueText={`${left}초 남음`}
        />
        <WorkNote>끝나면 알려줘요. 그동안 다른 단계를 이어가도 돼요.</WorkNote>
        {pickable && (
          <WorkLinks>
            <WorkLink shortcut="E" onUse={() => onMove(station)}>
              {vesselName(cup, pickable)} 집기
            </WorkLink>
          </WorkLinks>
        )}
      </>
    )
  }

  if (step?.station === station) {
    return (
      <>
        <ProductionControls
          session={craft}
          step={step}
          active={active}
          blocker={stepBlocker(state, cup, step)}
          onTool={() => onTool(station)}
          onUse={() => onUse(station)}
          onStop={onStop}
          onConfirm={() => onConfirm(station)}
          onChoose={(key, value) => onChoose(station, key, value)}
          onObserve={(id, value) => onConfirm(station, { id, value })}
        />
        {pickable && !craft.tool && craft.progress <= PRODUCTION_EPSILON && (
          <WorkLinks>
            <WorkLink shortcut="E" onUse={() => onMove(station)}>
              {vesselName(cup, pickable)} 집기
            </WorkLink>
          </WorkLinks>
        )}
      </>
    )
  }

  if (!step) {
    const customer = state.customer

    return (
      <>
        <WorkHeader title={customer?.stage === 'pickup' ? '전달 준비' : '제조 완료'} />
        {customer?.stage !== 'pickup' && (
          <WorkNote>{customer ? `손님 ${CUSTOMER_STATUS[customer.stage]}` : '응대할 손님이 없어요.'}</WorkNote>
        )}
        {customer?.stage === 'pickup' && station === 'pickup' && (
          <WorkActions>
            <WorkButton shortcut="F" primary onUse={() => onConfirm(station)}>
              음료 전달
            </WorkButton>
          </WorkActions>
        )}
        <WorkLinks>
          <WorkLink shortcut="E" onUse={() => onMove(station)}>
            컵 집기
          </WorkLink>
        </WorkLinks>
      </>
    )
  }

  const needed = !!pickable && stepVessels(step, cupRecipe(cup).vesselId).includes(pickable)

  return (
    <>
      <WorkHeader title={`다음 · ${STATIONS[step.station].name}`} />
      {pickable && (
        <WorkActions>
          <WorkButton shortcut="E" primary={needed} onUse={() => onMove(station)}>
            {vesselName(cup, pickable)} 집기
          </WorkButton>
        </WorkActions>
      )}
    </>
  )
}

function stepBlocker(state: GameState, cup: Cup, step: WorkStep) {
  if (!cup.craft.sticker) {
    return { reason: '주문 스티커를 먼저 붙여주세요', fix: '컵을 들고 스티커 프린터에서 작업 버튼을 누르세요.' }
  }
  const misplaced = misplacedVessels(cup, step)[0]
  if (misplaced) {
    const name = vesselName(cup, misplaced.id)
    return {
      reason: `${josa(name, '이', '가')} 여기에 없어요`,
      fix:
        misplaced.place && misplaced.place !== 'hand'
          ? `${STATIONS[misplaced.place].name}에서 집어 와 놓으세요.`
          : `${josa(name, '을', '를')} 내려놓으세요.`,
    }
  }
  const busy = stepVessels(step, cupRecipe(cup).vesselId).find((id) => vesselBusy(state, cup, id))
  if (busy) {
    return {
      reason: `${josa(vesselName(cup, busy), '이', '가')} 아직 작동 중이에요`,
      fix: '끝나면 이어서 할 수 있어요.',
    }
  }
  return craftBlocker(state, cup.craft, step)
}
