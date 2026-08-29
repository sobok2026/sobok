import type { CivilArtifactVerificationGateway } from '@sobok/civil/artifact'
import {
  CivilCalculationOutputSchema,
  type CivilComputationGateway,
  calculateEarthworkAverageEndArea,
  canonicalJson,
} from '@sobok/civil/calculation'
import type { CivilDeliveryGenerationGateway } from '@sobok/civil/delivery'
import { sha256Hex } from '@sobok/edge/tokens'
import { z } from 'zod'
import { verifyArtifact } from './artifact-verification'
import { generateDeliveryPackage } from './delivery-generation'

type CivilComputeGateway = CivilComputationGateway & CivilArtifactVerificationGateway & CivilDeliveryGenerationGateway
type ComputeEnv = Omit<CivilComputeBindings, 'DATABASE'> & { DATABASE: CivilComputeGateway }

type ComputeMessage = { jobId?: string; artifactId?: string; packageId?: string }

const CALCULATION_QUEUES = new Set(['civil-calculations', 'civil-calculations-stg'])
const ARTIFACT_QUEUES = new Set(['civil-artifacts', 'civil-artifacts-stg'])
const DELIVERY_QUEUES = new Set(['civil-deliveries', 'civil-deliveries-stg'])
const CalculationMessageSchema = z.object({ jobId: z.uuid() }).strict()
const ArtifactMessageSchema = z.object({ artifactId: z.uuid() }).strict()
const DeliveryMessageSchema = z.object({ packageId: z.uuid() }).strict()

async function processCalculationMessage(message: Message<ComputeMessage>, env: ComputeEnv): Promise<void> {
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
    const output = CivilCalculationOutputSchema.parse(calculateEarthworkAverageEndArea(claim.work.input))
    const outputHash = await sha256Hex(canonicalJson(output))
    await env.DATABASE.completeCalculation({ jobId, output, outputHash })
    message.ack()
  } catch (error) {
    const failureCode = error instanceof Error ? error.name : 'UnknownError'
    console.error(JSON.stringify({ event: 'civil.calculation.failed', jobId, failureCode }))
    try {
      await env.DATABASE.failCalculation({ jobId, failureCode })
    } finally {
      message.retry({ delaySeconds: 60 })
    }
  }
}

async function processArtifactMessage(message: Message<ComputeMessage>, env: ComputeEnv): Promise<void> {
  const parsedMessage = ArtifactMessageSchema.safeParse(message.body)
  if (!parsedMessage.success) {
    console.error(JSON.stringify({ event: 'civil.artifact.invalid_message' }))
    message.ack()
    return
  }
  const { artifactId } = parsedMessage.data
  try {
    const claim = await env.DATABASE.claimArtifactVerification(artifactId)
    if (claim.status === 'complete') {
      message.ack()
      return
    }
    if (claim.status === 'retry') {
      message.retry({ delaySeconds: 60 })
      return
    }
    if (claim.status === 'cleanup') {
      await env.CIVIL_FILES.delete(claim.objectKey)
      await env.DATABASE.completeArtifactCleanup(artifactId)
      message.ack()
      return
    }
    const output = await verifyArtifact(env.CIVIL_FILES, claim.work)
    await env.DATABASE.completeArtifactVerification({ artifactId, output })
    if (output.decision === 'rejected') {
      await env.CIVIL_FILES.delete(claim.work.objectKey)
      await env.DATABASE.completeArtifactCleanup(artifactId)
    }
    message.ack()
  } catch (error) {
    const failureCode = error instanceof Error ? error.name : 'UnknownError'
    console.error(JSON.stringify({ event: 'civil.artifact.verification_failed', artifactId, failureCode }))
    try {
      await env.DATABASE.failArtifactVerification({ artifactId, failureCode })
    } finally {
      message.retry({ delaySeconds: 60 })
    }
  }
}

async function processDeliveryMessage(message: Message<ComputeMessage>, env: ComputeEnv): Promise<void> {
  const parsedMessage = DeliveryMessageSchema.safeParse(message.body)
  if (!parsedMessage.success) {
    console.error(JSON.stringify({ event: 'civil.delivery.invalid_message' }))
    message.ack()
    return
  }
  const { packageId } = parsedMessage.data
  try {
    const claim = await env.DATABASE.claimDeliveryGeneration(packageId)
    if (claim.status === 'complete') {
      message.ack()
      return
    }
    if (claim.status === 'retry') {
      message.retry({ delaySeconds: 60 })
      return
    }
    if (claim.status === 'cleanup') {
      await env.CIVIL_FILES.delete(claim.objectKey)
      await env.DATABASE.completeDeliveryCleanup(packageId)
      message.ack()
      return
    }
    const output = await generateDeliveryPackage(env.CIVIL_FILES, claim.work)
    await env.DATABASE.completeDeliveryGeneration({ packageId, output })
    message.ack()
  } catch (error) {
    const failureCode = error instanceof Error ? error.name : 'UnknownError'
    console.error(JSON.stringify({ event: 'civil.delivery.generation_failed', packageId, failureCode }))
    try {
      await env.DATABASE.failDeliveryGeneration({ packageId, failureCode })
    } finally {
      message.retry({ delaySeconds: 60 })
    }
  }
}

export default {
  async queue(batch, env): Promise<void> {
    for (const message of batch.messages) {
      if (CALCULATION_QUEUES.has(batch.queue)) await processCalculationMessage(message, env)
      else if (ARTIFACT_QUEUES.has(batch.queue)) await processArtifactMessage(message, env)
      else if (DELIVERY_QUEUES.has(batch.queue)) await processDeliveryMessage(message, env)
      else {
        console.error(JSON.stringify({ event: 'civil.compute.unconfigured_queue', queue: batch.queue }))
        message.ack()
      }
    }
  },
} satisfies ExportedHandler<ComputeEnv, ComputeMessage>
