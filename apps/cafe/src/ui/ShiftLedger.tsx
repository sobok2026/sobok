import { formatAmount, INGREDIENTS, ingredientIds, money } from '../game/catalog'
import type { GameState } from '../game/state'
import { SUPPLIES, supplyIds } from '../game/supplies'

export default function ShiftLedger({ state, embedded = false }: { state: GameState; embedded?: boolean }) {
  const { totals } = state
  const purchases = ingredientIds.flatMap((id) =>
    totals.purchases[id] ? [{ name: INGREDIENTS[id].name, amount: totals.purchases[id]! }] : [],
  )
  if (totals.cupPurchases) purchases.push({ name: '컵 입고', amount: totals.cupPurchases })
  if (totals.coldBrewPurchases) purchases.push({ name: '콜드 브루 추출 준비', amount: totals.coldBrewPurchases })
  for (const id of supplyIds)
    if (totals.supplyPurchases[id])
      purchases.push({ name: `${SUPPLIES[id].name} 입고`, amount: totals.supplyPurchases[id]! })
  const spent = purchases.reduce((sum, item) => sum + item.amount, 0)
  const discarded = ingredientIds.filter((id) => (totals.disposed[id] ?? 0) > 0.0001)
  return (
    <section className={`mb-5.5 ${embedded ? '' : 'border-t border-line pt-4'}`} aria-label="오늘 입고·폐기 기록">
      <h3 className="mt-0 mb-3.5 text-body font-semibold">오늘의 운영 기록</h3>
      <dl className="my-3.5 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-muted">시작 잔액</dt>
          <dd className="mt-1.25 text-stat text-brand tabular-nums">{money(totals.openingCash)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">입고 지출</dt>
          <dd className="mt-1.25 text-stat text-brand tabular-nums">{money(spent)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">오늘 현금 증감</dt>
          <dd className="mt-1.25 text-stat text-brand tabular-nums">{money(totals.revenue - spent)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">현재 잔액</dt>
          <dd className="mt-1.25 text-stat text-brand tabular-nums">{money(state.cash)}</dd>
        </div>
      </dl>
      <p className="mb-4 text-xs leading-[1.7] text-muted">
        시작 {money(totals.openingCash)} + 판매 {money(totals.revenue)} − 입고 {money(spent)}
      </p>
      <details className="mt-3.5 border-t border-line pt-3 text-sm">
        <summary className="mb-3 cursor-pointer text-muted">입고 지출 상세 · {purchases.length}개 항목</summary>
        {purchases.length ? (
          <dl className="my-3">
            {purchases.map((item) => (
              <div className="flex items-baseline justify-between gap-3 py-1.5 text-label" key={item.name}>
                <dt>{item.name}</dt>
                <dd className="whitespace-nowrap tabular-nums">{money(item.amount)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mb-4 text-xs leading-[1.7] text-muted">오늘 입고한 내역이 없어요.</p>
        )}
      </details>
      <details className="mt-3.5 border-t border-line pt-3 text-sm" open={discarded.length > 0}>
        <summary className="mb-3 cursor-pointer text-muted">재료 폐기 · {discarded.length}개 품목</summary>
        {discarded.length ? (
          <dl className="my-3">
            {discarded.map((id) => (
              <div className="flex items-baseline justify-between gap-3 py-1.5 text-label" key={id}>
                <dt>{INGREDIENTS[id].name}</dt>
                <dd className="whitespace-nowrap tabular-nums">
                  {formatAmount(totals.disposed[id]!)}
                  {INGREDIENTS[id].unit}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mb-4 text-xs leading-[1.7] text-muted">오늘 폐기한 재료가 없어요.</p>
        )}
        {totals.wastedCups > 0 ? (
          <p className="mb-4 text-xs leading-[1.7] text-muted">
            재제조로 폐기한 컵 {totals.wastedCups}개 · 사용한 재료도 위 폐기량에 포함돼요.
          </p>
        ) : null}
      </details>
      <details className="mt-3.5 border-t border-line pt-3 text-sm">
        <summary className="mb-3 cursor-pointer text-muted">손님이 사용한 소모품</summary>
        <dl className="my-3">
          {supplyIds.map((id) => (
            <div className="flex items-baseline justify-between gap-3 py-1.5 text-label" key={id}>
              <dt>{SUPPLIES[id].name}</dt>
              <dd className="whitespace-nowrap tabular-nums">
                {totals.suppliesUsed[id] ?? 0}
                {SUPPLIES[id].unit}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  )
}
