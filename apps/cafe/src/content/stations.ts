import { TABLES } from './tables'

export const BAR_CENTER_Z = -1.05
export const FLOOR_HEIGHT = 4
export const STAIRCASE = { leftX: -6.4, rightX: -4.5, width: 1.5, startZ: 4.8, endZ: 9.8, landingEndZ: 11.2 } as const
export const SHOP_BOUNDS = { minX: -12, maxX: 12, minZ: -10, maxZ: 20 } as const
export const CUSTOMER_ENTRANCE = { x: -0.8, z: 19.86 } as const
export const BACKROOM_FRONT_Z = -5.85
export const BACKROOM_DOOR = { x: 7.9, width: 1.5 } as const
export const CONDIMENT_BAR = { x: 6, z: BAR_CENTER_Z, width: 3.5, depth: 0.94, yaw: 0 } as const
const STAFF_AISLE_EDGE_Z = -1.95
export const staffStartPosition = (): [number, number, number, number, number] => [-3.1, -2.95, Math.PI, -0.17, 0]
// Reflect the original customer-facing fixtures toward the employee aisle.
export const staffFacingZ = (z: number) => 2 * BAR_CENTER_Z - z

const WORK_STATIONS = {
  pos: { name: 'POS', x: -3.2, z: -1.4 },
  printer: { name: '스티커 프린터', x: -2.7, z: -1.4 },
  'food-case': { name: '푸드 쇼케이스', x: -4.28, z: -3.15 },
  'food-oven': { name: '푸드 오븐', x: 8.85, z: -2.05 },
  cups: { name: '컵 보관대', x: -1.8, z: -1.4 },
  espresso: { name: '에스프레소 머신 1', x: -0.22, z: -1.4 },
  steam: { name: '스팀 완드 1', x: -0.89, z: -1.4 },
  'espresso-2': { name: '에스프레소 머신 2', x: 2.48, z: -1.4 },
  'steam-2': { name: '스팀 완드 2', x: 1.81, z: -1.4 },
  brew: { name: '콜드 브루 탭', x: -3, z: -5.1 },
  urn: { name: 'URN Digital', x: -1.85, z: -5.1 },
  water: { name: '워터 스테이션', x: 5.5, z: -5.1 },
  ice: { name: '아이스 빈', x: 4.2, z: -5.1 },
  sauce: { name: '소스 펌프', x: 0.9, z: -1.4 },
  mix: { name: '혼합 작업대', x: 3.3, z: -1.4 },
  topping: { name: '토핑 스테이션', x: 6.35, z: -5.1 },
  pickup: { name: '픽업대', x: 4, z: -1.4 },
  blender: { name: '바 블렌더', x: 2.7, z: -5.1 },
  grinder: { name: 'BUNN G3 그라인더', x: -0.6, z: -5.1 },
  prep: { name: '백룸 준비대', x: -2.7, z: -9.1 },
  fridge: { name: '백룸 냉장고', x: 5.5, z: -8.8 },
  'bar-fridge': { name: '바 냉장고', x: 1.2, z: -4.8 },
  stock: { name: '백룸 창고', x: 6.3, z: -7.3 },
  shelf: { name: '바 실온 선반', x: 8.95, z: -3.5 },
  'cold-prep': { name: '백룸 콜드 브루 추출대', x: 1, z: -9.1 },
  wash: { name: '백룸 세척대', x: -5.0, z: -9.1 },
  rack: { name: '도구 선반', x: 1.1, z: -5.1 },
  condiment: { name: '컨디먼트 바 · 컵 반납', x: CONDIMENT_BAR.x, z: CONDIMENT_BAR.z + 0.12 },
  supplies: { name: '컨디먼트 바 · 소모품', x: CONDIMENT_BAR.x - 1.15, z: CONDIMENT_BAR.z + 0.12 },
  trash: { name: '컨디먼트 바 · 분리수거', x: CONDIMENT_BAR.x + 1.15, z: CONDIMENT_BAR.z + 0.12 },
} as const

export const STATIONS: typeof WORK_STATIONS & typeof TABLES = { ...WORK_STATIONS, ...TABLES }

export type StationId = keyof typeof STATIONS
export type EspressoStation = 'espresso' | 'espresso-2'
export type SteamStation = 'steam' | 'steam-2'
export const isEspressoStation = (station: StationId): station is EspressoStation =>
  station === 'espresso' || station === 'espresso-2'
export const isSteamStation = (station: StationId): station is SteamStation =>
  station === 'steam' || station === 'steam-2'
export const stationIds = Object.keys(STATIONS) as StationId[]
export type TableId = keyof typeof TABLES
export const tableIds = Object.keys(TABLES) as TableId[]
export const isTable = (station: StationId): station is TableId => Object.hasOwn(TABLES, station)
export const stationElevation = (station: StationId) => (isTable(station) ? TABLES[station].floor * FLOOR_HEIGHT : 0)
export const cupSurfaceIds = [...tableIds, 'condiment'] as const
export type CupSurfaceId = (typeof cupSurfaceIds)[number]
export const isCupSurface = (station: StationId): station is CupSurfaceId => isTable(station) || station === 'condiment'

export function canAccessStation(station: StationId, playerZ: number, elevation: number) {
  if (isTable(station)) return Math.abs(elevation - stationElevation(station)) < 0.25

  return (
    elevation < 0.25 &&
    (isCupSurface(station) || station === 'supplies' || station === 'trash' || playerZ <= STAFF_AISLE_EDGE_Z)
  )
}

export function toward(name: string) {
  const syllable = name.charCodeAt(name.length - 1) - 0xac00
  const final = syllable >= 0 && syllable < 11172 ? syllable % 28 : 0

  return `${name}${final === 0 || final === 8 ? '로' : '으로'}`
}
