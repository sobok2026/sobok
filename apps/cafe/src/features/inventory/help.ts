import { INGREDIENTS, type IngredientId } from '../../content/ingredients'
import { STATIONS, toward } from '../../content/stations'
import { josa } from '../../shared/format'
import type { WorkTip as Tip } from '../../shared/work-tip'
import type { GameState } from '../../simulation/state'
import { COLD_BREW_HOURS } from '../cold-brew/rules'
import { DRIP_BEANS, isDripIngredient } from '../drip-coffee/rules'
import { preparationForMaterial } from '../preparation/rules'
import {
  BAR_BATCH_CAPACITY,
  barBatchCount,
  batchHome,
  deliveryDestination,
  isSealed,
  materialSource,
  reserveStorage,
} from './batches'
import { CUP_NAMES, type CupKind, isReusableCup } from './cups'
import type { StockArea } from './inventory'

export function materialTip(state: GameState, ingredient: IngredientId, area: StockArea = 'bar', needed = 0): Tip {
  if (ingredient === 'ice') {
    return {
      title: '바 아이스 빈에 얼음을 보충하세요',
      action: '컵과 스쿱을 놓고 백룸 제빙기에서 얼음통을 집어 바 아이스 빈까지 운반하세요.',
      reason: '제빙기를 켜면 저장고에 얼음이 쌓여요. 아이스 빈에 부은 얼음만 제조에 사용할 수 있어요.',
    }
  }
  const definition = INGREDIENTS[ingredient]
  if (area === 'bar' && barBatchCount(state, ingredient) >= BAR_BATCH_CAPACITY) {
    const batch = state.batches.find(
      (item) => item.ingredient === ingredient && item.location === 'bar' && item.amount > 0,
    )!
    const home = batchHome(batch)!

    return {
      title: `${definition.name} 보충 자리 확보`,
      action: `${STATIONS[home].name}에서 용기 하나를 집어 백룸에 옮긴 뒤 보충하세요.`,
      reason: `바에는 품목별 ${BAR_BATCH_CAPACITY}용기까지 둘 수 있어요. 잔량과 라벨은 이동해도 유지돼요.`,
    }
  }
  const bean = state.cup?.craft.dripBean ?? null
  const source = materialSource(state, ingredient, area, needed, bean)
  const home = source && batchHome(source)

  if (isDripIngredient(ingredient) && (ingredient === 'todays-coffee' || !source)) {
    const name = bean ? DRIP_BEANS[bean] : 'COW에 설정한 원두'
    return {
      title: `${definition.name} 추출 준비`,
      action: `컵을 다른 작업대에 내려놓고 URN Digital에서 ${name}로 배치를 준비하세요.`,
      reason:
        ingredient === 'todays-coffee'
          ? '5분 추출 후 URN에서 1시간 보온해요. 다른 원두나 기한이 지난 배치는 사용할 수 없어요.'
          : '5분 추출 후 얼음 660g을 혼합하고 실온 4시간·냉장 8시간 중 선택해 라벨을 써요. 선택한 바 보관 장소에 넣어 사용하세요.',
    }
  }
  if (source && home) {
    if (isSealed(source)) {
      return {
        title: `${definition.name} 개봉 준비`,
        action: `${STATIONS[home].name}에서 원팩을 개봉하고 라벨을 쓰세요.`,
        reason: '백룸에서 개봉·라벨을 마친 뒤 바에 운반하거나 배치 준비에 사용해요.',
      }
    }
    if (!source.labelled) {
      return {
        title: `${definition.name} 라벨 쓰기`,
        action: `${STATIONS[home].name}에서 기한을 계산해 라벨을 쓰세요.`,
        reason: '개봉·제조 시각을 기준으로 기한을 적어요.',
      }
    }
    const destination = area === 'backroom' ? reserveStorage(source) : deliveryDestination(state, source)

    return {
      title: `${definition.name} 운반`,
      action: `${STATIONS[home].name}에서 용기를 집어 ${toward(STATIONS[destination].name)} 옮기세요.`,
      reason:
        area === 'bar' ? '바에 내려놓은 재료를 음료 제조에 사용해요.' : '백룸 준비는 백룸에 보관한 원재료를 사용해요.',
    }
  }
  const preparation = preparationForMaterial(ingredient)
  if (preparation) {
    return {
      title: `${definition.name} 준비가 필요해요`,
      action: state.tools.clean
        ? `${STATIONS[preparation.steps[0].station].name}에서 ${definition.name} 제조를 선택하세요.`
        : '백룸 세척대에서 피처를 씻고 바 도구 선반에 정리하세요.',
      reason: '완성한 배치는 라벨을 쓰고 알맞은 위치로 운반해 보관해요.',
    }
  }
  if (ingredient === 'cold-brew') {
    return {
      title: '추출액을 준비하세요',
      action:
        state.coldBrew?.stage === 'finished'
          ? '백룸 추출대에서 추출액을 회수하세요.'
          : '백룸 콜드 브루 추출대에서 계량해 추출하세요. 추출 중이면 완료를 기다려주세요.',
      reason: `${COLD_BREW_HOURS}시간 추출은 마감 후 다음 날로 넘어갈 때도 진행돼요.`,
    }
  }

  return {
    title: `${definition.name} 입고가 필요해요`,
    action: '백룸 창고에서 원팩을 입고하세요.',
    reason: '입고한 원팩은 보관 방식에 맞는 곳에 넣어야 해요.',
  }
}

export function cupRestockAction(state: GameState, kind: CupKind) {
  if (isReusableCup(kind)) {
    const cups = state.reusableCups[kind]
    if (state.dishwasher.rack[kind]) return '세척기가 끝나면 랙을 꺼내고, 건조대의 컵을 컵 보관대에 돌려놓으세요.'
    if (cups.washed > 0) {
      return `세척대에서 씻은 ${josa(CUP_NAMES[kind], '을', '를')} 집어 컵 보관대에 놓으세요.`
    }
    if (cups.dirty > 0) {
      return `세척대에서 ${josa(CUP_NAMES[kind], '을', '를')} 씻고 컵 보관대에 놓으세요.`
    }
    return '사용한 컵을 회수해 세척대에서 씻고 컵 보관대에 돌려놓으세요.'
  }

  if (state.disposableCups[kind].reserve) {
    return '백룸 창고에서 같은 종류·사이즈의 컵 묶음을 집어 바 컵 보관대에 옮기세요.'
  }
  return '창고에서 해당 컵을 입고하고 보관대를 보충하세요.'
}
