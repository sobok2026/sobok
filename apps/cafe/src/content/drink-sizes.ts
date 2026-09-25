import { type CatalogSize, recipeSizeSchema } from './recipe-schema'

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

// These proportions size the existing 3D cup model; they do not measure contents or stock.
const CUP_MODEL_SCALE: Record<DrinkSize, number> = {
  short: Math.cbrt(236 / 355),
  tall: 1,
  grande: Math.cbrt(473 / 355),
  venti: Math.cbrt(591 / 355),
  trenta: Math.cbrt(887 / 355),
  single: 0.75,
}

export const drinkSizeModelScale = (size: DrinkSize) => CUP_MODEL_SCALE[size]
