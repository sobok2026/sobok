import { INGREDIENTS, type Ingredient, type IngredientId } from '../../content/ingredients'
import { STATIONS, toward } from '../../content/stations'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { Batch, GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import { preparationForMaterial } from '../preparation/rules'
import { batchDestination, batchHome, batchOrigin, isSealed } from './batches'
import { CUP_NAMES, type CupKind, isReusableCup } from './cups'

export function materialTip(state: GameState, ingredient: IngredientId): Tip {
  const definition = INGREDIENTS[ingredient]
  const pending = state.batches.find(
    (batch) =>
      batch.ingredient === ingredient &&
      batch.amount > 0 &&
      batch.openedAt !== null &&
      batch.location !== 'bar' &&
      (batch.expiresAt === null || batch.expiresAt > state.time),
  )
  if (pending) {
    return {
      title: `${definition.name} 사용 준비`,
      action: pendingAction(definition, pending),
      reason: definition.prepared
        ? '만든 배합은 라벨을 붙이고 보관해야 사용할 수 있어요.'
        : '개봉한 원팩은 날짜 라벨을 붙여야 사용할 수 있어요.',
    }
  }
  if (preparationForMaterial(ingredient)) {
    return {
      title: `${definition.name} 준비가 필요해요`,
      action: state.tools.clean
        ? `준비대에서 ${definition.name} 제조를 선택하세요.`
        : '세척대에서 피처를 씻고 옆 도구 선반에 먼저 정리하세요.',
      reason: '준비 배합은 완성한 뒤 라벨을 붙이고 보관해야 음료에 넣을 수 있어요.',
    }
  }
  if (ingredient === 'coldBrew') {
    return {
      title: '추출액을 준비하세요',
      action:
        state.coldBrew?.stage === 'finished'
          ? '추출대에서 E로 추출액을 용기에 회수하세요.'
          : '콜드 브루 추출대에서 원두·물을 계량해 추출하세요. 추출 중이면 완료를 기다려주세요.',
      reason: `${COLD_BREW_HOURS}시간 추출은 마감 후 다음 날로 넘어갈 때도 진행돼요.`,
    }
  }
  const sealed = state.batches.find(
    (batch) => batch.ingredient === ingredient && isSealed(batch) && batch.location !== 'hand',
  )
  const home = sealed && batchHome(sealed)
  if (home) {
    return {
      title: `${definition.name} 보충이 필요해요`,
      action: `${STATIONS[home].name}에서 미개봉 원팩을 여세요.`,
      reason: '개봉한 뒤 날짜 라벨을 붙이면 사용할 수 있어요.',
    }
  }

  return {
    title: `${definition.name} 보충이 필요해요`,
    action: '창고에서 원팩을 입고하세요.',
    reason: '입고한 원팩은 보관 방식에 맞는 곳에 넣어야 해요.',
  }
}

function pendingAction(definition: Ingredient, batch: Batch) {
  if (definition.prepared) {
    if (batch.labelled) {
      return `E로 용기를 집어 ${toward(STATIONS[batchDestination(batch)].name)} 운반하세요.`
    }
    return `${STATIONS[batchOrigin(batch)].name}에서 날짜를 확인하고 라벨을 붙이세요.`
  }

  return `${STATIONS[batchHome(batch) ?? 'stock'].name}에서 날짜 라벨을 붙이세요.`
}

export function cupRestockAction(state: GameState, kind: CupKind) {
  if (isReusableCup(kind)) {
    const cups = state.reusableCups[kind]
    if (cups.washed > 0) {
      return `세척대에서 씻은 ${CUP_NAMES[kind]}를 집어 컵 보관대에 놓으세요.`
    }
    if (cups.dirty > 0) {
      return `세척대에서 ${CUP_NAMES[kind]}를 씻고 컵 보관대에 놓으세요.`
    }
    return '사용한 컵을 회수해 세척대에서 씻고 컵 보관대에 돌려놓으세요.'
  }

  if (state.disposableCups[kind].reserve) {
    return '컵 보관대에서 E로 재고를 열고 해당 컵을 보충하세요.'
  }
  return '창고에서 해당 컵을 입고하고 보관대를 보충하세요.'
}
