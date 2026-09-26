type Locale = 'en' | 'ja' | 'ko' | 'zh'

const THOUSAND = 1000
const MILLION = 1000000
const BILLION = 1000000000
const TEN_THOUSAND = 10000
const HUNDRED_MILLION = 100000000

export function formatNumber(num: number, locale: '' | Locale = 'ko'): string {
  if (num < THOUSAND) {
    return num.toString()
  }

  return locale === 'ko' ? formatKoreanNumberOptimized(num) : formatEnglishNumberOptimized(num)
}

const decimalFormatters = new Map<string, Intl.NumberFormat>()

/**
 * The one rule for showing a non-integer number in UI: the integer part is never rounded away and the fraction is
 * cut to 3 significant digits, without trailing zeros (12.345 → 12.3, 0.0012345 → 0.00123, 1234.56 → 1,235).
 * Three rather than two because recipe and measurement data is authored at that precision (a 3.75ml pump) and two
 * would print it wrong. Currency keeps its own minor-unit formatting.
 */
export function formatDecimal(value: number, locale = 'ko'): string {
  let formatter = decimalFormatters.get(locale)

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      maximumSignificantDigits: 3,
      roundingPriority: 'morePrecision',
    })
    decimalFormatters.set(locale, formatter)
  }

  return formatter.format(value)
}

const numberFormatters = {
  en: new Intl.NumberFormat('en-US'),
  ko: new Intl.NumberFormat('ko-KR'),
} as const

function formatEnglishNumberOptimized(num: number): string {
  // Small epsilon to handle floating point precision issues
  const EPSILON = 1e-10

  if (num < MILLION) {
    const value = num / THOUSAND
    const isWholeNumber = num % THOUSAND === 0
    const formatted = isWholeNumber
      ? Math.floor(value)
      : value >= 100
        ? Math.floor(value)
        : value >= 10
          ? Math.floor(value * 10 + EPSILON) / 10
          : Math.floor(value * 100 + EPSILON) / 100
    return `${numberFormatters.en.format(formatted)}k`
  }

  if (num < BILLION) {
    const value = num / MILLION
    const isWholeNumber = num % MILLION === 0
    const formatted = isWholeNumber
      ? Math.floor(value)
      : value >= 100
        ? Math.floor(value)
        : value >= 10
          ? Math.floor(value * 10 + EPSILON) / 10
          : Math.floor(value * 100 + EPSILON) / 100
    return `${numberFormatters.en.format(formatted)}M`
  }

  const value = num / BILLION
  const isWholeNumber = num % BILLION === 0
  const formatted = isWholeNumber
    ? Math.floor(value)
    : value >= 100
      ? Math.floor(value)
      : value >= 10
        ? Math.floor(value * 10 + EPSILON) / 10
        : Math.floor(value * 100 + EPSILON) / 100
  return `${numberFormatters.en.format(formatted)}B`
}

function formatKoreanNumberOptimized(num: number): string {
  // Small epsilon to handle floating point precision issues
  const EPSILON = 1e-10

  if (num < TEN_THOUSAND) {
    return numberFormatters.ko.format(num)
  }

  if (num < HUNDRED_MILLION) {
    const value = num / TEN_THOUSAND
    const isWholeNumber = num % TEN_THOUSAND === 0
    const formatted = isWholeNumber || value >= 100 ? Math.floor(value) : Math.floor(value * 10 + EPSILON) / 10
    return `${numberFormatters.ko.format(formatted)}만`
  }

  const value = num / HUNDRED_MILLION
  const isWholeNumber = num % HUNDRED_MILLION === 0
  const formatted = isWholeNumber || value >= 100 ? Math.floor(value) : Math.floor(value * 10 + EPSILON) / 10
  return `${numberFormatters.ko.format(formatted)}억`
}
