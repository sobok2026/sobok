import type { Lifetime } from './lifetime'
import { sourceLine } from './reference-links'
import { referenceLinks } from './references'
export const ingredientIds = [
  'beans',
  'milk',
  'cream',
  'glaze',
  'powder',
  'mochaPowder',
  'mocha',
  'foam',
  'coldBrew',
  'classic',
  'hojichaPowder',
  'hojicha',
] as const
export type IngredientId = (typeof ingredientIds)[number]
type Ingredient = {
  name: string
  unit: string
  pack: number
  storage: 'room' | 'fridge'
  lifetime: Lifetime
  price: number
  prepared?: boolean
  source: string
}
const quality = referenceLinks.quality
// Pack capacities, purchase prices and volume estimates are prototype rules, not store standards.
export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  beans: {
    name: '에스프레소 원두',
    unit: 'g',
    pack: 500,
    ...quality.beans,
    price: 12000,
  },
  milk: {
    name: '일반 우유',
    unit: 'ml',
    pack: 1000,
    ...quality.milk,
    price: 3000,
  },
  cream: {
    name: '휘핑크림 원재료',
    unit: 'ml',
    pack: 1000,
    ...quality.cream,
    price: 6000,
  },
  glaze: {
    name: '글레이즈드 소스',
    unit: 'ml',
    pack: 1000,
    ...quality.glaze,
    price: 8000,
  },
  powder: {
    name: '번트 카라멜 파우더',
    unit: '톡',
    pack: 100,
    ...quality.powder,
    price: 4000,
  },
  mochaPowder: {
    name: '바모카 원팩',
    unit: '봉',
    pack: 1,
    storage: 'room',
    lifetime: { amount: 7, unit: 'days' }, // Prototype opened-pack lifetime; the guide only specifies the prepared sauce.
    price: 7000,
    source: `${sourceLine(referenceLinks.mocha.reference.source)} · 원팩 단위 / 개봉 후 7일은 게임용 임시값`,
  },
  mocha: {
    name: '바모카',
    unit: 'ml',
    pack: 1500,
    ...quality.mocha,
    price: 0,
    prepared: true,
  },
  foam: {
    name: '글레이즈드 폼',
    unit: 'ml',
    pack: 450,
    ...quality.foam,
    price: 0,
    prepared: true,
  },
  coldBrew: {
    name: '콜드 브루 추출액',
    unit: 'ml',
    pack: 3000,
    ...quality.coldBrew,
    price: 0,
    prepared: true,
  },
  classic: { name: '클래식 시럽', unit: 'ml', pack: 750, ...quality.classic, price: 5000 },
  hojichaPowder: {
    name: '호지차 파우더',
    unit: '스쿱',
    pack: 80,
    storage: 'room',
    lifetime: { amount: 7, unit: 'days' },
    price: 6000,
    source: `${sourceLine(referenceLinks.hojicha.steps.powder.source)} · 1티스푼 스쿱 / 입고 규격·실온 7일은 게임용 임시값`,
  },
  hojicha: { name: '호지차 샷', unit: 'ml', pack: 250, ...quality.hojicha, price: 0, prepared: true },
}
export type Costs = Partial<Record<IngredientId, number>>
