import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const sourceRoot = join(import.meta.dirname, '..', 'src')
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.jsx', '.ts', '.tsx'])
const hanOrKanaPattern = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u30fb\u30fc]/gu

async function collectTextFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return collectTextFiles(path)
      return Promise.resolve(textExtensions.has(extname(entry.name)) ? [path] : [])
    }),
  )
  return files.flat()
}

const violations: string[] = []

for (const path of await collectTextFiles(sourceRoot)) {
  const source = await readFile(path, 'utf8')
  for (const match of source.matchAll(hanOrKanaPattern)) {
    const beforeMatch = source.slice(0, match.index)
    const line = beforeMatch.split('\n').length
    const column = match.index - beforeMatch.lastIndexOf('\n')
    violations.push(`${relative(sourceRoot, path)}:${line}:${column} ${JSON.stringify(match[0])}`)
  }
}

if (violations.length > 0) {
  throw new Error(
    [
      'Emberhold omits the Korean Han webfont, but the source now contains Han or kana:',
      ...violations,
      'Remove those glyphs or re-enable includeKoreanHanWebfont in src/app/layout.tsx.',
    ].join('\n'),
  )
}

console.log('Font coverage verified: the Emberhold source needs Pretendard only.')
