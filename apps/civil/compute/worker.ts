import {
  CivilCalculationOutputSchema,
  type CivilComputationGateway,
  calculateEarthworkAverageEndArea,
  canonicalJson,
} from '@sobok/civil/calculation'
import { sha256Hex } from '@sobok/edge/tokens'
import { z } from 'zod'

type ComputeEnv = Omit<CivilComputeBindings, 'DATABASE'> & { DATABASE: CivilComputationGateway }

type CalculationMessage = { jobId: string }

const CALCULATION_QUEUES = new Set(['civil-calculations', 'civil-calculations-stg'])
const CalculationMessageSchema = z.object({ jobId: z.uuid() }).strict()

async function processCalculationMessage(message: Message<CalculationMessage>, env: ComputeEnv): Promise<void> {
  const parsedMessage = CalculationMessageSchema.safeParse(message.body)
  if (!parsedMessage.success) {
    console.error(JSON.stringify({ event: 'civil.calculation.invalid_message' }))
    message.ack()
    return
  }

  const { jobId } = parsedMessage.data
  try {
    const claim = await env.DATABASE.claimCalculation(jobId)
    if (claim.status === 'complete') {
      message.ack()
      return
    }
    if (claim.status === 'retry') {
      message.retry({ delaySeconds: 60 })
      return
    }
    const { work } = claim

    const output = CivilCalculationOutputSchema.parse(calculateEarthworkAverageEndArea(work.input))
    const outputHash = await sha256Hex(canonicalJson(output))
    await env.DATABASE.completeCalculation({ jobId, output, outputHash })
    message.ack()
  } catch (error) {
    const failureCode = error instanceof Error ? error.name : 'UnknownError'
    console.error(
      JSON.stringify({
        event: 'civil.calculation.failed',
        jobId,
        failureCode,
        message: error instanceof Error ? error.message : 'unknown',
      }),
    )
    try {
      await env.DATABASE.failCalculation({ jobId, failureCode })
    } finally {
      message.retry({ delaySeconds: 60 })
    }
  }
}

export default {
  async queue(batch, env): Promise<void> {
    for (const message of batch.messages) {
      if (CALCULATION_QUEUES.has(batch.queue)) {
        await processCalculationMessage(message, env)
      } else {
        console.error(JSON.stringify({ event: 'civil.compute.unconfigured_queue', queue: batch.queue }))
        message.ack()
      }
    }
  },
} satisfies ExportedHandler<ComputeEnv, CalculationMessage>
