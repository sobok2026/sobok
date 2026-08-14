import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { readAssetContract, validateReleaseDirectory } from './guardian-card-art'

const listedObjectSchema = z
  .object({
    etag: z.string().min(1),
    http_metadata: z
      .object({
        cacheControl: z.string().optional(),
        contentType: z.string().optional(),
      })
      .passthrough()
      .optional(),
    key: z.string().min(1),
    size: z.number().int().nonnegative(),
    storage_class: z.string().min(1).optional(),
  })
  .passthrough()

const listResponseSchema = z
  .object({
    result: z.array(listedObjectSchema),
    result_info: z
      .object({
        cursor: z.string().optional(),
        is_truncated: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    success: z.literal(true),
  })
  .passthrough()

const uploadResponseSchema = z
  .object({
    result: z
      .object({
        etag: z.string().min(1),
        key: z.string().min(1),
        size: z.union([z.string(), z.number()]),
      })
      .passthrough(),
    success: z.literal(true),
  })
  .passthrough()

type ListedObject = z.infer<typeof listedObjectSchema>

const { values } = parseArgs({
  options: {
    manifest: { type: 'string' },
    bucket: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run scripts/deploy-guardian-card-art.ts --manifest <manifest.json> --bucket <R2-bucket>`)
  process.exit(0)
}

if (!values.manifest || !values.bucket) {
  throw new Error('--manifest and --bucket are required')
}
if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(values.bucket)) {
  throw new Error('invalid R2 bucket name')
}

const accountId = requiredEnvironmentVariable('CLOUDFLARE_ACCOUNT_ID')
const apiToken = requiredEnvironmentVariable('CLOUDFLARE_API_TOKEN')
const manifestPath = resolve(values.manifest)
const releaseDirectory = dirname(manifestPath)
const [{ manifest }, contract] = await Promise.all([validateReleaseDirectory(manifestPath), readAssetContract()])
const deliveryEnvironment = Object.values(contract.environments).find(
  (environment) => environment.bucket === values.bucket,
)
if (!deliveryEnvironment) {
  throw new Error(`R2 bucket is not declared in the guardian asset contract: ${values.bucket}`)
}

const releaseAssets = await Promise.all(
  manifest.assets.map(async (asset) => {
    const localPath = join(releaseDirectory, `${asset.editionId}.webp`)
    return {
      asset,
      localPath,
      md5: createHash('md5')
        .update(await readFile(localPath))
        .digest('hex'),
    }
  }),
)

const existingObjects = await listRemoteObjects()
const missingAssets = releaseAssets.filter(({ asset, md5 }) => {
  const remoteObject = existingObjects.get(asset.objectKey)
  if (!remoteObject) {
    return true
  }
  validateRemoteObject(asset, md5, remoteObject)
  return false
})

await mapConcurrent(missingAssets, 10, async ({ asset, localPath, md5 }) => {
  const file = await readFile(localPath)
  const response = await fetch(objectApiUrl(asset.objectKey), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Cache-Control': manifest.cacheControl,
      'Content-Length': String(file.byteLength),
      'Content-Type': manifest.contentType,
      'cf-r2-storage-class': 'Standard',
    },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`${asset.editionId}: R2 upload failed (${response.status})\n${await response.text()}`)
  }
  const uploaded = uploadResponseSchema.parse(await response.json())
  if (
    uploaded.result.key !== asset.objectKey ||
    Number(uploaded.result.size) !== asset.byteSize ||
    uploaded.result.etag.replaceAll('"', '').toLowerCase() !== md5
  ) {
    throw new Error(`${asset.editionId}: R2 upload response does not match the release manifest`)
  }
})

const deployedObjects = await listRemoteObjects()
for (const { asset, md5 } of releaseAssets) {
  const remoteObject = deployedObjects.get(asset.objectKey)
  if (!remoteObject) {
    throw new Error(`${asset.editionId}: R2 object is missing after deployment`)
  }
  validateRemoteObject(asset, md5, remoteObject)
}

await mapConcurrent(releaseAssets, 5, async ({ asset }) => {
  const url = new URL(asset.objectKey, `${deliveryEnvironment.origin}/`)
  url.searchParams.set('sha256', asset.deliveryArtworkSha256)
  const response = await fetchDeliveryOrigin(url)
  if (!response.ok) {
    throw new Error(`${asset.editionId}: delivery origin verification failed (${response.status})`)
  }
  if (
    response.headers.get('content-type') !== manifest.contentType ||
    response.headers.get('cache-control') !== manifest.cacheControl
  ) {
    throw new Error(`${asset.editionId}: delivery origin HTTP metadata mismatch`)
  }
  const body = new Uint8Array(await response.arrayBuffer())
  if (body.byteLength !== asset.byteSize) {
    throw new Error(`${asset.editionId}: delivery origin byteSize mismatch`)
  }
  const hash = createHash('sha256').update(body).digest('hex')
  if (hash !== asset.deliveryArtworkSha256) {
    throw new Error(`${asset.editionId}: delivery origin sha256 mismatch`)
  }
})

console.log(
  `deployed: ${missingAssets.length} uploaded, ${manifest.assetCount - missingAssets.length} already identical, ${manifest.assetCount} verified through ${deliveryEnvironment.origin}`,
)

async function fetchDeliveryOrigin(url: URL): Promise<Response> {
  const maximumAttempts = 4
  let lastError: unknown
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(20_000),
      })
      if (response.ok || !isRetryableDeliveryStatus(response.status) || attempt === maximumAttempts) {
        return response
      }
      await response.arrayBuffer()
      console.warn(
        `${url.pathname}: delivery origin returned ${response.status}; retrying (${attempt}/${maximumAttempts})`,
      )
    } catch (error) {
      lastError = error
      if (attempt === maximumAttempts) {
        break
      }
      console.warn(`${url.pathname}: delivery origin request failed; retrying (${attempt}/${maximumAttempts})`)
    }
    await wait(1_000 * 2 ** (attempt - 1))
  }
  throw new Error(`${url.pathname}: delivery origin request failed after ${maximumAttempts} attempts`, {
    cause: lastError,
  })
}

function isRetryableDeliveryStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function listRemoteObjects(): Promise<Map<string, ListedObject>> {
  const objects = new Map<string, ListedObject>()
  let cursor: string | undefined
  do {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${values.bucket}/objects`,
    )
    url.searchParams.set('per_page', '1000')
    url.searchParams.set('prefix', 'guardian-cards/ko/')
    if (cursor) {
      url.searchParams.set('cursor', cursor)
    }
    const response = await fetch(url, { headers: { Authorization: `Bearer ${apiToken}` } })
    if (!response.ok) {
      throw new Error(`could not list R2 objects (${response.status})\n${await response.text()}`)
    }
    const page = listResponseSchema.parse(await response.json())
    for (const object of page.result) {
      objects.set(object.key, object)
    }
    cursor = page.result_info?.is_truncated ? page.result_info.cursor : undefined
    if (page.result_info?.is_truncated && !cursor) {
      throw new Error('truncated R2 object list did not include a cursor')
    }
  } while (cursor)
  return objects
}

function validateRemoteObject(
  asset: (typeof manifest.assets)[number],
  expectedMd5: string,
  remoteObject: ListedObject,
): void {
  const etag = remoteObject.etag.replaceAll('"', '').toLowerCase()
  if (etag !== expectedMd5 || remoteObject.size !== asset.byteSize) {
    throw new Error(`${asset.editionId}: R2 object already exists with different bytes; create a new edition ID`)
  }
  if (
    remoteObject.http_metadata?.contentType !== manifest.contentType ||
    remoteObject.http_metadata.cacheControl !== manifest.cacheControl ||
    remoteObject.storage_class?.toLowerCase() !== 'standard'
  ) {
    throw new Error(`${asset.editionId}: R2 object HTTP metadata or storage class mismatch`)
  }
}

function objectApiUrl(objectKey: string): string {
  const encodedKey = objectKey.split('/').map(encodeURIComponent).join('/')
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${values.bucket}/objects/${encodedKey}`
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

async function mapConcurrent<T>(
  items: readonly T[],
  concurrency: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex]
      nextIndex += 1
      if (item !== undefined) {
        await task(item)
      }
    }
  })
  await Promise.all(workers)
}
