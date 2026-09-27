import { useState } from 'react'
import type { Action } from '../../simulation/actions'
import type { GameState } from '../../simulation/state'
import { PosButton } from '../service/PosControls'
import { DRIP_BEANS, type DripTemperature, dripBeanIds } from './rules'

export default function CowSettings({ state, act }: { state: GameState; act: (action: Action) => void }) {
  const [temperature, setTemperature] = useState<DripTemperature>('hot')
  const [draft, setDraft] = useState({ ...state.cow })
  const [query, setQuery] = useState('')
  const changed = draft.hot !== state.cow.hot || draft.iced !== state.cow.iced
  const beans = dripBeanIds.filter((id) => DRIP_BEANS[id].replace(/\s/g, '').includes(query.replace(/\s/g, '')))

  return (
    <div className="grid gap-4">
      <h3 className="font-semibold">COW 설정</h3>
      <fieldset className="grid grid-cols-2 gap-2" aria-label="COW 온도">
        {(['hot', 'iced'] as const).map((value) => (
          <PosButton
            key={value}
            tone={value}
            aria-pressed={temperature === value}
            onClick={() => setTemperature(value)}
          >
            <span className="block text-lg">{value.toUpperCase()}</span>
            <span className="block text-sm">{DRIP_BEANS[draft[value]]}</span>
          </PosButton>
        ))}
      </fieldset>
      <input
        type="search"
        aria-label="COW 원두 검색"
        placeholder="원두 검색"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-h-11 rounded border border-pos-soft px-3 text-sm"
      />
      <fieldset className="grid grid-cols-2 gap-2" aria-label="COW 원두 목록">
        {beans.map((bean) => (
          <PosButton
            key={bean}
            aria-pressed={draft[temperature] === bean}
            className="text-left"
            onClick={() => setDraft({ ...draft, [temperature]: bean })}
          >
            {DRIP_BEANS[bean]} {draft[temperature] === bean && '✓'}
          </PosButton>
        ))}
      </fieldset>
      {!beans.length && <p className="text-sm">검색한 원두가 없습니다.</p>}
      <p className="text-sm text-pos-panel">
        변경한 원두는 새 주문에 표시돼요. 기존 배치와 접수한 주문의 원두는 유지돼요.
      </p>
      <PosButton tone="active" disabled={!changed} onClick={() => act({ type: 'set-cow', ...draft })}>
        확정
      </PosButton>
      <p className="text-xs" role="status">
        적용 중 · HOT {DRIP_BEANS[state.cow.hot]} / ICED {DRIP_BEANS[state.cow.iced]}
      </p>
    </div>
  )
}
