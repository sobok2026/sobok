import { COLD_BREW_HOURS, INGREDIENTS, type IngredientId, RECIPES, STATIONS, type StationId } from '../game/catalog'
import { CLEANING_SECONDS } from '../game/cleaning'
import { isContinuous, operationFor, readyToConfirm, TOOL_NAMES } from '../game/crafting'
import { PREP_TOOL_NAMES, PREPARATIONS, preparationStep } from '../game/preparation'
import type { GameState } from '../game/state'
import { available, closingTasks, nextStep, suggestedStation } from '../game/store'
import { WASH_STEPS } from '../game/washing'

type Tip = { title: string; action: string; reason: string; fault?: boolean; station?: StationId }
export function firstOrdersDone(state: GameState) {
  return state.orderNumber > 2 || (state.orderNumber === 2 && !!state.customer?.visit)
}
function materialTip(state: GameState, ingredient: IngredientId): Tip {
  const definition = INGREDIENTS[ingredient]
  const pending = state.batches.find(
    (batch) =>
      batch.ingredient === ingredient &&
      batch.amount > 0 &&
      batch.openedAt !== null &&
      batch.location !== 'bar' &&
      (batch.expiresAt === null || batch.expiresAt > state.time),
  )
  if (pending)
    return {
      title: `${definition.name} 사용 준비`,
      action: `${pending.location === 'prep' ? '준비대' : '창고'}에서 ${pending.labelled ? `${definition.storage === 'fridge' ? '냉장고' : '실온 선반'}에 보관하세요.` : '날짜 확인 후 라벨을 붙이세요.'}`,
      reason: '개봉·제조만으로는 사용할 수 없어요. 라벨과 보관까지 마쳐야 해요.',
    }
  if (ingredient === 'foam' || ingredient === 'mocha')
    return {
      title: `${definition.name} 준비가 필요해요`,
      action: state.tools.clean
        ? `준비대에서 ${definition.name} 제조를 선택하세요.`
        : '세척대에서 피처를 씻고 옆 도구 선반에 먼저 정리하세요.',
      reason: '폼과 바모카는 완성한 뒤 라벨을 붙이고 보관해야 음료에 넣을 수 있어요.',
    }
  if (ingredient === 'coldBrew')
    return {
      title: '추출액을 준비하세요',
      action: '창고에서 콜드 브루 추출을 시작하세요. 추출 중이면 완료를 기다려주세요.',
      reason: `${COLD_BREW_HOURS}시간 추출은 마감 후 다음 날로 넘어갈 때도 진행돼요.`,
    }
  const sealed = state.batches.some(
    (batch) => batch.ingredient === ingredient && batch.amount > 0 && batch.openedAt === null,
  )
  return {
    title: `${definition.name} 보충이 필요해요`,
    action: `창고에서 ${sealed ? '미개봉 원팩을 여세요.' : '원팩을 입고한 뒤 개봉하세요.'}`,
    reason: `라벨을 붙이고 ${definition.storage === 'fridge' ? '냉장고' : '실온 선반'}에 보관하면 사용할 수 있어요.`,
  }
}
function currentTip(state: GameState, panel: StationId | null): Tip {
  const cup = state.cup
  if (state.supplyDelivery)
    return {
      title: '보충품을 먼저 놓으세요',
      action: '컨디먼트 바에서 E로 소모품을 채우세요.',
      reason: '창고에서 E로 다시 내려놓을 수도 있어요. 손을 비워야 다른 도구를 집을 수 있어요.',
    }
  if (cup?.craft.location === 'hand' && (state.preparation || state.washing))
    return {
      title: '컵을 먼저 내려놓으세요',
      station: nextStep(state)?.station ?? 'pickup',
      action: `${STATIONS[nextStep(state)?.station ?? 'pickup'].name}를 보고 E를 누르세요.`,
      reason: '컵을 내려놓은 뒤 부재료 준비나 피처 세척을 이어갈 수 있어요.',
    }
  if (state.cleaning) {
    const work = state.cleaning
    if (work.heldCups)
      return {
        title: '회수한 컵을 비우세요',
        action: '분리수거함으로 가져가 E로 넣으세요.',
        reason: '얼룩이 남아 있으면 원래 자리로 돌아가 닦아주세요.',
      }
    if (work.stage === 'collect')
      return {
        title: '사용한 컵을 회수하세요',
        action: `${STATIONS[work.station].name}에서 E로 컵을 집으세요.`,
        reason: '컵을 모두 분리수거함에 옮긴 뒤 얼룩을 닦아요.',
      }
    const ready = work.progress >= CLEANING_SECONDS[work.stage]
    return {
      title: work.stage === 'bag' ? '쓰레기를 정리하세요' : '얼룩을 닦으세요',
      action: ready
        ? work.clothHeld
          ? 'G로 천을 놓고 F로 정리를 확인하세요.'
          : 'F로 정리를 마치세요.'
        : work.stage === 'wipe' && !work.clothHeld
          ? 'G로 청소용 천을 집으세요.'
          : 'Space나 작업 버튼을 누르고 있으면 진행돼요.',
      reason: '손을 떼거나 자리를 떠나도 진행량은 남아 있어요.',
    }
  }
  if (state.washing) {
    const wash = state.washing
    if (wash.stage === 'carrying')
      return {
        title: '피처를 선반에 정리하세요',
        action: '도구 선반으로 가져가 E로 놓으세요.',
        reason: '씻기만 해서는 재사용할 수 없어요. 선반까지 정리하면 준비가 끝나요.',
      }
    if (wash.stage === 'ready')
      return {
        title: '씻은 피처를 옮기세요',
        action: '세척대에서 E로 집고 도구 선반으로 가세요.',
        reason: '이 피처를 다시 제조에 사용할 수 있게 정리하는 단계예요.',
      }
    const ready = wash.progress >= WASH_STEPS[wash.stage].seconds
    return {
      title: wash.stage === 'scrub' ? '피처를 문질러주세요' : '피처를 헹궈주세요',
      action: ready
        ? wash.spongeHeld
          ? 'G로 스펀지를 놓고 F를 누르세요.'
          : 'F로 완료를 확인하세요.'
        : wash.stage === 'scrub' && !wash.spongeHeld
          ? 'G로 스펀지를 먼저 집으세요.'
          : 'Space나 작업 버튼을 누르고 있으면 진행돼요.',
      reason: '문지르기 → 헹구기 → 선반 정리 순서예요.',
    }
  }
  if (state.preparation) {
    const prep = state.preparation
    if (prep.fault)
      return {
        title: '배합을 다시 준비해야 해요',
        action: '준비대에서 F로 배합을 폐기하고 다시 시작하세요.',
        reason: prep.fault,
        fault: true,
      }
    if (prep.stage === 'ready') return materialTip(state, prep.recipe)
    if (prep.stage === 'processing')
      return {
        title: '블렌딩 중이에요',
        action: '작업이 끝나면 준비대로 돌아와 라벨을 붙이세요.',
        reason: '기다리는 동안 다른 일을 할 수 있어요. 진행 시간은 매장 현황에서 확인해요.',
      }
    const step = preparationStep(prep)
    if (
      step.ingredient &&
      available(state, step.ingredient) + 0.0001 <
        Math.max(0, step.target * (1 - step.tolerance) - prep.progress) * (step.perUnit ?? 1)
    )
      return materialTip(state, step.ingredient)
    const ready = step.kind !== 'machine' && prep.progress >= step.target * (1 - step.tolerance)
    return {
      title: `${PREPARATIONS[prep.recipe].name} · ${step.label}`,
      station: 'prep',
      action:
        prep.tool && (ready || prep.tool !== step.tool)
          ? 'G로 도구를 내려놓으세요.'
          : ready
            ? 'F로 계량을 확인하세요.'
            : step.tool && prep.tool !== step.tool
              ? `G로 도구를 집으세요 · ${PREP_TOOL_NAMES[step.tool]}`
              : step.kind === 'machine'
                ? 'Space를 한 번 눌러 블렌딩을 시작하세요.'
                : step.kind === 'pump' || step.kind === 'pack'
                  ? `Space를 한 번씩 눌러 ${step.target}${step.unit}를 맞추세요.`
                  : 'Space나 작업 버튼을 누르다가 목표 구간에서 손을 떼세요.',
      reason: '다음 재료를 넣기 전에 도구를 놓고 계량을 확인해요. 완성 후에는 라벨·보관이 필요해요.',
    }
  }
  if (cup?.craft.fault)
    return {
      title: '이 컵은 다시 만들어야 해요',
      action: `${panel ? 'Esc로 창을 닫고 ' : ''}컵이 있는 작업대에서 F로 폐기한 뒤 새 컵을 집으세요.`,
      reason: cup.craft.fault,
      fault: true,
    }
  if (state.ticket && state.ticket !== state.request)
    return {
      title: '손님 요청과 주문표가 달라요',
      action: cup
        ? 'POS 창의 현재 컵 관리에서 컵을 폐기하고 주문표를 수정하세요.'
        : 'POS에서 손님이 요청한 메뉴와 온도로 주문표를 수정하세요.',
      reason: '제조를 잘해도 다른 메뉴라면 전달할 수 없어요.',
      fault: true,
    }
  if (cup) {
    const craft = cup.craft
    const source = nextStep(state)
    const op = operationFor(cup.recipe, cup.step, craft)
    if (!op || !source)
      return {
        title: '완성한 음료를 전달하세요',
        action:
          craft.location !== 'pickup'
            ? craft.location === 'hand'
              ? '픽업대에서 E로 컵을 내려놓으세요.'
              : 'E로 컵을 집어 픽업대로 옮기세요.'
            : state.customer?.stage === 'pickup'
              ? '손님 요청을 확인하고 F로 전달하세요.'
              : '손님이 픽업대에 도착하면 F로 전달하세요.',
        reason: '전달이 완료되면 매출과 완료 주문에 반영돼요.',
      }
    const job = state.jobs.find((item) => item.cupId === cup.id)
    if (job)
      return {
        title: `${job.label} 중이에요`,
        action: '장비가 끝나면 컵을 집어 다음 작업대로 옮기세요.',
        reason: '작동 중에는 컵이 고정돼요. 현재 진행은 화면 아래에서 확인해요.',
      }
    if (craft.location === 'hand')
      return {
        title: `${STATIONS[source.station].name} 쪽으로 이동하세요`,
        station: source.station,
        action: '작업대를 보고 E로 컵을 내려놓으세요.',
        reason: '컵은 정해진 자리에 자동으로 놓여요. 제조는 카운터 안쪽에서 진행해요.',
      }
    if (craft.location !== source.station)
      return {
        title: '다음 작업대로 컵을 옮기세요',
        action: `${STATIONS[craft.location].name}에서 E로 집고 ${STATIONS[source.station].name}에 E로 놓으세요.`,
        reason: `다음 단계는 ${op.label}예요.`,
      }
    if ((source.usesPitcher || op.tool === 'pitcher') && !craft.pitcherReserved && !state.tools.clean)
      return {
        title: '깨끗한 피처가 필요해요',
        action: state.tools.washed
          ? '세척대에서 씻은 피처를 집어 도구 선반에 놓으세요.'
          : '컵은 여기에 두고 세척대에서 피처를 하나 씻으세요.',
        reason: '씻은 뒤 선반에 정리해야 제조에 사용할 수 있어요.',
      }
    for (const [id, amount] of Object.entries(op.costs))
      if (
        available(state, id as IngredientId) + 0.0001 <
        amount * Math.max(0, 1 - op.tolerance - craft.progress / op.target)
      )
        return materialTip(state, id as IngredientId)
    const ready = readyToConfirm(op, craft.progress)
    return {
      title: op.label,
      station: source.station,
      action:
        craft.tool && (ready || craft.tool !== op.tool)
          ? 'G로 들고 있는 도구를 내려놓으세요.'
          : ready
            ? op.kind === 'steam'
              ? 'F로 계량을 확인하고 스팀을 시작하세요.'
              : 'F로 계량을 확인하고 다음 단계로 넘어가세요.'
            : op.tool && craft.tool !== op.tool
              ? `G로 도구를 집으세요 · ${TOOL_NAMES[op.tool]}`
              : op.kind === 'machine'
                ? 'Space를 한 번 눌러 샷 추출을 시작하세요.'
                : isContinuous(op)
                  ? 'Space나 작업 버튼을 누르다가 초록 목표 구간에서 손을 떼세요.'
                  : `Space를 한 번씩 눌러 ${op.target}${op.unit}를 맞추세요.`,
      reason: isContinuous(op)
        ? '손을 떼면 즉시 멈춰요. 도구를 놓고 F로 확인하기 전까지는 같은 단계예요.'
        : '한 번 누를 때 한 회만 들어가요. 목표 횟수를 넘기지 않도록 확인하세요.',
    }
  }
  if (state.phase === 'closing')
    return {
      title: '마감할 준비를 해요',
      action: closingTasks(state).length
        ? 'M으로 남은 손님과 정리할 일을 확인하세요.'
        : 'POS에서 근무를 마치고 결산하세요.',
      reason: '마감해도 재료와 기한은 다음 날로 이어져요.',
    }
  if (state.customer?.visit)
    return {
      title: '음료 전달을 마쳤어요',
      action: '손님이 나가면 다음 손님이 들어와요. 피처 세척·재료 보충을 해두세요.',
      reason: '다음 라떼에는 우유와 깨끗한 피처, 폼·바모카 준비가 필요해요.',
    }
  if (!state.ticket)
    return {
      title: '손님 요청을 POS에 입력하세요',
      action:
        panel === 'pos'
          ? state.customer?.stage === 'ordering'
            ? '메뉴·온도를 확인하고 주문표 출력 버튼을 누르세요.'
            : '손님이 POS에 도착할 때까지 기다려주세요.'
          : 'WASD로 이동하고 마우스로 POS를 본 뒤 E를 누르세요.',
      reason: '손님 요청과 주문표는 별개예요. 카운터 안쪽에서 주문을 받아요.',
    }
  if (!state.cups)
    return {
      title: '컵 보관대를 채우세요',
      action: state.reserveCups
        ? '창고에서 컵 보충을 누른 뒤 컵 보관대로 돌아가세요.'
        : '창고에서 컵을 입고하고 컵 보관대를 보충하세요.',
      reason: '주문표가 있어도 준비된 컵이 없으면 제조를 시작할 수 없어요.',
    }
  return {
    title: '주문에 맞는 컵을 집으세요',
    action: '컵 보관대를 보고 E를 누르세요.',
    reason: `${RECIPES[state.ticket].shortName} 제조를 시작해요. 컵을 들고 첫 작업대로 이동하세요.`,
  }
}

export default function FirstShiftGuide({
  state,
  panel,
  onClose,
}: {
  state: GameState
  panel: StationId | null
  onClose: () => void
}) {
  const tip = currentTip(state, panel)
  const destination = tip.station ?? suggestedStation(state)
  const action =
    panel && !tip.fault && panel !== destination
      ? `Esc로 창을 닫고 ${STATIONS[destination].name} 쪽으로 가세요.`
      : tip.action
  const coldDone = state.orderNumber > 1 || !!state.customer?.visit
  const done = firstOrdersDone(state)
  return (
    <section
      aria-label="단계별 근무 안내"
      data-fault={!!tip.fault}
      data-inline={!!panel}
      className="rounded-panel border border-[#cbd4bc] bg-surface/96 p-4 shadow-hud data-[fault=true]:border-danger data-[inline=true]:p-3 data-[inline=true]:shadow-none max-wide:p-3"
    >
      <div className="mb-2 flex items-start justify-between gap-2 text-xs text-muted">
        <span>{done ? '작업 안내 · 복습' : coldDone ? '2 / 2 · 첫 라떼' : '1 / 2 · 첫 콜드 브루'}</span>
        <button
          type="button"
          className="-m-1 rounded px-1.5 py-0.5 text-base leading-none"
          aria-label="단계별 안내 숨기기"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {!panel ? <h3 className="mb-2 text-sm leading-relaxed font-semibold max-wide:hidden">{tip.title}</h3> : null}
      <p className="text-label leading-relaxed text-brand">{action}</p>
      {!panel ? (
        <>
          <details className="mt-2 text-xs leading-relaxed text-muted">
            <summary className="cursor-pointer">이 단계의 요령</summary>
            <p className="mt-2">{tip.reason}</p>
          </details>
          <p className="mt-3 text-xs text-muted max-wide:hidden">
            <kbd className="font-sans">H</kbd> 안내 숨기기·다시 보기
          </p>
        </>
      ) : null}
    </section>
  )
}
