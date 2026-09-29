import { orderSequence } from '../../content/customers'
import {
  baseChipScoops,
  baseCoffee,
  baseRoastPumps,
  blenderStep,
  customizationRules,
  existingTopping,
  hasServingCup,
} from '../../content/customization-options'
import { type Customizations, canOmit, countAmount, noCustomizations } from '../../content/customizations'
import type { DrinkSize } from '../../content/drink-sizes'
import type { PlannedStep } from '../../content/recipe-plan'
import { recipeFor, recipeServices, recipeSizes } from '../../content/recipes'
import { CUSTOMER_ENTRANCE, FLOOR_HEIGHT, STAIRCASE, STATIONS, type TableId } from '../../content/stations'
import { PUBLIC_AISLE_X, PUBLIC_AISLE_Z, TABLES } from '../../content/tables'
import type { Customer, GameState } from '../../simulation/state'

export const customerStages = [
  'entering',
  'ordering',
  'to-pickup',
  'pickup',
  'to-condiment',
  'condiment',
  'to-table',
  'drinking',
  'to-return',
  'returning',
  'leaving',
] as const

type CustomerStage = (typeof customerStages)[number]
type CustomerPoint = [number, number, number]

const ENTRY_SPOT: CustomerPoint = [CUSTOMER_ENTRANCE.x, CUSTOMER_ENTRANCE.z + 0.75, 0]
const CUSTOMER_AISLE_Z = PUBLIC_AISLE_Z
const ORDER_SPOT: CustomerPoint = [STATIONS.pos.x, 0.45, 0]
const PICKUP_SPOT: CustomerPoint = [STATIONS.pickup.x, 0.25, 0]
export const CONDIMENT_SPOT: CustomerPoint = [STATIONS.supplies.x, STATIONS.supplies.z + 1.2, 0]
export const RETURN_SPOT: CustomerPoint = [STATIONS.condiment.x, STATIONS.condiment.z + 1.2, 0]
// Prototype movement and interaction timings; the 10-second table stay is user-approved.
const CUSTOMER_SPEED = 1.7
export const CUSTOMER_SECONDS = { condiment: 1.2, drinking: 10, returning: 1.2 } as const

export const CUSTOMER_STATUS: Record<CustomerStage, string> = {
  entering: '입장 중',
  ordering: '주문 대기',
  'to-pickup': '픽업대로 이동 중',
  pickup: '픽업 대기',
  'to-condiment': '컨디먼트 바로 이동 중',
  condiment: '소모품 이용 중',
  'to-table': '테이블로 이동 중',
  drinking: '테이블 이용 중',
  'to-return': '컵 반납하러 이동 중',
  returning: '컵 반납 중',
  leaving: '퇴장 중',
}

export const customerWalking = (customer: Customer | null) => !!customer && customer.nextPoint < customer.path.length

export const customerHasCup = (state: Pick<GameState, 'customer' | 'sale'>) =>
  !!state.customer &&
  !!state.sale?.lines.some(
    (line) => line.served > 0 && (line.service === 'takeout' || state.customer?.stage !== 'leaving'),
  )

export const customerSeat = (table: TableId): CustomerPoint => {
  const { seats, floor } = TABLES[table]
  return [seats[0].x, seats[0].z, floor * FLOOR_HEIGHT]
}
export const customerSeatYaw = (table: TableId) => TABLES[table].seats[0].yaw + Math.PI
export const customerSeatHeight = (table: TableId) => (TABLES[table].seats[0].kind === 'stool' ? 0.65 : 0.5)

function upperFloorRoute(floor: number): CustomerPoint[] {
  const route: CustomerPoint[] = []
  const stairs = STAIRCASE
  const landingZ = (stairs.endZ + stairs.landingEndZ) / 2
  if (!floor) return route
  route.push([stairs.leftX, PUBLIC_AISLE_Z, 0])

  for (let level = 0; level < floor; level++) {
    const base = level * FLOOR_HEIGHT
    route.push(
      [stairs.leftX, stairs.startZ - 0.8, base],
      [stairs.leftX, stairs.startZ, base],
      [stairs.leftX, stairs.endZ, base + FLOOR_HEIGHT / 2],
      [stairs.leftX, landingZ, base + FLOOR_HEIGHT / 2],
      [stairs.rightX, landingZ, base + FLOOR_HEIGHT / 2],
      [stairs.rightX, stairs.endZ, base + FLOOR_HEIGHT / 2],
      [stairs.rightX, stairs.startZ, base + FLOOR_HEIGHT],
      [stairs.rightX, stairs.startZ - 0.8, base + FLOOR_HEIGHT],
    )
  }

  route.push([PUBLIC_AISLE_X, stairs.startZ - 0.8, floor * FLOOR_HEIGHT])
  return route
}

function fromTable(tableId: TableId): CustomerPoint[] {
  const table = TABLES[tableId]
  const approach = table.approach
    .map(([x, z]): CustomerPoint => [x, z, table.floor * FLOOR_HEIGHT])
    .reverse()
    .slice(1)
  const stairs = upperFloorRoute(table.floor).reverse()
  return [...approach, ...stairs, [PUBLIC_AISLE_X, PUBLIC_AISLE_Z, 0]]
}

function customizationCandidates(plan: PlannedStep[], size: DrinkSize): Customizations[] {
  const candidates: Customizations[] = []
  const step = plan.find((step) => {
    const op = step.operation
    return (
      op.action === 'espresso' ||
      (op.action === 'add' &&
        op.materialId !== 'frappuccino-roast' &&
        op.amount.kind === 'count' &&
        op.amount.unit === 'pump')
    )
  })
  const amount = step && countAmount(step)

  if (step && amount) {
    candidates.push({
      ...noCustomizations(),
      quantities: { [step.id]: amount.unit === 'shot' ? amount.value + 1 : Math.max(0, amount.value - 1) },
    })
  }

  if (plan.some((step) => step.operation.action === 'espresso') && baseCoffee(plan) === 'regular') {
    candidates.push({ ...noCustomizations(), coffee: 'decaf' }, { ...noCustomizations(), coffee: 'blonde' })
  }

  if (plan.some((step) => step.operation.action === 'add' && step.operation.materialId === 'milk')) {
    candidates.push(
      { ...noCustomizations(), milk: 'soy-milk' },
      { ...noCustomizations(), milk: 'low-fat-milk' },
      { ...noCustomizations(), milkAmount: 'less' },
    )
  }

  if (plan.some((step) => step.operation.action === 'steam')) {
    candidates.push({ ...noCustomizations(), milkFoam: 'less' }, { ...noCustomizations(), milkTemperature: 'x-hot' })
  }

  const omission = plan.find(canOmit)

  if (omission) {
    candidates.push(
      { ...noCustomizations(), omitted: [omission.id] },
      { ...noCustomizations(), levels: { [omission.id]: 'less' } },
    )
  }

  if (hasServingCup(plan)) {
    if (!plan.some((step) => step.operation.action === 'add' && step.operation.materialId === 'vanilla-syrup')) {
      candidates.push({ ...noCustomizations(), syrups: { 'vanilla-syrup': 2 } })
    }

    if (!existingTopping(plan, 'whipped')) {
      candidates.push({ ...noCustomizations(), toppings: { whipped: 'normal' } })
    }
  }

  if (blenderStep(plan)) {
    candidates.push({ ...noCustomizations(), roast: Math.min(9, baseRoastPumps(plan) + 1) })

    if (hasServingCup(plan)) {
      candidates.push({
        ...noCustomizations(),
        javaChips: { scoops: baseChipScoops(plan) || customizationRules.chipScoops[size], mode: 'split' },
      })
    }
  }

  return candidates
}

export function createCustomer(orderNumber: number): Customer | null {
  if (!orderSequence.length) {
    return null
  }
  const preferredService = Math.random() < 0.5 ? 'dine-in' : 'takeout'
  const items: Customer['items'] = Array.from({ length: 1 + (orderNumber % 3) }, (_, index) => {
    const recipe = orderSequence[(orderNumber - 1 + index) % orderSequence.length]
    const services = recipeServices(recipe)
    const service = services.includes(preferredService) ? preferredService : services[0]
    const sizes = recipeSizes(recipe, service)
    const size = sizes[Math.floor(Math.random() * sizes.length)]
    let customizations = noCustomizations()

    if (index === 0 && orderNumber % 2 === 0) {
      const plan = recipeFor(recipe, size, service).steps
      const candidates = customizationCandidates(plan, size)
      const proposed = candidates[Math.floor(orderNumber / 2) % candidates.length]

      if (proposed) {
        try {
          recipeFor(recipe, size, service, proposed)
          customizations = proposed
        } catch {
          /* Only request options supported by this recipe's complete workflow. */
        }
      }
    }

    return { recipe, service, size, quantity: orderNumber % 3 === 0 ? 2 : 1, customizations }
  })

  return {
    id: crypto.randomUUID(),
    orderNumber,
    items,
    stage: 'entering',
    position: [...ENTRY_SPOT],
    yaw: Math.PI,
    path: [[CUSTOMER_ENTRANCE.x, CUSTOMER_AISLE_Z, 0], [ORDER_SPOT[0], CUSTOMER_AISLE_Z, 0], [...ORDER_SPOT]],
    nextPoint: 0,
    elapsed: 0,
    visit: null,
  }
}

function customerPath(customer: Customer, stage: CustomerStage, path: CustomerPoint[]) {
  customer.stage = stage
  customer.path = path
  customer.nextPoint = 0
  customer.elapsed = 0
}

export function customerWait(customer: Customer, stage: CustomerStage) {
  customerPath(customer, stage, [])
}

export function customerToPickup(customer: Customer) {
  customerPath(customer, 'to-pickup', [[ORDER_SPOT[0], 0.85, 0], [PICKUP_SPOT[0], 0.85, 0], [...PICKUP_SPOT]])
}

export function customerToCondiment(customer: Customer) {
  customerPath(customer, 'to-condiment', [
    [PICKUP_SPOT[0], CUSTOMER_AISLE_Z, 0],
    [CONDIMENT_SPOT[0], CUSTOMER_AISLE_Z, 0],
    [...CONDIMENT_SPOT],
  ])
}

export function customerToTable(customer: Customer) {
  if (!customer.visit?.table) return
  const table = TABLES[customer.visit.table]
  customerPath(customer, 'to-table', [
    [CONDIMENT_SPOT[0], CUSTOMER_AISLE_Z, 0],
    [PUBLIC_AISLE_X, CUSTOMER_AISLE_Z, 0],
    ...upperFloorRoute(table.floor),
    ...table.approach.map(([x, z]): CustomerPoint => [x, z, table.floor * FLOOR_HEIGHT]),
  ])
}

export function customerToReturn(customer: Customer) {
  if (!customer.visit?.table) return
  customerPath(customer, 'to-return', [
    ...fromTable(customer.visit.table),
    [RETURN_SPOT[0], CUSTOMER_AISLE_Z, 0],
    [...RETURN_SPOT],
  ])
}

export function customerLeave(customer: Customer) {
  const [x, z, elevation] = customer.position
  const path: CustomerPoint[] = []
  if (customer.stage === 'drinking' && customer.visit?.table) path.push(...fromTable(customer.visit.table))
  else if (!(Math.abs(x - CUSTOMER_ENTRANCE.x) < 0.1 && z >= CUSTOMER_AISLE_Z)) {
    path.push([x, CUSTOMER_AISLE_Z, elevation])
  }

  if (path.length) path.push([CUSTOMER_ENTRANCE.x, CUSTOMER_AISLE_Z, 0])
  path.push([...ENTRY_SPOT])
  customerPath(customer, 'leaving', path)
}

export function moveCustomer(customer: Customer, seconds: number) {
  let distance = Math.max(0, seconds) * CUSTOMER_SPEED

  while (customer.nextPoint < customer.path.length) {
    const target = customer.path[customer.nextPoint]
    const dx = target[0] - customer.position[0]
    const dz = target[1] - customer.position[1]
    const dy = target[2] - customer.position[2]
    const remaining = Math.hypot(dx, dz, dy)
    if (remaining > 0.0001) {
      customer.yaw = Math.atan2(dx, dz)
    }

    if (remaining <= distance + 0.0001) {
      customer.position = [...target]
      customer.nextPoint++
      distance = Math.max(0, distance - remaining)
    } else {
      customer.position[0] += (dx / remaining) * distance
      customer.position[1] += (dz / remaining) * distance
      customer.position[2] += (dy / remaining) * distance
      break
    }
  }

  return customer.nextPoint === customer.path.length
}

export function customerSitting(customer: Customer) {
  if (!customer.visit?.table) {
    return 0
  }
  if (customer.stage === 'drinking') {
    return 1
  }
  const sittingDown = customer.stage === 'to-table' && customer.nextPoint === customer.path.length - 1
  const standingUp = ['to-return', 'leaving'].includes(customer.stage) && customer.nextPoint === 0
  if (!sittingDown && !standingUp) {
    return 0
  }
  const seat = customerSeat(customer.visit.table)
  return Math.max(
    0,
    1 - Math.hypot(customer.position[0] - seat[0], customer.position[1] - seat[1], customer.position[2] - seat[2]),
  )
}
