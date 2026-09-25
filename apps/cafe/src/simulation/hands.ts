import type { GameState } from './state'
export function cupHandsBusy(cup: GameState['cup']) {
  return !!cup && (cup.craft.location === 'hand' || !!cup.craft.tool)
}
export function craftingHandsBusy(state: GameState) {
  return cupHandsBusy(state.cup) || !!state.preparation?.tool
}
