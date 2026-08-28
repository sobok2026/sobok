import { createProblem } from '@sobok/edge/problem'

export type ProblemSlug =
  | 'invalid-request'
  | 'not-found'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'payload-too-large'
  | 'length-required'
  | 'storage-quota-exceeded'
  | 'upload-limit-reached'
  | 'upload-expired'
  | 'upload-incomplete'
  | 'upload-unavailable'
  | 'range-not-satisfiable'
  | 'internal'

export const problem = createProblem<ProblemSlug>('https://sobok.cc/problems/civil/')
