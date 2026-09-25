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
