import clsx from 'clsx'
import { useEffect, useEffectEvent, useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { HoldAction, WorkHeader, WorkNote } from '../../shared/ui/WorkControls'
import type { Action } from '../../simulation/actions'
import { craftingHandsBusy } from '../../simulation/hands'
import type { GameState } from '../../simulation/state'
import type { ActiveInput } from '../../simulation/work-context'
import { COLD_BREW_BEANS } from '../cold-brew/rules'
import { DripWork } from '../drip-coffee/DripPanel'
import { dripHandsBusy, dripStation, dripTemperatures } from '../drip-coffee/rules'
import { PreparationWork } from '../preparation/PreparationHud'
import { preparationForMaterial, preparationStation } from '../preparation/rules'
import { GRIND_SETTINGS, GRINDER_HOPPER_POUNDS, grindSettingSchema } from './rules'

export default function GrinderPanel({
  state,
  activeInput,
  act,
}: {
  state: GameState
  activeInput: ActiveInput
  act: (action: Action) => void
}) {
  const brew = state.coldBrew
  const coldAtGrinder = brew && (brew.stage === 'grind' || brew.stage === 'ground')
  const prep = state.preparation
  const chips = preparationForMaterial('espresso-chips')
  const busyHands = craftingHandsBusy(state) || dripHandsBusy(state) || !!brew?.tool
  const drip = dripTemperatures.filter((id) => state.drip[id] && dripStation(state.drip[id]!) === 'grinder')

  const routes = [...drip, ...(coldAtGrinder ? ['cold'] : []), 'chips']
  const [selected, setSelected] = useState(prep && preparationStation(prep) === 'grinder' ? 'chips' : routes[0])
  const heldRoute = drip.find((id) => state.drip[id]?.tool)
  const route = heldRoute ?? (routes.includes(selected) ? selected : routes[0])
  const temperature = drip.find((id) => id === route)
  const keyAction = useEffectEvent((code: string) => {
    if (route === 'chips' && prep && preparationStation(prep) === 'grinder' && prep.stage !== 'ready') {
      if (code === 'KeyG') act({ type: 'prep-tool' })
      if (code === 'Space') act({ type: 'prep-use' })
      if (code === 'KeyF') act({ type: 'prep-confirm' })
    }
    if (temperature) {
      const brew = state.drip[temperature]!
      if (code === 'KeyG') act({ type: 'drip-tool', temperature })
      if (code === 'Space') act({ type: brew.stage === 'grind' ? 'drip-grind' : 'drip-use', temperature })
      if (code === 'KeyF') act({ type: 'drip-confirm', temperature })
    }
  })
  const stop = useEffectEvent(() => act({ type: 'drip-stop' }))

  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || !['KeyG', 'KeyF', 'Space'].includes(event.code)) return
      if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea')) return
      if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return
      event.preventDefault()
      keyAction(event.code)
    }
    const lift = (event: KeyboardEvent) => {
      if (event.code === 'Space') stop()
    }
    window.addEventListener('keydown', press)
    window.addEventListener('keyup', lift)

    return () => {
      window.removeEventListener('keydown', press)
      window.removeEventListener('keyup', lift)
    }
  }, [])

  return (
    <div className="grid gap-5">
      <label className="grid gap-2 text-body">
        분쇄할 작업
        <select
          aria-label="분쇄할 작업"
          value={route}
          disabled={busyHands}
          className="min-h-11 rounded-lg border border-control-line bg-control px-3"
          onChange={(event) => setSelected(event.target.value)}
        >
          {drip.map((id) => (
            <option key={id} value={id}>
              {id.toUpperCase()} 드립
            </option>
          ))}
          {coldAtGrinder && <option value="cold">콜드 브루</option>}
          <option value="chips">에스프레소 칩</option>
        </select>
      </label>
      <fieldset className="grid gap-2" aria-label="분쇄도">
        <legend className="mb-2 text-sm font-semibold">분쇄도 다이얼</legend>
        {grindSettingSchema.options.map((setting) => (
          <button
            key={setting}
            type="button"
            aria-pressed={state.grindSetting === setting}
            disabled={busyHands}
            className={clsx(
              'min-h-11 rounded-lg border border-control-line bg-control px-3 text-left',
              'aria-pressed:bg-brand aria-pressed:text-on-brand disabled:opacity-60',
            )}
            onClick={() => act({ type: 'grinder-setting', setting })}
          >
            {GRIND_SETTINGS[setting]}
          </button>
        ))}
      </fieldset>
      <WorkNote>드립커피 DRIP · 콜드 브루 COARSE · 에스프레소 칩 ESPRESSO</WorkNote>
      {temperature && (
        <section key={temperature} className="grid gap-3 border-t border-line pt-4">
          <DripWork
            state={state}
            brew={state.drip[temperature]!}
            temperature={temperature}
            station="grinder"
            active={activeInput?.kind === 'drip' && activeInput.temperature === temperature}
            act={act}
          />
        </section>
      )}
      {route === 'cold' && coldAtGrinder && (
        <section className="grid gap-3 border-t border-line pt-4">
          <WorkHeader title="콜드 브루 원두 분쇄" value={`${brew.groundBeans} / ${COLD_BREW_BEANS}lb`} />
          <WorkNote>호퍼에 한 번에 최대 {GRINDER_HOPPER_POUNDS}lb를 넣어요. 분쇄한 원두는 한 봉투에 모아요.</WorkNote>
          {brew.stage === 'grind' && (
            <Button onClick={() => act({ type: 'cold-grind' })}>
              원두 {Math.min(GRINDER_HOPPER_POUNDS, COLD_BREW_BEANS - brew.groundBeans)}lb 투입 · 분쇄
            </Button>
          )}
          {brew.stage === 'ground' && <Button onClick={() => act({ type: 'cold-tool' })}>분쇄 원두 봉투 집기</Button>}
          <HoldAction shortcut={false} onConfirm={() => act({ type: 'discard-cold-brew' })}>
            콜드 브루 준비 중단
          </HoldAction>
        </section>
      )}
      {route === 'chips' && prep && preparationStation(prep) === 'grinder' && (
        <section className="grid gap-3 border-t border-line pt-4">
          <PreparationWork state={state} prep={prep} active={false} act={act} stop={() => act({ type: 'drip-stop' })} />
        </section>
      )}
      {route === 'chips' && !prep && chips && (
        <section className="grid gap-3 border-t border-line pt-4">
          <WorkHeader title="에스프레소 칩" />
          <WorkNote>에스프레소 원두 2~3스쿱을 분쇄하고 ESP Chip 라벨을 써서 실온에 보관해요.</WorkNote>
          <Button onClick={() => act({ type: 'start-preparation', recipe: chips.id })}>에스프레소 칩 제조 시작</Button>
        </section>
      )}
      {route === 'chips' && prep && preparationStation(prep) !== 'grinder' && (
        <WorkNote>진행 중인 백룸 배합을 마무리한 뒤 에스프레소 칩을 준비하세요.</WorkNote>
      )}
      {!drip.length && !coldAtGrinder && (
        <WorkNote>드립은 URN에서, 콜드 브루는 백룸 추출대에서 배치를 먼저 준비하세요.</WorkNote>
      )}
    </div>
  )
}
