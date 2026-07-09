export const DEGRADED_HEADER = 'Sobok-Degraded'
export const DEGRADED_REASON_HEADER = 'Sobok-Degraded-Reason'

export type DegradedReason = 'IMAGES_ONLY'

export function isDegradedResponse(headers: Headers): boolean {
  return headers.get(DEGRADED_HEADER) === '1'
}
