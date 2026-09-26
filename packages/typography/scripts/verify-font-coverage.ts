/**
 * Fails when any of the given files, or any text file under the given directories, contains Han or kana.
 *
 * This is the build-time check that the closed-copy exception in README.md requires: an app that loads only the
 * Korean Pretendard sheet has no face of its own for the glyphs that only Pretendard JP carries. Paths resolve
 * against the working directory, which is the app's own when run through `bun run`.
 *
 *   bun ../../packages/typography/scripts/verify-font-coverage.ts src
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.jsx', '.ts', '.tsx'])
const hanOrKanaPattern = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}・ー]/gu

async function collectTextFiles(path: string): Promise<string[]> {
  if (!(await stat(path)).isDirectory()) return [path]
  const entries = await readdir(path, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const child = join(path, entry.name)
      if (entry.isDirectory()) return collectTextFiles(child)
      return Promise.resolve(textExtensions.has(extname(entry.name)) ? [child] : [])
    }),
  )
  return files.flat()
}

const roots = process.argv.slice(2)
if (roots.length === 0) throw new Error('Pass the files or directories that hold the app’s rendered copy.')

const violations: string[] = []

for (const path of (await Promise.all(roots.map(collectTextFiles))).flat()) {
  const source = await readFile(path, 'utf8')
  for (const match of source.matchAll(hanOrKanaPattern)) {
    const beforeMatch = source.slice(0, match.index)
    const line = beforeMatch.split('\n').length
    const column = match.index - beforeMatch.lastIndexOf('\n')
    violations.push(`${relative(process.cwd(), path)}:${line}:${column} ${JSON.stringify(match[0])}`)
  }
}

if (violations.length > 0) {
  throw new Error(
    [
      'This app loads only the Korean Pretendard sheet, but its copy now contains Han or kana:',
      ...violations,
      'Remove those glyphs, or load the Pretendard JP sheet as well (see "Closed Korean copy surfaces" in',
      'packages/typography/README.md).',
    ].join('\n'),
  )
}

console.log(`Font coverage verified (${roots.join(', ')}): Pretendard alone covers the copy.`)
