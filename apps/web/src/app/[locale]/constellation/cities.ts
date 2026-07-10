// Curated birth-location presets. Display names are localized in `messages.ts`
// under `Constellation.cities.<key>`; each IANA time zone is DST/history aware
// via the browser's tz database when converting to UTC.

export type City = {
  key: string
  latitude: number
  longitude: number
  timeZone: string
}

export const CITIES: readonly City[] = [
  {
    key: 'seoul',
    latitude: 37.5665,
    longitude: 126.978,
    timeZone: 'Asia/Seoul',
  },
  {
    key: 'busan',
    latitude: 35.1796,
    longitude: 129.0756,
    timeZone: 'Asia/Seoul',
  },
  {
    key: 'incheon',
    latitude: 37.4563,
    longitude: 126.7052,
    timeZone: 'Asia/Seoul',
  },
  {
    key: 'daegu',
    latitude: 35.8714,
    longitude: 128.6014,
    timeZone: 'Asia/Seoul',
  },
  {
    key: 'gwangju',
    latitude: 35.1595,
    longitude: 126.8526,
    timeZone: 'Asia/Seoul',
  },
  {
    key: 'daejeon',
    latitude: 36.3504,
    longitude: 127.3845,
    timeZone: 'Asia/Seoul',
  },
  {
    key: 'jeju',
    latitude: 33.4996,
    longitude: 126.5312,
    timeZone: 'Asia/Seoul',
  },
  {
    key: 'tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    timeZone: 'Asia/Tokyo',
  },
  {
    key: 'osaka',
    latitude: 34.6937,
    longitude: 135.5023,
    timeZone: 'Asia/Tokyo',
  },
  {
    key: 'beijing',
    latitude: 39.9042,
    longitude: 116.4074,
    timeZone: 'Asia/Shanghai',
  },
  {
    key: 'shanghai',
    latitude: 31.2304,
    longitude: 121.4737,
    timeZone: 'Asia/Shanghai',
  },
  {
    key: 'hongkong',
    latitude: 22.3193,
    longitude: 114.1694,
    timeZone: 'Asia/Hong_Kong',
  },
  {
    key: 'taipei',
    latitude: 25.033,
    longitude: 121.5654,
    timeZone: 'Asia/Taipei',
  },
  {
    key: 'singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    timeZone: 'Asia/Singapore',
  },
  {
    key: 'bangkok',
    latitude: 13.7563,
    longitude: 100.5018,
    timeZone: 'Asia/Bangkok',
  },
  {
    key: 'london',
    latitude: 51.5074,
    longitude: -0.1278,
    timeZone: 'Europe/London',
  },
  {
    key: 'paris',
    latitude: 48.8566,
    longitude: 2.3522,
    timeZone: 'Europe/Paris',
  },
  {
    key: 'newyork',
    latitude: 40.7128,
    longitude: -74.006,
    timeZone: 'America/New_York',
  },
  {
    key: 'losangeles',
    latitude: 34.0522,
    longitude: -118.2437,
    timeZone: 'America/Los_Angeles',
  },
  {
    key: 'sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    timeZone: 'Australia/Sydney',
  },
]

export const DEFAULT_CITY_KEY = 'seoul'

export function findCity(key: string): City {
  return CITIES.find((c) => c.key === key) ?? CITIES[0]
}
