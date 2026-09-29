export const BAR_CENTER_Z = -1.05
export const SHOP_BOUNDS = { minX: -10, maxX: 10, minZ: -10, maxZ: 14 } as const
export const CUSTOMER_ENTRANCE = { x: -0.8, z: 13.86 } as const
export const BACKROOM_FRONT_Z = -5.85
export const BACKROOM_DOOR = { x: -5.8, width: 1.4 } as const
export const CONDIMENT_BAR = { x: -8.96, z: 2, width: 0.94, depth: 3.5 } as const
const STAFF_AISLE_EDGE_Z = -1.95
export const staffStartPosition = (): [number, number, number, number] => [-4.4, -3.05, Math.PI, -0.17]
// Reflect the original customer-facing fixtures toward the employee aisle.
export const staffFacingZ = (z: number) => 2 * BAR_CENTER_Z - z

export const STATIONS = {
  pos: { name: 'POS', x: -4.8, z: -1.4 },
  printer: { name: '스티커 프린터', x: -4.33, z: -1.4 },
  cups: { name: '컵 보관대', x: -3.7, z: -1.4 },
  espresso: { name: '에스프레소 머신', x: -2.27, z: -1.4 },
  steam: { name: '스팀 완드', x: -2.94, z: -1.4 },
  brew: { name: '콜드 브루 탭', x: 0, z: -1.4 },
  urn: { name: 'URN Digital', x: -1.1, z: -1.4 },
  water: { name: '워터 스테이션', x: 1.1, z: -1.4 },
  ice: { name: '아이스 빈', x: 2.1, z: -1.4 },
  sauce: { name: '소스 펌프', x: 3.1, z: -1.4 },
  mix: { name: '혼합 작업대', x: 4.1, z: -1.4 },
  topping: { name: '토핑 스테이션', x: 5.1, z: -1.4 },
  pickup: { name: '픽업대', x: 6.1, z: -1.4 },
  blender: { name: '바 블렌더', x: -2.7, z: -5.1 },
  grinder: { name: 'BUNN G3 그라인더', x: -1.15, z: -5.1 },
  prep: { name: '백룸 준비대', x: -2.7, z: -9.1 },
  fridge: { name: '백룸 냉장고', x: 5.5, z: -8.8 },
  'bar-fridge': { name: '바 냉장고', x: 5.5, z: -4.8 },
  stock: { name: '백룸 창고', x: 6.3, z: -7.3 },
  shelf: { name: '바 실온 선반', x: 3, z: -4.8 },
  'cold-prep': { name: '백룸 콜드 브루 추출대', x: 1, z: -9.1 },
  wash: { name: '백룸 세척대', x: -5.0, z: -9.1 },
  rack: { name: '도구 선반', x: -3.9, z: -5.1 },
  table: { name: '고객 테이블 1', x: 6.3, z: 3.55 },
  'table-left': { name: '고객 테이블 2', x: 3, z: 3.55 },
  condiment: { name: '컨디먼트 바 · 컵 반납', x: CONDIMENT_BAR.x + 0.12, z: CONDIMENT_BAR.z },
  supplies: { name: '컨디먼트 바 · 소모품', x: CONDIMENT_BAR.x + 0.12, z: CONDIMENT_BAR.z - 1.15 },
  trash: { name: '컨디먼트 바 · 분리수거', x: CONDIMENT_BAR.x + 0.12, z: CONDIMENT_BAR.z + 1.15 },
} as const

export type StationId = keyof typeof STATIONS
export const stationIds = Object.keys(STATIONS) as StationId[]
export const tableIds = ['table', 'table-left'] as const
export type TableId = (typeof tableIds)[number]
export const isTable = (station: StationId): station is TableId => station === 'table' || station === 'table-left'
export const cupSurfaceIds = [...tableIds, 'condiment'] as const
export type CupSurfaceId = (typeof cupSurfaceIds)[number]
export const isCupSurface = (station: StationId): station is CupSurfaceId => isTable(station) || station === 'condiment'

export function canAccessStation(station: StationId, playerZ: number) {
  return isCupSurface(station) || station === 'supplies' || station === 'trash' || playerZ <= STAFF_AISLE_EDGE_Z
}

export function toward(name: string) {
  const syllable = name.charCodeAt(name.length - 1) - 0xac00
  const final = syllable >= 0 && syllable < 11172 ? syllable % 28 : 0

  return `${name}${final === 0 || final === 8 ? '로' : '으로'}`
}
