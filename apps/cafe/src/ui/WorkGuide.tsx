import { COLD_BREW_HOURS, RECIPES, type StationId } from '../game/catalog'
import { batchDate } from '../game/format'
import { PREPARATIONS } from '../game/preparation'
import type { GameState } from '../game/state'

import { currentTip } from './work-guide-tips'

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
          ICED 컵에는 하단·중간·상단 기준선이 있습니다. 금색 선은 현재 단계의 목표 높이이며 HOT 컵에도 표시됩니다.
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
