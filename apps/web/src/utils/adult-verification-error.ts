import { PROBLEM } from '@sobok/contracts'
import { isProblemType } from '@sobok/http/problem-details'

import { HttpResponseError, ProblemDetailsError } from '@/utils/fetch-response'

export function isAdultVerificationRequiredError(error: unknown): boolean {
  if (error instanceof HttpResponseError && error.status === 403) {
    return true
  }

  return (
    error instanceof ProblemDetailsError &&
    error.status === 403 &&
    isProblemType(error.type, PROBLEM.ADULT_VERIFICATION_REQUIRED.slug)
  )
}
