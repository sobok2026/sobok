import type { AxisId } from '../model'
import type { AxisContent } from './axis-content'

// The eight axis names, pole labels, pole meanings and reflection prompts for zh.
//
// This sits in deep-type/ rather than under src/ because BOTH programs read it: the result screen renders the
// axis bars from it and the paid rule engine narrates bands with it. It used to live in the route's _content
// module, which meant worker/report reached across into src/app/[locale]/… — an App Router private folder — to
// build a report. One table, one place, and the report can no longer call an axis something the screen above it
// does not.
export const zhAxisContent = {
  EI: {
    name: '',
    description: '',
    first: { label: '', description: '', reflection: '' },
    second: { label: '', description: '', reflection: '' },
  },
  SN: {
    name: '',
    description: '',
    first: { label: '', description: '', reflection: '' },
    second: { label: '', description: '', reflection: '' },
  },
  TF: {
    name: '',
    description: '',
    first: { label: '', description: '', reflection: '' },
    second: { label: '', description: '', reflection: '' },
  },
  JP: {
    name: '',
    description: '',
    first: { label: '', description: '', reflection: '' },
    second: { label: '', description: '', reflection: '' },
  },
  RM: {
    name: '',
    description: '',
    first: { label: '', description: '', reflection: '' },
    second: { label: '', description: '', reflection: '' },
  },
  OA: {
    name: '',
    description: '',
    first: { label: '', description: '', reflection: '' },
    second: { label: '', description: '', reflection: '' },
  },
  VH: {
    name: '',
    description: '',
    first: { label: '', description: '', reflection: '' },
    second: { label: '', description: '', reflection: '' },
  },
  UO: {
    name: '',
    description: '',
    first: { label: '', description: '', reflection: '' },
    second: { label: '', description: '', reflection: '' },
  },
} as const satisfies Record<AxisId, AxisContent>
