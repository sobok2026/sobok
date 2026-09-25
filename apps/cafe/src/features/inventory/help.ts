import { INGREDIENTS, type IngredientId } from '../../content/ingredients'
import { STATIONS } from '../../content/stations'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import { preparationIds } from '../preparation/rules'
import { batchDestination, batchOrigin } from './batches'

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
  if (pending)
    return {
      title: `${definition.name} 사용 준비`,
      action: definition.prepared
        ? pending.labelled
          ? `E로 용기를 집어 ${STATIONS[batchDestination(pending)].name}로 운반하세요.`
          : `${STATIONS[batchOrigin(pending)].name}에서 날짜를 확인하고 라벨을 붙이세요.`
        : `창고에서 ${pending.labelled ? `${definition.storage === 'fridge' ? '냉장고' : '실온 선반'}에 보관하세요.` : '날짜 확인 후 라벨을 붙이세요.'}`,
      reason: '개봉·제조만으로는 사용할 수 없어요. 라벨과 보관까지 마쳐야 해요.',
    }
  if (preparationIds.some((id) => id === ingredient))
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
