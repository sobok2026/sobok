import type { RecipeId } from './recipes'
export const customerNames = ['민서', '지우', '서준', '하린', '도윤', '수아']
export const orderSequence: RecipeId[] = [
  'cold-brew',
  'glazed-hot',
  'glazed-iced',
  'hoji-hot',
  'hoji-iced',
  'cold-brew',
  'glazed-iced',
  'glazed-hot',
]

export const CUSTOMER_HABITS = { returnCup: 0.9, stain: 0.3, sugar: 0.3 } as const
