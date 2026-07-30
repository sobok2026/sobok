// The shape of one axis's copy, and the shape of one pole's.
//
// Declared here rather than in the route's `_lib/types.ts` because the axis tables next to this file are read by
// both programs — the result screen and the paid rule engine — and a type that only the Next tree can reach
// would force the Worker to re-declare it.
export type AxisPoleContent = {
  description: string
  label: string
  reflection: string
}

export type AxisContent = {
  description: string
  first: AxisPoleContent
  name: string
  second: AxisPoleContent
}
