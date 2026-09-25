import { type RecipeId, recipeIds, recipeServices, recipeSizes } from './recipes'

export const customerNames = ['민서', '지우', '서준', '하린', '도윤', '수아']
export const orderSequence: RecipeId[] = recipeIds.filter((id) =>
  recipeServices(id).some((service) => recipeSizes(id, service).length > 0),
)

export const CUSTOMER_HABITS = { returnCup: 0.9, stain: 0.3, sugar: 0.3 } as const
