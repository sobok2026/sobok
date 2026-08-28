import { z } from 'zod'
import { EARTHWORK_AVERAGE_END_AREA_VERSION, type EarthworkAverageEndAreaOutput } from './earthwork'

export { canonicalJson } from './canonical-json'

export {
  calculateEarthworkAverageEndArea,
  EARTHWORK_AVERAGE_END_AREA_VERSION,
  type EarthworkAverageEndAreaInput,
  type EarthworkAverageEndAreaOutput,
} from './earthwork'

const EarthworkSectionSchema = z.object({
  station: z.number().finite().nonnegative(),
  cutArea: z.number().finite().nonnegative(),
  fillArea: z.number().finite().nonnegative(),
})

export const EarthworkAverageEndAreaInputSchema = z
  .object({
    coordinateReferenceSystem: z.string().trim().min(1).max(64),
    sections: z.array(EarthworkSectionSchema).min(2).max(10_000),
  })
  .superRefine((input, context) => {
    for (let index = 1; index < input.sections.length; index += 1) {
      const previous = input.sections[index - 1]
      const current = input.sections[index]
      if (previous && current && current.station <= previous.station) {
        context.addIssue({
          code: 'custom',
          message: 'stations must be strictly increasing',
          path: ['sections', index, 'station'],
        })
      }
    }
  })

export type ParsedEarthworkAverageEndAreaInput = z.infer<typeof EarthworkAverageEndAreaInputSchema>

export const CivilCalculationWorkSchema = z.object({
  jobId: z.uuid(),
  organizationId: z.uuid(),
  projectId: z.uuid(),
  kind: z.literal('earthwork-average-end-area'),
  algorithmVersion: z.literal(EARTHWORK_AVERAGE_END_AREA_VERSION),
  input: EarthworkAverageEndAreaInputSchema,
})

export type CivilCalculationWork = z.infer<typeof CivilCalculationWorkSchema>

export type CivilCalculationClaim =
  | { status: 'work'; work: CivilCalculationWork }
  | { status: 'complete' }
  | { status: 'retry' }

export const CivilCalculationOutputSchema = z.object({
  algorithmVersion: z.literal(EARTHWORK_AVERAGE_END_AREA_VERSION),
  coordinateReferenceSystem: z.string(),
  unitSystem: z.literal('SI'),
  segments: z.array(
    z.object({
      fromStation: z.number(),
      toStation: z.number(),
      distance: z.number(),
      cutVolume: z.number(),
      fillVolume: z.number(),
    }),
  ),
  totals: z.object({
    cutVolume: z.number(),
    fillVolume: z.number(),
    netVolume: z.number(),
  }),
})

export type CivilCalculationOutput = z.infer<typeof CivilCalculationOutputSchema> & EarthworkAverageEndAreaOutput

export interface CivilComputationGateway {
  claimCalculation(jobId: string): Promise<CivilCalculationClaim>
  completeCalculation(input: { jobId: string; output: CivilCalculationOutput; outputHash: string }): Promise<void>
  failCalculation(input: { jobId: string; failureCode: string }): Promise<void>
}
