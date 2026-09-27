import { z } from 'zod'
import data from '../../../data/shop/drip-coffee.json'
import type { GameState } from '../../simulation/state'

export const DRIP = z
  .strictObject({
    note: z.string(),
    brewSeconds: z.number().int().positive(),
    waterMilliliters: z.number().positive(),
    hotBeansGrams: z.number().positive(),
    icedBeansGrams: z.number().positive(),
    icedIceGrams: z.number().positive(),
    beans: z.record(z.string(), z.string()),
    defaultCow: z.object({ hot: z.string(), iced: z.string() }),
  })
  .parse(data)

export const dripBeanIds = Object.keys(data.beans) as Array<keyof typeof data.beans>
export type DripBean = (typeof dripBeanIds)[number]
export const dripBeanSchema = z.enum(dripBeanIds)
export const dripTemperatures = ['hot', 'iced'] as const
export type DripTemperature = (typeof dripTemperatures)[number]
export const DRIP_BEANS = data.beans
export const defaultCow = () => ({
  hot: dripBeanSchema.parse(DRIP.defaultCow.hot),
  iced: dripBeanSchema.parse(DRIP.defaultCow.iced),
})
export const dripIngredient = (temperature: DripTemperature) =>
  temperature === 'hot' ? 'todays-coffee' : 'iced-coffee'
export const dripBeanIngredient = (bean: DripBean) => `drip-beans-${bean}`
export const dripDose = (temperature: DripTemperature) =>
  temperature === 'hot' ? DRIP.hotBeansGrams : DRIP.icedBeansGrams
export const isDripIngredient = (id: string) => id === 'todays-coffee' || id === 'iced-coffee'

export function dripMenuTemperature(recipe: string): DripTemperature | null {
  if (recipe === 'todays-coffee:hot') return 'hot'
  if (recipe === 'iced-coffee:iced') return 'iced'
  return null
}

export function dripMenuName(recipe: string, fallback: string) {
  const temperature = dripMenuTemperature(recipe)
  if (!temperature) return fallback
  return temperature === 'hot' ? '드립' : '아이스 드립'
}

export const dripHandsBusy = (state: GameState) => dripTemperatures.some((temperature) => state.drip[temperature]?.tool)

export function dripRemaining(state: GameState, temperature: DripTemperature) {
  const brew = state.drip[temperature]
  const job = state.jobs.find((job) => job.kind === 'drip-coffee' && job.preparationId === brew?.id)
  return job ? Math.max(0, Math.ceil(job.endsAt - state.time)) : 0
}
