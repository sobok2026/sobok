import { useEffect, useState } from 'react'
import { customerNames, money, recipeIds, recipeLabel } from '../game/catalog'
import { SERVICE_NAMES, type ServiceMode, serviceModes } from '../game/cups'
import { CUSTOMER_STATUS } from '../game/customer'
import { closingTasks } from '../game/progress'
import { Button } from './Button'

import type { CafeSession } from './use-cafe-session'

export default function PosPanel({ state, act }: Pick<CafeSession, 'state' | 'act'>) {
  const [posSelection, setPosSelection] = useState(state.ticket?.recipe ?? state.request)
  const [posService, setPosService] = useState<ServiceMode>(
    state.ticket?.service ?? state.customer?.service ?? 'dine-in',
  )
  const customerId = state.customer?.id
  const customerService = state.customer?.service
  const ticketRecipe = state.ticket?.recipe
  const ticketService = state.ticket?.service
  useEffect(() => {
    if (customerId && customerService) {
      setPosSelection(ticketRecipe ?? state.request)
      setPosService(ticketService ?? customerService)
    }
  }, [customerId, customerService, ticketRecipe, ticketService, state.request])
  const canTakeOrder =
    !!state.customer &&
    !state.customer.visit &&
    state.customer.stage !== 'leaving' &&
    (state.customer.stage === 'ordering' || !!state.ticket)
  const closing = closingTasks(state)
  const customer = customerNames[(state.orderNumber - 1) % customerNames.length]

  return (
    <>
      {(state.phase === 'open' || state.ticket) &&
      state.customer &&
      !state.customer.visit &&
      state.customer.stage !== 'leaving' ? (
        <>
          <div className="mb-5.5 rounded-[0.1875rem] border-l-2 border-[#a9b495] bg-[#eaeade] p-4 compact:mb-4 compact:p-3">
            <span className="text-xs text-muted">손님 주문</span>
            <p className="mt-2.25 mb-0 text-body leading-[1.7] text-[#4b6248]">
              {recipeLabel(state.request)} · {SERVICE_NAMES[state.customer.service]}
            </p>
          </div>
          <label className="mb-2.25 block text-xs text-muted" htmlFor="pos-menu">
            주문 입력
          </label>
          <select
            className="mb-3.5 w-full rounded-[0.1875rem] border border-[#d9ddce] bg-[#fffdf7] p-3 text-sm text-[#496347]"
            id="pos-menu"
            value={posSelection}
            disabled={!!state.cup || !canTakeOrder}
            onChange={(event) => setPosSelection(event.target.value as typeof posSelection)}
          >
            {recipeIds.map((id) => (
              <option key={id} value={id}>
                {recipeLabel(id)}
              </option>
            ))}
          </select>
          <fieldset className="mb-4 grid grid-cols-2 gap-2 disabled:opacity-45" disabled={!!state.cup || !canTakeOrder}>
            <legend className="mb-2 text-xs text-muted">이용 방식</legend>
            {serviceModes.map((service) => (
              <label key={service} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="pos-service"
                  value={service}
                  checked={posService === service}
                  onChange={() => setPosService(service)}
                />
                <span className="block rounded-xl border border-control-line bg-control px-3 py-2.5 text-center text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
                  {SERVICE_NAMES[service]}
                </span>
              </label>
            ))}
          </fieldset>
          <Button
            disabled={!!state.cup || !canTakeOrder}
            onClick={() => act({ type: 'ticket', recipe: posSelection, service: posService })}
          >
            {state.ticket ? '주문표 수정' : canTakeOrder ? '주문 접수' : '손님 도착 대기'}
          </Button>
        </>
      ) : (
        <div className="mb-5 rounded-md bg-[#eaeade] p-4 text-sm leading-relaxed text-muted">
          <p>{state.customer ? `${customer} 님 · ${CUSTOMER_STATUS[state.customer.stage]}` : '응대 중인 손님 없음'}</p>
        </div>
      )}
      <details className="mt-6 border-t border-line pt-4 text-sm" open={state.phase !== 'open'}>
        <summary className="mb-3 cursor-pointer text-muted">영업 관리</summary>
        <div className="mb-4.25 flex justify-between text-xs text-muted">
          <span>오늘 판매</span>
          <strong className="text-sm text-[#50694a]">{money(state.totals.revenue)}</strong>
        </div>
        {state.phase === 'open' ? (
          <Button variant="secondary" onClick={() => act({ type: 'close' })}>
            주문 접수 마감
          </Button>
        ) : (
          <>
            <p className="mb-2.25 block text-xs text-muted">마감 체크</p>
            {closing.length ? (
              <ul className="my-4 list-disc pl-4.25 text-xs leading-[2.1] text-muted">
                {closing.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-xs text-[#638259]">마감 준비 완료</p>
            )}
            <Button disabled={closing.length > 0} onClick={() => act({ type: 'finish' })}>
              결산하기
            </Button>
          </>
        )}
      </details>
    </>
  )
}
