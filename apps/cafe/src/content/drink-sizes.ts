export const recipeSizeIds = ['tall', 'grande', 'venti'] as const
export const drinkSizeIds = [...recipeSizeIds, 'trenta'] as const
export type RecipeSize = (typeof recipeSizeIds)[number]
export type DrinkSize = (typeof drinkSizeIds)[number]

export const DRINK_SIZES = {
  tall: { name: 'Tall', label: '톨', ml: 355 },
  grande: { name: 'Grande', label: '그란데', ml: 473 },
  venti: { name: 'Venti', label: '벤티', ml: 591 },
  trenta: { name: 'Trenta', label: '트렌타', ml: 887 },
} as const

// Only quantities without a measured source use this prototype conversion.
export const drinkSizeRatio = (size: DrinkSize) => DRINK_SIZES[size].ml / DRINK_SIZES.tall.ml
