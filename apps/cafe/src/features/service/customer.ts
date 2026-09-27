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
import { STATIONS, type TableId } from '../../content/stations'
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
type CustomerPoint = [number, number]

export const CUSTOMER_DOOR_X = 5.45
const CUSTOMER_ENTRANCE: CustomerPoint = [CUSTOMER_DOOR_X, 6.65]
const ORDER_SPOT: CustomerPoint = [-4.8, 0.45]
const PICKUP_SPOT: CustomerPoint = [6.1, 0.25]
export const CONDIMENT_SPOT: CustomerPoint = [STATIONS.supplies.x - 0.95, STATIONS.supplies.z]
export const RETURN_SPOT: CustomerPoint = [STATIONS.condiment.x, STATIONS.condiment.z - 0.85]
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

const customerSeat = (table: TableId): CustomerPoint => [STATIONS[table].x, 2.75]

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
    position: [...CUSTOMER_ENTRANCE],
    yaw: Math.PI,
    path: [[CUSTOMER_DOOR_X, 1.7], [ORDER_SPOT[0], 1.7], [...ORDER_SPOT]],
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
  customerPath(customer, 'to-pickup', [[ORDER_SPOT[0], 0.85], [PICKUP_SPOT[0], 0.85], [...PICKUP_SPOT]])
}

export function customerToCondiment(customer: Customer) {
  customerPath(customer, 'to-condiment', [[PICKUP_SPOT[0], 1.7], [CONDIMENT_SPOT[0], 1.7], [...CONDIMENT_SPOT]])
}

export function customerToTable(customer: Customer) {
  if (!customer.visit?.table) {
    return
  }
  const seat = customerSeat(customer.visit.table)
  customerPath(customer, 'to-table', [[CONDIMENT_SPOT[0], 1.7], [seat[0] + 1, 1.7], [seat[0] + 1, seat[1]], seat])
}

export function customerToReturn(customer: Customer) {
  if (!customer.visit?.table) {
    return
  }
  const seat = customerSeat(customer.visit.table)
  customerPath(customer, 'to-return', [
    [seat[0] + 1, seat[1]],
    [seat[0] + 1, 1.7],
    [RETURN_SPOT[0], 1.7],
    [...RETURN_SPOT],
  ])
}

export function customerLeave(customer: Customer) {
  const [x, z] = customer.position
  const path: CustomerPoint[] = []

  if (customer.stage === 'drinking' && customer.visit?.table) {
    const seat = customerSeat(customer.visit.table)
    path.push([seat[0] + 1, seat[1]], [seat[0] + 1, 1.7])
  } else if (!(Math.abs(x - CUSTOMER_DOOR_X) < 0.1 && z >= 1.7)) {
    path.push([x, 1.7])
  }

  if (path.length) {
    path.push([CUSTOMER_DOOR_X, 1.7])
  }
  path.push([...CUSTOMER_ENTRANCE])
  customerPath(customer, 'leaving', path)
}

export function moveCustomer(customer: Customer, seconds: number) {
  let distance = Math.max(0, seconds) * CUSTOMER_SPEED

  while (customer.nextPoint < customer.path.length) {
    const target = customer.path[customer.nextPoint]
    const dx = target[0] - customer.position[0]
    const dz = target[1] - customer.position[1]
    const remaining = Math.hypot(dx, dz)
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
  return Math.max(0, 1 - Math.hypot(customer.position[0] - seat[0], customer.position[1] - seat[1]))
}
