import clsx from 'clsx'
import { useState } from 'react'
import { money } from '../../shared/format'
import { uid } from '../../shared/id'
import type { Action } from '../../simulation/actions'
import type { Transaction } from '../../simulation/state'
import { NumericPad, PosButton } from './PosControls'
import { transactionCash } from './transactions'

export function CashReceiptForm({
  transaction,
  act,
  onDone,
}: {
  transaction: Transaction
  act: (action: Action) => void
  onDone?: () => void
}) {
  const [kind, setKind] = useState<'personal' | 'business'>('personal')
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [issueId] = useState(uid)

  function issue(unissued = false) {
    const valid = kind === 'personal' ? /^\d{10,11}$/.test(identifier) : /^\d{10}$/.test(identifier)
    if (!unissued && !valid) {
      setError(kind === 'personal' ? '휴대폰 번호 10~11자리를 입력해주세요.' : '사업자 번호 10자리를 입력해주세요.')
      return
    }

    act({
      type: 'pos-cash-receipt',
      transactionId: transaction.id,
      id: issueId,
      kind: unissued ? 'unissued' : kind,
      lastFour: unissued ? null : identifier.slice(-4),
    })
    setIdentifier('')
    onDone?.()
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        issue()
      }}
    >
      <h3 className="text-lg font-semibold">현금영수증</h3>
      <div className="flex items-center justify-between rounded bg-pos-soft px-3 py-2 text-sm">
        <span>발행 대상 금액</span>
        <strong className="text-lg tabular-nums">{money(transactionCash(transaction))}</strong>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <PosButton
          aria-pressed={kind === 'personal'}
          onClick={() => {
            setKind('personal')
            setIdentifier('')
            setError('')
          }}
        >
          소득공제(개인)
        </PosButton>
        <PosButton
          aria-pressed={kind === 'business'}
          onClick={() => {
            setKind('business')
            setIdentifier('')
            setError('')
          }}
        >
          지출증빙(사업자)
        </PosButton>
      </div>
      <label className="text-sm">
        {kind === 'personal' ? '휴대폰 번호' : '사업자 번호'}
        <input
          aria-label={kind === 'personal' ? '현금영수증 휴대폰 번호' : '현금영수증 사업자 번호'}
          inputMode="numeric"
          autoComplete="off"
          value={identifier}
          maxLength={kind === 'personal' ? 11 : 10}
          onChange={(event) => {
            if (/^\d*$/.test(event.target.value)) setIdentifier(event.target.value)
          }}
          className={clsx(
            'mt-2 min-h-12 w-full rounded border-2 border-pos-active bg-amber-100 px-3 text-lg tabular-nums',
            'pos-compact:min-h-10',
          )}
        />
      </label>
      <div className="mx-auto w-full max-w-sm">
        <NumericPad
          value={identifier}
          onChange={setIdentifier}
          onConfirm={() => issue()}
          maxLength={kind === 'personal' ? 11 : 10}
          shortcut={kind === 'personal' ? '010' : '00'}
          preserveLeadingZeros
        />
      </div>
      <p className="text-xs text-pos-panel">영수증에는 식별번호 끝 네 자리만 남습니다.</p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <PosButton onClick={() => issue(true)}>미발행</PosButton>
        <PosButton tone="active" onClick={() => issue()}>
          발행
        </PosButton>
      </div>
    </form>
  )
}
