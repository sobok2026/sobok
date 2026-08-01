import { PROBLEM } from '@sobok/contracts'
import { isProblemType } from '@sobok/http/problem-details'

import { fetchResponseData, ProblemDetailsError } from '@/utils/fetch-response'

type SearchParamValue = boolean | number | string | number[] | string[] | null | undefined

export class UserVisibleError extends Error {
  readonly name = 'UserVisibleError'
}

export function buildSearchParams(params: Record<string, SearchParamValue>): URLSearchParams {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null && item !== '') {
          searchParams.append(key, String(item))
        }
      }
    } else if (value != null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  return searchParams
}

export async function fetchApiData<T>(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<{ data: T; response: Response }> {
  return await fetchResponseData<T>(new Request(input, init))
}

export function isAuthenticationRequiredError(error: unknown): boolean {
  return (
    error instanceof ProblemDetailsError &&
    error.status === 401 &&
    isProblemType(error.type, PROBLEM.AUTHENTICATION_REQUIRED.slug)
  )
}
