import { batchDestination, batchOrigin, carriedBatch } from '../game/batches'
import { COLD_BREW_HOURS, INGREDIENTS, type IngredientId, RECIPES, STATIONS, type StationId } from '../game/catalog'
import { CLEANING_SECONDS } from '../game/cleaning'
import { COLD_BREW_TOOL_NAMES, coldBrewStep } from '../game/cold-brew'
import { isContinuous, operationFor, readyToConfirm, TOOL_NAMES } from '../game/crafting'
import { CUP_NAMES, cleanCupCount, cupCount, cupKindFor, isReusableCup, SERVICE_NAMES } from '../game/cups'
import { batchDate, PREP_TOOL_NAMES, PREPARATIONS, preparationStep } from '../game/preparation'
import { expiryAt } from '../game/quality'
import type { GameState } from '../game/state'
import { available, closingTasks, nextStep } from '../game/store'
import { WASH_NAMES, WASH_STEPS, washDestination } from '../game/washing'

type Tip = { title: string; action: string; reason: string; fault?: boolean; station?: StationId }
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
      station: definition.prepared ? batchOrigin(pending) : 'stock',
      action: definition.prepared
        ? pending.labelled
          ? `E로 용기를 집어 ${STATIONS[batchDestination(pending)].name}로 운반하세요.`
          : `${STATIONS[batchOrigin(pending)].name}에서 날짜를 확인하고 라벨을 붙이세요.`
        : `창고에서 ${pending.labelled ? `${definition.storage === 'fridge' ? '냉장고' : '실온 선반'}에 보관하세요.` : '날짜 확인 후 라벨을 붙이세요.'}`,
      reason: '개봉·제조만으로는 사용할 수 없어요. 라벨과 보관까지 마쳐야 해요.',
    }
  if (ingredient === 'foam' || ingredient === 'mocha' || ingredient === 'hojicha')
    return {
      title: `${definition.name} 준비가 필요해요`,
      action: state.tools.clean
        ? `준비대에서 ${definition.name} 제조를 선택하세요.`
        : '세척대에서 피처를 씻고 옆 도구 선반에 먼저 정리하세요.',
      reason: '준비 배합은 완성한 뒤 라벨을 붙이고 보관해야 음료에 넣을 수 있어요.',
    }
  if (ingredient === 'coldBrew')
    return {
      title: '추출액을 준비하세요',
      station: 'cold-prep',
      action:
        state.coldBrew?.stage === 'finished'
          ? '추출대에서 E로 추출액을 용기에 회수하세요.'
          : '콜드 브루 추출대에서 원두·물을 계량해 추출하세요. 추출 중이면 완료를 기다려주세요.',
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
  const carrying = carriedBatch(state)
  if (carrying) {
    const expired = carrying.expiresAt !== null && carrying.expiresAt <= state.time
    return {
      title: expired ? '기한이 지난 용기예요' : '배합 용기를 보관하세요',
      station: expired ? batchOrigin(carrying) : batchDestination(carrying),
      action: expired
        ? `${STATIONS[batchOrigin(carrying)].name}에 E로 내려놓고 폐기하세요.`
        : `${STATIONS[batchDestination(carrying)].name}까지 운반해 E로 보관하세요.`,
      reason: `다시 놓으려면 ${STATIONS[batchOrigin(carrying)].name}로 가세요. 이동해도 잔량·기한은 바뀌지 않아요.`,
    }
  }
  if (panel === 'cold-prep' && !state.coldBrew)
    return {
      title: '콜드 브루 한 배치를 준비하세요',
      station: 'cold-prep',
      action: '원두 한 배치 준비 버튼을 누르면 직접 계량을 시작해요.',
      reason: '원두와 물을 계량하고 추출이 끝나면 회수·라벨·냉장 보관을 마쳐주세요.',
    }
  if (state.supplyDelivery)
    return {
      title: '보충품을 먼저 놓으세요',
      action: '컨디먼트 바에서 E로 소모품을 채우세요.',
      reason: '창고에서 E로 다시 내려놓을 수도 있어요. 손을 비워야 다른 도구를 집을 수 있어요.',
    }
  if (cup?.craft.location === 'hand' && (state.preparation || state.washing || state.coldBrew))
    return {
      title: '컵을 먼저 내려놓으세요',
      station: nextStep(state)?.station ?? 'pickup',
      action: `${STATIONS[nextStep(state)?.station ?? 'pickup'].name}를 보고 E를 누르세요.`,
      reason: '컵을 내려놓은 뒤 부재료 준비나 피처 세척을 이어갈 수 있어요.',
    }
  if (state.washing && !cupCount(state.cleaning?.heldCups)) {
    const wash = state.washing
    const name = WASH_NAMES[wash.item]
    const destination = STATIONS[washDestination(wash.item)].name
    if (wash.stage === 'carrying')
      return {
        title: `${name}를 정리하세요`,
        action: `${destination}로 가져가 E로 놓으세요.`,
        reason: '씻기만 해서는 재사용할 수 없어요. 제자리에 놓으면 준비가 끝나요.',
      }
    if (wash.stage === 'ready')
      return {
        title: `씻은 ${name}를 옮기세요`,
        action: `세척대에서 E로 집고 ${destination}로 가세요.`,
        reason: '용기를 다시 사용할 수 있게 정리하는 단계예요.',
      }
    const ready = wash.progress >= WASH_STEPS[wash.stage].seconds
    return {
      title: `${name} ${wash.stage === 'scrub' ? '문지르기' : '헹구기'}`,
      action: ready
        ? wash.spongeHeld
          ? 'G로 스펀지를 놓고 F를 누르세요.'
          : 'F로 완료를 확인하세요.'
        : wash.stage === 'scrub' && !wash.spongeHeld
          ? 'G로 스펀지를 먼저 집으세요.'
          : 'Space나 작업 버튼을 누르고 있으면 진행돼요.',
      reason: '문지르기 → 헹구기 → 보관대 정리 순서예요.',
    }
  }
  if (state.cleaning) {
    const work = state.cleaning
    if (cupCount(work.heldCups))
      return {
        title: '회수한 컵을 세척대로 옮기세요',
        station: 'wash',
        action: '세척대로 가져가 E로 내려놓으세요.',
        reason: '얼룩이 남아 있으면 원래 자리로 돌아가 닦아주세요.',
      }
    if (work.stage === 'collect')
      return {
        title: '사용한 컵을 회수하세요',
        action: `${STATIONS[work.station].name}에서 E로 컵을 집으세요.`,
        reason: '컵을 모두 세척대로 옮긴 뒤 얼룩을 닦아요.',
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
  const brew = state.coldBrew
  if (brew && (brew.tool || (!state.preparation && !cup))) {
    if (brew.completedAt !== null && expiryAt(brew.completedAt, INGREDIENTS.coldBrew.lifetime) <= state.time)
      return {
        title: '추출액의 기한이 지났어요',
        station: 'cold-prep',
        action: '추출대에서 F로 폐기한 뒤 다시 준비하세요.',
        reason: '회수하거나 라벨을 붙여도 기한은 늘어나지 않아요.',
        fault: true,
      }
    if (brew.fault)
      return {
        title: '콜드 브루를 다시 준비하세요',
        station: 'cold-prep',
        action: '추출대에서 F로 한 배치분을 폐기하세요.',
        reason: brew.fault,
        fault: true,
      }
    if (brew.stage === 'finished')
      return {
        title: '추출액을 회수하세요',
        station: 'cold-prep',
        action: '추출대에서 E로 용기에 회수하고 F로 라벨을 붙이세요.',
        reason: '추출 완료 시각부터 기한이 계산돼요. 회수한 뒤 냉장고로 운반해야 사용할 수 있어요.',
      }
    if (brew.stage === 'ready') return materialTip(state, 'coldBrew')
    if (brew.stage === 'extracting')
      return {
        title: '콜드 브루 추출 중이에요',
        action: '기다리는 동안 주문·정리를 이어가거나 마감할 수 있어요.',
        reason: '다음 날로 넘어간 시간도 추출에 반영돼요. 완료 후에는 직접 회수하세요.',
      }
    const step = coldBrewStep(brew)
    const ready = brew.progress + 0.0001 >= step.target * (1 - step.tolerance)
    return {
      title: step.label,
      station: 'cold-prep',
      action:
        brew.tool && ready
          ? 'G로 도구를 내려놓고 F로 계량을 확인하세요.'
          : brew.step === 2
            ? `Space로 ${COLD_BREW_HOURS}시간 추출을 시작하세요.`
            : ready
              ? 'F로 계량을 확인하세요.'
              : !brew.tool
                ? `G로 ${COLD_BREW_TOOL_NAMES[step.tool!]}를 집으세요.`
                : brew.step === 0
                  ? 'Space를 누르고 원두 한 봉을 모두 담으세요.'
                  : 'Space로 물을 붓다가 초록 목표 구간에서 손을 떼세요.',
      reason: '추출이 끝나면 회수·라벨·냉장고 운반까지 마쳐야 사용할 수 있어요.',
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
    if (prep.stage === 'ready') {
      const batch = state.batches.find((item) => item.id === prep.batchId)
      if (batch?.expiresAt != null && batch.expiresAt <= state.time)
        return {
          title: '기한이 지난 배합이에요',
          action: '준비대에서 이 배치를 폐기한 뒤 다시 준비하세요.',
          reason: '라벨을 붙이거나 보관해도 만료 시각은 늘어나지 않아요.',
          fault: true,
        }
      return materialTip(state, prep.recipe)
    }
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
                : ['pump', 'pack', 'scoop', 'shake'].includes(step.kind)
                  ? `Space를 한 번씩 눌러 ${step.target}${step.unit}를 맞추세요.`
                  : 'Space나 작업 버튼을 누르다가 목표 구간에서 손을 떼세요.',
      reason: '다음 재료를 넣기 전에 도구를 놓고 계량을 확인해요. 완성 후에는 라벨·보관이 필요해요.',
    }
  }
  if (cup?.craft.fault)
    return {
      title: '이 컵은 다시 만들어야 해요',
      action: `${panel ? 'Esc로 창을 닫고 ' : ''}컵이 있는 작업대에서 F로 정리한 뒤 새 컵을 집으세요.`,
      reason: cup.craft.fault,
      fault: true,
    }
  if (state.ticket && (state.ticket.recipe !== state.request || state.ticket.service !== state.customer?.service))
    return {
      title: '손님 요청과 주문표가 달라요',
      action: cup
        ? 'POS 창의 현재 컵 관리에서 컵을 정리하고 주문표를 수정하세요.'
        : 'POS에서 손님이 요청한 메뉴·온도·매장/포장으로 주문표를 수정하세요.',
      reason: '요청 메뉴와 이용 방식에 맞는 컵이어야 전달할 수 있어요.',
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
    for (const [id, amount] of Object.entries(op.kind === 'shake' ? source.costs : op.costs))
      if (
        available(state, id as IngredientId) + 0.0001 <
        amount * (op.kind === 'shake' ? 1 : Math.max(0, 1 - op.tolerance - craft.progress / op.target))
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
      reason: '라떼에 쓸 우유·폼과 메뉴에 맞는 바모카·호지차 샷을 준비해두세요.',
    }
  if (!state.ticket)
    return {
      title: '손님 요청을 POS에 입력하세요',
      action:
        panel === 'pos'
          ? state.customer?.stage === 'ordering'
            ? '메뉴·온도·매장/포장을 확인하고 주문 접수 버튼을 누르세요.'
            : '손님이 POS에 도착할 때까지 기다려주세요.'
          : 'WASD로 이동하고 마우스로 POS를 본 뒤 E를 누르세요.',
      reason: '손님 요청과 주문표는 별개예요. 카운터 안쪽에서 주문을 받아요.',
    }
  const kind = cupKindFor(state.ticket.recipe, state.ticket.service)
  if (!cleanCupCount(state, kind))
    return {
      title: `${CUP_NAMES[kind]}를 준비하세요`,
      action: isReusableCup(kind)
        ? '사용한 컵을 회수해 세척대에서 씻고 컵 보관대에 돌려놓으세요.'
        : state.disposableCups[kind].reserve
          ? '창고에서 해당 컵을 보충한 뒤 컵 보관대로 돌아가세요.'
          : '창고에서 해당 컵을 입고하고 보관대를 보충하세요.',
      reason: '매장은 다회용, 포장은 일회용 컵을 사용해요. HOT·ICED 컵도 구분해요.',
    }
  return {
    title: `${CUP_NAMES[kind]}를 집으세요`,
    action: '컵 보관대를 보고 E를 누르세요.',
    reason: `${SERVICE_NAMES[state.ticket.service]} · ${RECIPES[state.ticket.recipe].shortName} 제조를 시작해요.`,
  }
}

const controls = [
  ['W A S D', '이동'],
  ['마우스 / 방향키', '시점'],
  ['E', '컵·용기 집기 / 놓기 · 작업대 열기'],
  ['G', '도구 집기 / 놓기'],
  ['클릭 / Space', '누르고 붓기·젓기 · 한 번씩 펌핑·흔들기'],
  ['F', '계량 확인 · 음료 전달'],
  ['H', '도움말'],
  ['M', '매장 현황'],
  ['Esc', '닫기 / 일시정지'],
]

export default function WorkGuide({
  state,
  station,
  started,
}: {
  state: GameState
  station: StationId | null
  started: boolean
}) {
  const tip = currentTip(state, station)
  const recipe = state.cup?.recipe ?? state.ticket?.recipe
  const preparation = state.preparation
  return (
    <div className="text-sm leading-relaxed">
      {started ? (
        <section className="mb-6 rounded-xl bg-control p-4" aria-label="현재 작업 도움말">
          <h3 className="font-semibold data-[fault=true]:text-danger" data-fault={!!tip.fault}>
            {tip.title}
          </h3>
          <p className="mt-2">{tip.action}</p>
          <p className="mt-2 text-xs text-muted">{tip.reason}</p>
        </section>
      ) : null}
      <details className="border-t border-line py-4" open={!started}>
        <summary className="font-medium">조작법</summary>
        <dl className="mt-3 divide-y divide-line">
          {controls.map(([key, action]) => (
            <div key={key} className="flex items-center justify-between gap-5 py-2.5">
              <dt>
                <kbd className="font-sans text-xs text-muted">{key}</kbd>
              </dt>
              <dd className="text-right text-xs">{action}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">
          마우스 고정이 지원되지 않으면 화면을 누른 채 드래그하거나 방향키를 사용하세요.
        </p>
      </details>
      {recipe ? (
        <details className="border-t border-line py-4">
          <summary className="font-medium">
            {RECIPES[recipe].shortName} · {RECIPES[recipe].variant}
          </summary>
          <ol className="mt-4 space-y-4">
            {RECIPES[recipe].steps.map((step, index) => (
              <li key={step.label} className="flex gap-3">
                <span className="text-xs tabular-nums text-muted">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong className="font-medium">{step.label}</strong>
                  <p className="mt-1 text-xs text-muted">
                    {step.label === '제공'
                      ? state.ticket?.service === 'dine-in'
                        ? '머그·유리잔은 리드 없이 픽업대에서 제공해요.'
                        : '일회용 컵은 리드를 덮어 픽업대에서 제공해요.'
                      : step.instruction}
                  </p>
                  {step.note ? <p className="mt-1 text-xs text-muted">{step.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      {preparation ? (
        <details className="border-t border-line py-4">
          <summary className="font-medium">{PREPARATIONS[preparation.recipe].name} 배합</summary>
          {preparation.ingredientExpiresAt != null ? (
            <p className="mt-3 text-xs text-muted">원재료 기한 · {batchDate(preparation.ingredientExpiresAt, true)}</p>
          ) : null}
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-xs text-muted">
            {PREPARATIONS[preparation.recipe].steps.map((step) => (
              <li key={step.label}>{step.instruction}</li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">{PREPARATIONS[preparation.recipe].storageNote}</p>
        </details>
      ) : null}
      <details className="border-t border-line py-4">
        <summary className="font-medium">주문과 제조</summary>
        <p className="mt-3 text-muted">
          POS에서 주문을 입력하고 컵 보관대에서 컵을 집으세요. 각 작업대에 컵을 놓고 계량한 뒤 픽업대에서 전달합니다.
        </p>
        <p className="mt-2 text-muted">
          계량 게이지의 목표 구간에서 멈추고 도구를 놓은 뒤 F로 확인하세요. 초과한 음료는 정리하고 다시 만듭니다. 다회용
          컵은 세척 후 재사용합니다.
        </p>
      </details>
      <details className="border-t border-line py-4">
        <summary className="font-medium">재료 준비와 보관</summary>
        <p className="mt-3 text-muted">
          준비대에서 폼·바모카·호지차 샷을 배합합니다. 라벨을 붙인 뒤 E로 용기를 집어 폼·호지차 샷은 냉장고, 바모카는
          실온 선반에 보관하세요.
        </p>
        <p className="mt-2 text-muted">
          콜드 브루는 추출대에서 원두·물을 계량하고 {COLD_BREW_HOURS}시간 추출합니다. 마감하고 다음 날로 넘어가도 추출이
          진행됩니다. 완료 후 회수·라벨·냉장 보관까지 마쳐야 사용할 수 있습니다.
        </p>
      </details>
      <details className="border-t border-line py-4">
        <summary className="font-medium">매장·포장과 컵</summary>
        <p className="mt-3 text-muted">
          매장은 HOT 머그·ICED 유리잔, 포장은 HOT 종이컵·ICED 일회용 컵을 사용합니다. 포장 손님은 소모품을 챙긴 뒤 바로
          퇴장합니다. 매장 손님은 테이블을 이용한 뒤 컵을 반납하거나 테이블에 남깁니다.
        </p>
        <p className="mt-2 text-muted">
          ICED 컵에는 하단·중간·상단 기준선이 있습니다. 금색 선은 현재 단계의 목표 높이이며 HOT 컵에도 표시됩니다. ml
          환산 수치는 게임용 임시값입니다.
        </p>
      </details>
      <details className="border-t border-line pt-4">
        <summary className="font-medium">정리와 마감</summary>
        <p className="mt-3 text-muted">
          피처는 세척한 뒤 도구 선반에 놓으세요. 사용한 머그·유리잔은 회수해 세척대에서 씻고 컵 보관대에 놓으세요.
          얼룩은 천으로 닦습니다. 소모품은 창고에서 컨디먼트 바로 운반합니다.
        </p>
        <p className="mt-2 text-muted">
          POS에서 주문 접수를 마감하고 M으로 남은 일을 확인하세요. 손님이 모두 나가고 정리가 끝나면 POS에서 결산합니다.
        </p>
      </details>
    </div>
  )
}
