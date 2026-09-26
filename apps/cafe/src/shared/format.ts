export function batchDate(time: number | null, withSeconds = false) {
  return time === null
    ? '—'
    : new Date(time * 1000).toLocaleString('ko-KR', {
        timeZone: 'UTC',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: withSeconds ? '2-digit' : undefined,
        hourCycle: 'h23',
      })
}

export function formatAmount(value: number) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)
}

export function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}
