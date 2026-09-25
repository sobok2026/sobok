import menuData from '../../data/menu.json'
import type { ServiceMode } from '../features/inventory/cups'
import { recipeCatalog } from './catalog'
import { DRINK_SIZES, type DrinkSize, drinkSizeIds } from './drink-sizes'
import { buildMenu, type RecipeId } from './playable-menu'

export { type RecipeId, recipeIds, type Step } from './playable-menu'

export const RECIPES = buildMenu(recipeCatalog, menuData)

export const recipeSizes = (id: RecipeId) => drinkSizeIds.filter((size) => RECIPES[id].sizes[size])
export function recipeFor(id: RecipeId, size: DrinkSize, service: ServiceMode = 'takeout') {
  const recipe = RECIPES[id].sizes[size]
  if (!recipe) throw new Error(`${RECIPES[id].name}에는 ${DRINK_SIZES[size].name} 사이즈가 없어요.`)
  return service === 'dine-in' ? { ...recipe, steps: recipe.dineInSteps } : recipe
}
export function recipeLabel(id: RecipeId, size?: DrinkSize) {
  return `${RECIPES[id].name} · ${RECIPES[id].variant}${size ? ` · ${DRINK_SIZES[size].name}` : ''}`
}
