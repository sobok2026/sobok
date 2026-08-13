import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import sharp from 'sharp'
import {
  objectKeyForEdition,
  type ReleaseManifest,
  readAssetContract,
  releaseManifestSchema,
  sha256Hex,
} from './guardian-card-art'

type SourceManifest = {
  status?: unknown
  outputContract?: {
    format?: unknown
    width?: unknown
    height?: unknown
  }
  selectedOutputs?: Array<{ editionId?: unknown; filename?: unknown; sha256?: unknown }>
  reviewArtifacts?: {
    approvedOutputCount?: unknown
    pendingVisualApproval?: unknown
  }
}

const { values } = parseArgs({
  options: {
    source: { type: 'string' },
    output: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run guardian-cards:prepare-art --source <approved-source-manifest.json> --output <release-directory>`)
  process.exit(0)
}

if (!values.source || !values.output) {
  throw new Error('--source and --output are required')
}

const sourceManifestPath = resolve(values.source)
const outputDirectory = resolve(values.output)
const contract = await readAssetContract()
const sourceManifest = JSON.parse(await readFile(sourceManifestPath, 'utf8')) as SourceManifest
const selectedOutputs = sourceManifest.selectedOutputs
if (sourceManifest.status !== 'human_visually_approved') {
  throw new Error('source manifest must have human_visually_approved status')
}
if (
  sourceManifest.outputContract?.format !== contract.sourceContract.format ||
  sourceManifest.outputContract.width !== contract.sourceContract.width ||
  sourceManifest.outputContract.height !== contract.sourceContract.height
) {
  throw new Error('source manifest output contract must match the tracked PNG source contract')
}
if (!Array.isArray(selectedOutputs) || selectedOutputs.length === 0) {
  throw new Error('source manifest must contain at least one selectedOutputs entry')
}
if (
  sourceManifest.reviewArtifacts?.approvedOutputCount !== selectedOutputs.length ||
  !Array.isArray(sourceManifest.reviewArtifacts.pendingVisualApproval) ||
  sourceManifest.reviewArtifacts.pendingVisualApproval.length !== 0
) {
  throw new Error('every selected source output must have completed human visual approval')
}

const assets: ReleaseManifest['assets'][number][] = []
const editionIds = new Set<string>()
const outputParent = dirname(outputDirectory)
const temporaryOutputDirectory = join(outputParent, `.${basename(outputDirectory)}-${process.pid}.tmp`)
await mkdir(outputDirectory, { recursive: true })
const existingOutputEntries = await readdir(outputDirectory)
await rm(temporaryOutputDirectory, { recursive: true, force: true })
await mkdir(temporaryOutputDirectory, { recursive: false })

try {
  for (const selected of selectedOutputs) {
    if (
      typeof selected.editionId !== 'string' ||
      typeof selected.filename !== 'string' ||
      typeof selected.sha256 !== 'string'
    ) {
      throw new Error('each selected output requires editionId, filename, and sha256 strings')
    }
    if (editionIds.has(selected.editionId)) {
      throw new Error(`duplicate editionId: ${selected.editionId}`)
    }
    editionIds.add(selected.editionId)

    if (basename(selected.filename) !== selected.filename || !selected.filename.endsWith('.png')) {
      throw new Error(`${selected.editionId}: source filename must be a local PNG basename`)
    }

    const sourcePath = join(dirname(sourceManifestPath), selected.filename)
    const source = await readFile(sourcePath)
    const sourceHash = sha256Hex(source)
    if (sourceHash !== selected.sha256) {
      throw new Error(`${selected.editionId}: source sha256 mismatch`)
    }

    const sourceMetadata = await sharp(source, { failOn: 'error' }).metadata()
    if (
      sourceMetadata.format !== contract.sourceContract.format ||
      sourceMetadata.width !== contract.sourceContract.width ||
      sourceMetadata.height !== contract.sourceContract.height
    ) {
      throw new Error(`${selected.editionId}: source must be 1080x1440 PNG`)
    }

    const outputFilename = `${selected.editionId}.webp`
    const outputPath = join(temporaryOutputDirectory, outputFilename)
    const delivery = await sharp(source, { failOn: 'error' })
      .webp({
        quality: contract.deliveryContract.quality,
        effort: contract.deliveryContract.effort,
        smartSubsample: contract.deliveryContract.smartSubsample,
        preset: 'picture',
      })
      .toBuffer()
    await writeFile(outputPath, delivery)

    const deliveryMetadata = await sharp(delivery, { failOn: 'error' }).metadata()
    if (
      deliveryMetadata.format !== contract.deliveryContract.format ||
      deliveryMetadata.width !== contract.deliveryContract.width ||
      deliveryMetadata.height !== contract.deliveryContract.height
    ) {
      throw new Error(`${selected.editionId}: optimized delivery must be 1080x1440 WebP`)
    }

    assets.push({
      editionId: selected.editionId,
      objectKey: objectKeyForEdition(selected.editionId),
      sourceArtworkSha256: sourceHash,
      deliveryArtworkSha256: sha256Hex(delivery),
      byteSize: delivery.byteLength,
      width: contract.deliveryContract.width,
      height: contract.deliveryContract.height,
    })
  }

  assets.sort((left, right) => left.editionId.localeCompare(right.editionId))
  const releaseManifest = releaseManifestSchema.parse({
    schema: 'stella-guardian-card-art-release/v1',
    locale: contract.locale,
    contentType: contract.deliveryContract.mimeType,
    cacheControl: contract.deliveryContract.cacheControl,
    assetCount: assets.length,
    assets,
  })
  await writeFile(join(temporaryOutputDirectory, 'manifest.json'), `${JSON.stringify(releaseManifest, null, 2)}\n`)

  const temporaryOutputEntries = (await readdir(temporaryOutputDirectory)).sort()
  if (existingOutputEntries.length > 0) {
    const sortedExistingOutputEntries = existingOutputEntries.toSorted()
    if (JSON.stringify(sortedExistingOutputEntries) !== JSON.stringify(temporaryOutputEntries)) {
      throw new Error(`output directory contains a different release: ${outputDirectory}`)
    }
    for (const entry of temporaryOutputEntries) {
      const [existing, prepared] = await Promise.all([
        readFile(join(outputDirectory, entry)),
        readFile(join(temporaryOutputDirectory, entry)),
      ])
      if (sha256Hex(existing) !== sha256Hex(prepared)) {
        throw new Error(`output directory contains a different ${entry}: ${outputDirectory}`)
      }
    }
  } else {
    for (const entry of temporaryOutputEntries) {
      await copyFile(join(temporaryOutputDirectory, entry), join(outputDirectory, entry))
    }
  }
} finally {
  await rm(temporaryOutputDirectory, { recursive: true, force: true })
}

const deliveryBytes = assets.reduce((sum, asset) => sum + asset.byteSize, 0)
console.log(`prepared: ${assets.length} WebP assets (${deliveryBytes.toLocaleString()} bytes) in ${outputDirectory}`)
