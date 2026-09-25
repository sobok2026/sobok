import menuData from '../../data/menu.json'
import type { ServiceMode } from '../features/inventory/cups'
import { recipeCatalog } from './catalog'
import { DRINK_SIZES, type DrinkSize, drinkSizeIds } from './drink-sizes'
import { buildMenu, type RecipeId } from './playable-menu'

export type { RecipeId, Step } from './playable-menu'

const menu = buildMenu(recipeCatalog, menuData)
export const RECIPES = menu.available
export const unavailableRecipes = menu.unavailable
export const recipeIds = Object.keys(RECIPES)
export const recipeSizes = (id: RecipeId, service?: ServiceMode): DrinkSize[] =>
  drinkSizeIds.filter((size) => {
    const serving = RECIPES[id]?.sizes[size]
    return !!serving && (!service || !!serving.plans[service])
  })
export const recipeServices = (id: RecipeId): ServiceMode[] =>
  (['dine-in', 'takeout'] as const).filter((service) => recipeSizes(id, service).length)
export function recipeFor(id: RecipeId, size: DrinkSize, service: ServiceMode) {
  const serving = RECIPES[id]?.sizes[size]
  const steps = serving?.plans[service]
  if (!serving || !steps) throw new Error(`판매할 수 없는 주문입니다: ${id}/${size}/${service}`)
  return { price: serving.price, steps, vesselId: serving.vessels[service]! }
}
export function recipePrice(id: RecipeId, size: DrinkSize) {
  const serving = RECIPES[id]?.sizes[size]
  if (!serving) throw new Error(`판매 가격이 없습니다: ${id}/${size}`)
  return serving.price
}
export function recipeLabel(id: RecipeId, size?: DrinkSize) {
  const recipe = RECIPES[id]
  if (!recipe) throw new Error(`판매 메뉴가 없습니다: ${id}`)
  return `${recipe.name} · ${recipe.variant}${size ? ` · ${DRINK_SIZES[size].name}` : ''}`
}
