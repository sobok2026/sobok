import type { GameState } from './state'

export function cupHandsBusy(cup: GameState['cup']) {
  return (
    !!cup && (cup.craft.location === 'hand' || !!cup.craft.tool || Object.values(cup.craft.places).includes('hand'))
  )
}

export function craftingHandsBusy(state: GameState) {
  return cupHandsBusy(state.cup) || !!state.preparation?.tool
}
