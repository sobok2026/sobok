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

export function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

/** Picks the particle form by the last syllable's final consonant; Latin endings read as open syllables. */
export function josa(word: string, afterConsonant: string, afterVowel: string) {
  const syllable = word.charCodeAt(word.length - 1) - 0xac00
  const final = syllable >= 0 && syllable < 11172 ? syllable % 28 : 0

  return `${word}${final ? afterConsonant : afterVowel}`
}
