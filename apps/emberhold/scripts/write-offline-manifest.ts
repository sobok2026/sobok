import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fontStylesheetHref } from '@sobok/typography/fonts'

const appRoot = join(import.meta.dirname, '..')
const outputRoot = join(appRoot, 'out')
const staticRoot = join(outputRoot, '_next', 'static')

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? collectFiles(path) : Promise.resolve([path])
    }),
  )
  return files.flat()
}

const staticAssets = (await collectFiles(staticRoot)).map(
  (path) => `/${relative(outputRoot, path).split(sep).join('/')}`,
)
const assets = [
  '/',
  '/index.html',
  '/404.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/icon.svg',
  '/apple-icon.png',
  '/emberhold-og.jpg',
  '/install-preview-narrow.webp',
  fontStylesheetHref('pretendard'),
  ...staticAssets,
].sort()

const assetContents = await Promise.all(
  assets.map((asset) => readFile(join(outputRoot, asset === '/' ? 'index.html' : asset.slice(1)))),
)
const fingerprintHash = createHash('sha256')
for (const [index, asset] of assets.entries()) {
  fingerprintHash.update(asset)
  fingerprintHash.update('\0')
  fingerprintHash.update(assetContents[index])
  fingerprintHash.update('\0')
}
const fingerprint = fingerprintHash.digest('hex').slice(0, 16)
const manifestPath = join(outputRoot, 'offline-assets.json')
const workerPath = join(outputRoot, 'sw.js')
const workerSource = await readFile(workerPath, 'utf8')
const fingerprintPattern = /const BUILD_FINGERPRINT = '[^']*'/

if (!fingerprintPattern.test(workerSource)) {
  throw new Error('Unable to find the service worker build fingerprint placeholder.')
}

await writeFile(manifestPath, `${JSON.stringify({ assets }, null, 2)}\n`)
await writeFile(workerPath, workerSource.replace(fingerprintPattern, `const BUILD_FINGERPRINT = '${fingerprint}'`))

console.log(`Offline shell prepared with ${assets.length} assets.`)
