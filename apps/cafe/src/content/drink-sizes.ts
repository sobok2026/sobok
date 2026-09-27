import { type CatalogSize, recipeSizeSchema } from './recipe-schema'

// 'single' is a menu price with no size name (espresso, bar drinks); its cup comes from the recipe's serving vessel.
export const drinkSizeIds = [...recipeSizeSchema.options, 'single'] as const
export type DrinkSize = CatalogSize | 'single'

export const DRINK_SIZES = {
  short: { name: 'Short', label: '숏', ml: 236 },
  tall: { name: 'Tall', label: '톨', ml: 355 },
  grande: { name: 'Grande', label: '그란데', ml: 473 },
  venti: { name: 'Venti', label: '벤티', ml: 591 },
  trenta: { name: 'Trenta', label: '트렌타', ml: 887 },
  single: { name: '단일 제공', label: '고정 규격', ml: null },
} as const satisfies Record<DrinkSize, { name: string; label: string; ml: number | null }>
