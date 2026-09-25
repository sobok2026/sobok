import { linkReferences } from './reference-links'
import referenceData from './references.generated.json'
export const referenceLinks = linkReferences(referenceData)
export const COLD_BREW_HOURS = referenceLinks.brew.hours
