import { createHash } from 'node:crypto'
import { canonicalJson } from '@sobok/civil/calculation'
import {
  type CivilDeliveryGenerationOutput,
  type CivilDeliveryGenerationWork,
  CivilDeliveryManifestSchema,
} from '@sobok/civil/delivery'
import { strToU8, Zip, ZipPassThrough } from 'fflate'

const ZIP_TIMESTAMP = new Date('1980-01-01T00:00:00.000Z')

function sha256Hex(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

export async function generateDeliveryPackage(
  bucket: R2Bucket,
  work: CivilDeliveryGenerationWork,
): Promise<CivilDeliveryGenerationOutput> {
  const manifest = CivilDeliveryManifestSchema.parse({
    schemaVersion: 'sobok.civil.delivery.v1',
    packageId: work.packageId,
    projectId: work.projectId,
    title: work.title,
    deliveryKind: work.deliveryKind,
    vendorName: work.vendorName,
    revision: work.revision,
    createdAt: work.createdAt,
    files: work.items.map((item) => ({
      artifactId: item.artifactId,
      path: item.archivePath,
      originalFileName: item.fileName,
      mediaType: item.mediaType,
      byteSize: item.byteSize,
      sha256: item.sha256,
      kind: item.kind,
      revision: item.revision,
      coordinateReferenceSystem: item.coordinateReferenceSystem,
    })),
  })
  const manifestBytes = strToU8(canonicalJson(manifest))
  const manifestSha256 = sha256Hex(manifestBytes)
  const stream = new TransformStream<Uint8Array, Uint8Array>()
  const writer = stream.writable.getWriter()
  const packageHash = createHash('sha256')
  let packageBytes = 0
  let writeChain = Promise.resolve()
  let resolveZip!: () => void
  let rejectZip!: (error: unknown) => void
  const zipDone = new Promise<void>((resolve, reject) => {
    resolveZip = resolve
    rejectZip = reject
  })
  const zip = new Zip((error, chunk, final) => {
    if (error) {
      writeChain = writeChain.then(() => writer.abort(error))
      rejectZip(error)
      return
    }
    if (chunk) {
      packageHash.update(chunk)
      packageBytes += chunk.byteLength
      writeChain = writeChain.then(() => writer.write(chunk))
    }
    if (final) {
      writeChain = writeChain.then(() => writer.close())
      writeChain.then(resolveZip, rejectZip)
    }
  })

  const putPromise = bucket.put(work.objectKey, stream.readable, {
    httpMetadata: { contentType: 'application/zip', contentDisposition: 'attachment' },
    customMetadata: { packageId: work.packageId, organizationId: work.organizationId, projectId: work.projectId },
  })

  try {
    for (const item of work.items) {
      const source = await bucket.get(item.objectKey)
      if (!source || source.size !== item.byteSize) throw new Error(`delivery source unavailable: ${item.artifactId}`)
      const entry = new ZipPassThrough(item.archivePath)
      entry.mtime = ZIP_TIMESTAMP
      zip.add(entry)
      const reader = source.body.getReader()
      const itemHash = createHash('sha256')
      let itemBytes = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        itemHash.update(value)
        itemBytes += value.byteLength
        entry.push(value)
        await writeChain
      }
      entry.push(new Uint8Array(0), true)
      await writeChain
      if (itemBytes !== item.byteSize || itemHash.digest('hex') !== item.sha256) {
        throw new Error(`delivery source integrity mismatch: ${item.artifactId}`)
      }
    }

    const manifestEntry = new ZipPassThrough('manifest.json')
    manifestEntry.mtime = ZIP_TIMESTAMP
    zip.add(manifestEntry)
    manifestEntry.push(manifestBytes, true)
    zip.end()
    await zipDone
    const object = await putPromise
    if (!object || object.size !== packageBytes) throw new Error('delivery package size mismatch after R2 write')
    return { byteSize: packageBytes, sha256: packageHash.digest('hex'), manifest, manifestSha256 }
  } catch (error) {
    zip.terminate()
    await writer.abort(error).catch(() => undefined)
    await putPromise.catch(() => undefined)
    await bucket.delete(work.objectKey).catch(() => undefined)
    throw error
  }
}
