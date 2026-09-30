import { customizationPrice } from '../../content/customizations'
import type { DrinkSize } from '../../content/drink-sizes'
import { RECIPES, recipeFor } from '../../content/recipes'
import type { OrderLine } from '../../simulation/state'
import type { FoodLine } from '../food/model'
import type { Coupon, DiscountDetail, SaleBenefits } from './checkout-model'

export type PricedSale = { lines: OrderLine[]; foodLines: FoodLine[]; benefits: SaleBenefits }
export type LinePrice = {
  id: string
  gross: number
  deposit: number
  discount: number
  net: number
  discounts: DiscountDetail[]
}
type Unit = {
  line: OrderLine | FoodLine
  drink: OrderLine | null
  coupon: boolean
  remaining: number
  quote: LinePrice
}
const upgradeSizes: DrinkSize[] = ['short', 'tall', 'grande', 'venti']

export function drinkPrice(line: OrderLine) {
  return recipeFor(line.recipe, line.size, line.service, line.customizations).price
}

function basePrice(line: OrderLine, size: DrinkSize) {
  const serving = RECIPES[line.recipe]?.sizes[size]
  return serving?.plans[line.service] ? serving.price : 0
}

export function sizeUpgradeAmount(line: OrderLine, steps = 1) {
  const index = upgradeSizes.indexOf(line.size)
  if (index < 1) return 0

  // Some iced menus have no Short size. Charge the lowest available size.
  for (let lower = Math.max(0, index - steps); lower < index; lower++) {
    const price = basePrice(line, upgradeSizes[lower])
    if (price) return Math.max(0, basePrice(line, line.size) - price)
  }

  return 0
}

export function couponAmount(coupon: Coupon, line: OrderLine | FoodLine) {
  if ('productId' in line) {
    return ['food-amount', 'amount'].includes(coupon.kind) ? Math.min(coupon.amount, line.unitPrice) : 0
  }
  if (coupon.kind === 'food-amount') return 0
  if (coupon.kind === 'amount') return Math.min(coupon.amount, drinkPrice(line))
  if (coupon.kind === 'size-up') return sizeUpgradeAmount(line)
  const recipe = RECIPES[line.recipe]
  if (
    coupon.kind === 'coffee' &&
    !['caffe-americano', 'iced-americano', 'caffe-latte', 'iced-caffe-latte', 'todays-coffee', 'iced-coffee'].includes(
      recipe.recipeId,
    )
  )
    return 0
  const tall = basePrice(line, 'tall')
  if (!tall || line.size === 'single' || line.size === 'trenta') return 0
  return Math.min(tall, basePrice(line, line.size))
}

export function telecomAmount(benefit: NonNullable<SaleBenefits['telecom']>, line: OrderLine) {
  if (benefit.service === 'size-up') {
    const steps = benefit.carrier === 'lgu' ? 2 : 1
    const amount = sizeUpgradeAmount(line, steps)
    return benefit.carrier === 'lgu' ? Math.min(amount, 1400) : amount
  }

  if (!['caffe-americano', 'iced-americano'].includes(RECIPES[line.recipe].recipeId)) return 0
  const size = benefit.carrier === 'kt' ? 'short' : 'tall'
  // The KT Short offer is only available for the HOT Short item.
  if (benefit.carrier === 'kt' && line.size !== 'short') return 0
  if (benefit.carrier === 'lgu' && line.size !== 'tall') return 0
  return basePrice(line, size)
}

export function freeExtraAmount(line: OrderLine) {
  const plan = recipeFor(line.recipe, line.size, line.service).steps
  // The published Extra list covers shots, syrup, drizzle, whip and java chips.
  // Milk, coffee changes and roast are charged separately.
  const milk = line.customizations.milk === 'oat-and-u' ? null : line.customizations.milk
  const eligible = { ...line.customizations, milk, coffee: null, roast: null }
  return Math.min(800, customizationPrice(plan, eligible))
}

function subtract(unit: Unit, label: string, requested: number) {
  const amount = Math.min(unit.remaining, Math.max(0, Math.floor(requested)))
  if (!amount) return
  unit.remaining -= amount
  const detail = unit.quote.discounts.find((detail) => detail.label === label)

  if (detail) detail.amount += amount
  else unit.quote.discounts.push({ label, amount })

  unit.quote.discount += amount
  unit.quote.net -= amount
}

export function quoteSale(sale: PricedSale | null) {
  const quotes: LinePrice[] = []
  const units: Unit[] = []
  if (!sale) return { lines: quotes, gross: 0, discount: 0, deposit: 0, total: 0 }

  for (const line of [...sale.lines, ...sale.foodLines]) {
    const drink = 'recipe' in line ? line : null
    const price = 'unitPrice' in line ? line.unitPrice : drinkPrice(line)
    const deposit = drink ? drink.options.cupDeposit * line.quantity : 0
    const quote = {
      id: line.id,
      gross: price * line.quantity,
      deposit,
      discount: 0,
      net: price * line.quantity + deposit,
      discounts: [],
    }
    quotes.push(quote)

    for (let index = 0; index < line.quantity; index++)
      units.push({ line, drink, coupon: false, remaining: price, quote })
  }

  for (const applied of sale.benefits.coupons) {
    const unit = units.find((unit) => unit.line.id === applied.lineId && !unit.coupon)
    if (!unit) continue
    unit.coupon = true
    subtract(unit, applied.coupon.name, couponAmount(applied.coupon, unit.line))
  }

  for (const unit of units) {
    if (sale.benefits.freeExtra && unit.drink) subtract(unit, 'Free Extra', freeExtraAmount(unit.drink))

    if (sale.benefits.employee && !unit.coupon) {
      const percent = unit.drink ? 65 : 70
      subtract(unit, '임직원 할인', unit.remaining - Math.floor((unit.remaining * percent) / 1000) * 10)
    }
  }

  const telecom = sale.benefits.telecom

  if (telecom) {
    const unit = units.find((unit) => unit.line.id === telecom.lineId && !unit.coupon && unit.remaining > 0)
    if (unit?.drink)
      subtract(
        unit,
        `${telecom.carrier === 'kt' ? 'KT' : 'LG U+'} ${telecom.service === 'size-up' ? '사이즈업' : '아메리카노'}`,
        telecomAmount(telecom, unit.drink),
      )
  }

  for (const unit of units) {
    if (unit.drink?.options.personalCup) subtract(unit, '개인컵 할인', 400)
  }

  const manual = sale.benefits.manual

  if (manual) {
    let remaining = manual.value

    for (const unit of units) {
      if (unit.coupon || (manual.lineId && manual.lineId !== unit.line.id)) continue
      const amount = manual.kind === 'percent' ? Math.floor((unit.remaining * manual.value) / 100) : remaining
      const applied = Math.min(amount, unit.remaining)
      subtract(unit, manual.kind === 'percent' ? `금액/메뉴 할인 ${manual.value}%` : '금액/메뉴 할인', applied)
      remaining -= applied
    }
  }

  return {
    lines: quotes,
    gross: quotes.reduce((sum, line) => sum + line.gross, 0),
    discount: quotes.reduce((sum, line) => sum + line.discount, 0),
    deposit: quotes.reduce((sum, line) => sum + line.deposit, 0),
    total: quotes.reduce((sum, line) => sum + line.net, 0),
  }
}
