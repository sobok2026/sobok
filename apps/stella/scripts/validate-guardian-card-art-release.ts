import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { validateReleaseDirectory } from './guardian-card-art'

const { values } = parseArgs({
  options: {
    manifest: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
})

if (values.help) {
  console.log(`Usage:
  bun run guardian-cards:validate-art-release --manifest <release-directory/manifest.json>`)
  process.exit(0)
}

if (!values.manifest) {
  throw new Error('--manifest is required')
}

const { manifest, totalBytes } = await validateReleaseDirectory(resolve(values.manifest))
console.log(`validated: ${manifest.assetCount} WebP assets (${totalBytes.toLocaleString()} bytes)`)
