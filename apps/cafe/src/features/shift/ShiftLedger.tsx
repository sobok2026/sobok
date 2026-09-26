import { formatDecimal } from '@sobok/std/format/number'
import { INGREDIENTS, ingredientIds } from '../../content/ingredients'
import { money } from '../../shared/format'
import type { GameState } from '../../simulation/state'
import { SUPPLIES, supplyIds } from '../inventory/supplies'

export default function ShiftLedger({ state }: { state: GameState }) {
  const { totals } = state
  const purchases = ingredientIds.flatMap((id) =>
    totals.purchases[id] ? [{ name: INGREDIENTS[id].name, amount: totals.purchases[id]! }] : [],
  )
  if (totals.cupPurchases) {
    purchases.push({ name: '컵', amount: totals.cupPurchases })
  }
  if (totals.coldBrewPurchases) {
    purchases.push({ name: '콜드 브루 원두', amount: totals.coldBrewPurchases })
  }

  for (const id of supplyIds)
    if (totals.supplyPurchases[id]) {
      purchases.push({ name: SUPPLIES[id].name, amount: totals.supplyPurchases[id]! })
    }

  const spent = purchases.reduce((sum, item) => sum + item.amount, 0)
  const usedSupplies = supplyIds.filter((id) => (totals.suppliesUsed[id] ?? 0) > 0)
  const discarded = ingredientIds.filter((id) => (totals.disposed[id] ?? 0) > 0.0001)
  const hasWaste = discarded.length > 0 || totals.coldBrewDiscardedBeans > 0 || totals.wastedCups > 0

  return (
    <section aria-label="입고·폐기 기록" className="text-sm">
      <dl className="divide-y divide-line border-y border-line">
        {[
          ['시작 잔액', totals.openingCash],
          ['현금 판매', totals.cashSales],
          ['카드 판매', totals.cardSales],
          ['입고 지출', spent],
          ['운영 자금 증감', totals.revenue - spent],
          ['현재 잔액', state.cash],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 last:font-semibold">
            <dt className="text-muted">{label}</dt>
            <dd className="tabular-nums">{money(Number(value))}</dd>
          </div>
        ))}
      </dl>
      {purchases.length > 0 && (
        <details className="border-b border-line py-4">
          <summary className="text-muted">입고 내역 · {purchases.length}</summary>
          <dl className="mt-3 space-y-3 text-sm">
            {purchases.map((item) => (
              <div key={item.name} className="flex justify-between gap-4">
                <dt>{item.name}</dt>
                <dd className="tabular-nums">{money(item.amount)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {usedSupplies.length > 0 && (
        <details className="border-b border-line py-4" aria-label="손님 소모품 사용량">
          <summary className="text-muted">소모품 사용량</summary>
          <dl className="mt-3 space-y-3 text-sm">
            {usedSupplies.map((id) => (
              <div key={id} className="flex justify-between gap-4">
                <dt>{SUPPLIES[id].name}</dt>
                <dd>
                  {totals.suppliesUsed[id]}
                  {SUPPLIES[id].unit}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {hasWaste && (
        <details className="border-b border-line py-4">
          <summary className="text-muted">폐기 내역</summary>
          <dl className="mt-3 space-y-3 text-sm">
            {totals.coldBrewDiscardedBeans > 0 && (
              <div className="flex justify-between gap-4">
                <dt>콜드 브루 원두</dt>
                <dd>{formatDecimal(totals.coldBrewDiscardedBeans)}lb</dd>
              </div>
            )}
            {discarded.map((id) => (
              <div key={id} className="flex justify-between gap-4">
                <dt>{INGREDIENTS[id].name}</dt>
                <dd>
                  {formatDecimal(totals.disposed[id]!)}
                  {INGREDIENTS[id].unit}
                </dd>
              </div>
            ))}
            {totals.wastedCups > 0 && (
              <div className="flex justify-between gap-4">
                <dt>재제조 컵</dt>
                <dd>{totals.wastedCups}개</dd>
              </div>
            )}
          </dl>
        </details>
      )}
    </section>
  )
}
