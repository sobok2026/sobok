export const supplyIds = ['napkins', 'straws', 'sugar'] as const
export type SupplyId = (typeof supplyIds)[number]

export const SUPPLIES = {
  napkins: { name: '냅킨', unit: '장', color: '#f0e5cf' },
  straws: { name: '빨대', unit: '개', color: '#829977' },
  sugar: { name: '설탕', unit: '개', color: '#c2a678' },
} as const

// User-approved prototype quantities and prices, not actual store purchasing rules.
export const SUPPLY_CAPACITY = 20
export const SUPPLY_PACK = 100
export const SUPPLY_PRICE = 1000
