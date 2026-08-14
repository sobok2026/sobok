import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { z } from 'zod'

const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const editionId = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/)

export const assetContractSchema = z
  .object({
    provider: z.literal('cloudflare_r2'),
    infrastructureOwner: z.literal('sobok-ops/infra/cloudflare/account/sobok/stella'),
    objectDeploymentOwner: z.literal('sobok/.github/workflows/guardian-card-art-deploy.yml'),
    runtimeOriginBinding: z.literal('STELLA_GUARDIAN_ASSET_ORIGIN'),
    locale: z.literal('ko'),
    plannedAssetCount: z.literal(1056),
    objectKeyTemplate: z.literal('guardian-cards/ko/{editionId}.webp'),
    artworkPathTemplate: z.literal('{origin}/guardian-cards/ko/{editionId}.webp'),
    editionIdPolicy: z.string().trim().min(20),
    sourceContract: z
      .object({
        format: z.literal('png'),
        width: z.literal(1080),
        height: z.literal(1440),
        trackedInGit: z.literal(false),
      })
      .strict(),
    deliveryContract: z
      .object({
        format: z.literal('webp'),
        mimeType: z.literal('image/webp'),
        width: z.literal(1080),
        height: z.literal(1440),
        quality: z.number().int().min(1).max(100),
        effort: z.number().int().min(0).max(6),
        smartSubsample: z.boolean(),
        cacheControl: z.literal('public, max-age=31536000, immutable'),
        trackedInGit: z.literal(false),
      })
      .strict(),
    environments: z
      .object({
        staging: z
          .object({
            bucket: z.literal('stella-guardian-assets-stg'),
            origin: z.literal('https://guardian-assets-stg.sobok.cc'),
          })
          .strict(),
        production: z
          .object({
            bucket: z.literal('stella-guardian-assets'),
            origin: z.literal('https://guardian-assets.sobok.cc'),
          })
          .strict(),
      })
      .strict(),
  })
  .strict()

export const releaseAssetSchema = z
  .object({
    editionId,
    objectKey: z.string().regex(/^guardian-cards\/ko\/[a-z0-9]+(?:[.-][a-z0-9]+)+\.webp$/),
    sourceArtworkSha256: sha256,
    deliveryArtworkSha256: sha256,
    byteSize: z.number().int().positive(),
    width: z.literal(1080),
    height: z.literal(1440),
  })
  .strict()

export const releaseManifestSchema = z
  .object({
    schema: z.literal('stella-guardian-card-art-release/v1'),
    locale: z.literal('ko'),
    contentType: z.literal('image/webp'),
    cacheControl: z.literal('public, max-age=31536000, immutable'),
    assetCount: z.number().int().positive().max(1056),
    assets: z.array(releaseAssetSchema).min(1).max(1056),
  })
  .strict()

export type AssetContract = z.infer<typeof assetContractSchema>
export type ReleaseManifest = z.infer<typeof releaseManifestSchema>

export const defaultAssetContractPath = fileURLToPath(
  new URL('../content/guardian-cards/guardian-card-asset-contract.json', import.meta.url),
)

export async function readAssetContract(path = defaultAssetContractPath): Promise<AssetContract> {
  return assetContractSchema.parse(JSON.parse(await readFile(path, 'utf8')) as unknown)
}

export async function readReleaseManifest(path: string): Promise<ReleaseManifest> {
  const manifest = releaseManifestSchema.parse(JSON.parse(await readFile(path, 'utf8')) as unknown)
  if (manifest.assetCount !== manifest.assets.length) {
    throw new Error(`assetCount ${manifest.assetCount} does not match ${manifest.assets.length} assets`)
  }

  const editionIds = new Set<string>()
  const objectKeys = new Set<string>()
  const sortedEditionIds = manifest.assets.map((asset) => asset.editionId).toSorted()
  if (manifest.assets.some((asset, index) => asset.editionId !== sortedEditionIds[index])) {
    throw new Error('release assets must be sorted by editionId')
  }
  for (const asset of manifest.assets) {
    const expectedObjectKey = objectKeyForEdition(asset.editionId)
    if (asset.objectKey !== expectedObjectKey) {
      throw new Error(`${asset.editionId}: objectKey must be ${expectedObjectKey}`)
    }
    if (editionIds.has(asset.editionId)) {
      throw new Error(`duplicate editionId: ${asset.editionId}`)
    }
    if (objectKeys.has(asset.objectKey)) {
      throw new Error(`duplicate objectKey: ${asset.objectKey}`)
    }
    editionIds.add(asset.editionId)
    objectKeys.add(asset.objectKey)
  }

  return manifest
}

export async function validateReleaseDirectory(
  manifestPath: string,
): Promise<{ manifest: ReleaseManifest; totalBytes: number }> {
  if (basename(manifestPath) !== 'manifest.json') {
    throw new Error('release manifest filename must be manifest.json')
  }

  const [contract, manifest] = await Promise.all([readAssetContract(), readReleaseManifest(manifestPath)])
  if (
    manifest.contentType !== contract.deliveryContract.mimeType ||
    manifest.cacheControl !== contract.deliveryContract.cacheControl
  ) {
    throw new Error('release HTTP metadata must match the tracked delivery contract')
  }

  const releaseDirectory = dirname(manifestPath)
  const actualEntries = (await readdir(releaseDirectory)).sort()
  const expectedEntries = ['manifest.json', ...manifest.assets.map((asset) => `${asset.editionId}.webp`)].sort()
  if (JSON.stringify(actualEntries) !== JSON.stringify(expectedEntries)) {
    throw new Error(
      `release directory must contain only manifest.json and its ${manifest.assetCount} declared WebP files`,
    )
  }

  let totalBytes = 0
  for (const asset of manifest.assets) {
    const file = await readFile(join(releaseDirectory, `${asset.editionId}.webp`))
    const hash = sha256Hex(file)
    if (hash !== asset.deliveryArtworkSha256) {
      throw new Error(`${asset.editionId}: delivery sha256 mismatch`)
    }
    if (file.byteLength !== asset.byteSize) {
      throw new Error(`${asset.editionId}: byteSize mismatch`)
    }

    const metadata = await sharp(file, { failOn: 'error' }).metadata()
    if (metadata.format !== 'webp' || metadata.width !== asset.width || metadata.height !== asset.height) {
      throw new Error(`${asset.editionId}: release asset must be ${asset.width}x${asset.height} WebP`)
    }
    totalBytes += file.byteLength
  }

  return { manifest, totalBytes }
}

export function objectKeyForEdition(id: string): string {
  return `guardian-cards/ko/${id}.webp`
}

export function sha256Hex(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
