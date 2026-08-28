import { Container } from '@cloudflare/containers'
import { type CivilArtifactInspectionGateway, CivilArtifactInspectionOutputSchema } from '@sobok/civil/artifact'
import { CivilCalculationOutputSchema, type CivilComputationGateway, canonicalJson } from '@sobok/civil/calculation'
import { sha256Hex } from '@sobok/edge/tokens'
import { z } from 'zod'

export class CivilCalculationContainer extends Container {
  defaultPort = 8080
  requiredPorts = [8080]
  sleepAfter = '2m'
  enableInternet = false
  pingEndpoint = '/health'
}

export class CivilArtifactContainer extends Container {
  defaultPort = 8080
  requiredPorts = [8080]
  sleepAfter = '1m'
  enableInternet = false
  pingEndpoint = '/health'
}

type ComputeEnv = Omit<CivilComputeBindings, 'DATABASE'> & {
  DATABASE: CivilComputationGateway & CivilArtifactInspectionGateway
}

type CalculationMessage = { jobId: string }
type ArtifactMessage = { artifactId: string }
type CivilComputeMessage = CalculationMessage | ArtifactMessage

const CALCULATION_QUEUES = new Set(['civil-calculations', 'civil-calculations-stg'])
const ARTIFACT_QUEUES = new Set(['civil-artifacts', 'civil-artifacts-stg'])
const CalculationMessageSchema = z.object({ jobId: z.uuid() }).strict()
const ArtifactMessageSchema = z.object({ artifactId: z.uuid() }).strict()

async function processCalculationMessage(message: Message<CivilComputeMessage>, env: ComputeEnv): Promise<void> {
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

    const container = env.CALCULATION_CONTAINER.getByName(jobId)
    await container.startAndWaitForPorts()
    const response = await container.fetch(
      new Request('http://civil-calculation.internal/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(work),
      }),
    )
    if (!response.ok) throw new Error(`calculation container returned ${response.status}`)

    const output = CivilCalculationOutputSchema.parse(await response.json())
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

async function processArtifactMessage(message: Message<CivilComputeMessage>, env: ComputeEnv): Promise<void> {
  const parsedMessage = ArtifactMessageSchema.safeParse(message.body)
  if (!parsedMessage.success) {
    console.error(JSON.stringify({ event: 'civil.artifact.invalid_message' }))
    message.ack()
    return
  }

  const { artifactId } = parsedMessage.data
  try {
    const claim = await env.DATABASE.claimArtifactInspection(artifactId)
    if (claim.status === 'complete') {
      message.ack()
      return
    }
    if (claim.status === 'cleanup') {
      await env.CIVIL_FILES.delete(claim.objectKey)
      message.ack()
      return
    }
    if (claim.status === 'retry') {
      message.retry({ delaySeconds: 60 })
      return
    }
    const { work } = claim
    const object = await env.CIVIL_FILES.get(work.objectKey)
    if (!object || object.size !== work.byteSize) throw new Error('artifact object missing or size mismatched')

    const container = env.ARTIFACT_CONTAINER.getByName(artifactId)
    await container.startAndWaitForPorts()
    const response = await container.fetch(
      new Request('http://civil-artifact.internal/inspect-artifact', {
        method: 'POST',
        headers: {
          'content-length': String(work.byteSize),
          'x-artifact-id': artifactId,
          'x-declared-media-type': work.declaredMediaType,
        },
        body: object.body,
      }),
    )
    if (!response.ok) throw new Error(`artifact container returned ${response.status}`)

    const output = CivilArtifactInspectionOutputSchema.parse(await response.json())
    await env.DATABASE.completeArtifactInspection({ artifactId, output })
    if (output.decision === 'rejected') await env.CIVIL_FILES.delete(work.objectKey)
    message.ack()
  } catch (error) {
    const failureCode = error instanceof Error ? error.name : 'UnknownError'
    console.error(
      JSON.stringify({
        event: 'civil.artifact.inspection_failed',
        artifactId,
        failureCode,
        message: error instanceof Error ? error.message : 'unknown',
      }),
    )
    try {
      await env.DATABASE.failArtifactInspection({ artifactId, failureCode })
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
      } else if (ARTIFACT_QUEUES.has(batch.queue)) {
        await processArtifactMessage(message, env)
      } else {
        console.error(JSON.stringify({ event: 'civil.compute.unconfigured_queue', queue: batch.queue }))
        message.ack()
      }
    }
  },
} satisfies ExportedHandler<ComputeEnv, CivilComputeMessage>
