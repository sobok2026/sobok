import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// `section-data.ts` is the one module the Worker tree and the Next client tree share by name: the report screen
// renders these shapes, so a bundler follows this file from a client component. Every import in it is therefore
// `import type` and every declaration is a type — the module has to erase to nothing at compile time, or the
// paid content tables it names transitively (`role-families`, `rules/free`) land in the browser bundle and
// MIGRATION §4.2's free/paid split is gone.
//
// A raw-text scan rather than an AST walk, and rather than a comment. The comment at the top of the module said
// "adding a value import to this file is the mistake to catch in review", which is a hope; a bundle that grew a
// paid table would still type-check, still pass every other test, and only show up in `next build` output that
// nobody reads line by line. The same reasoning `deep-type/rules/free.test.ts` gives for scanning its own text.

const SOURCE = readFileSync(join(import.meta.dir, 'section-data.ts'), 'utf8')

/** Every `import`/`export … from` line, so a mixed `import { type A, b }` is visible as written. */
function importLines(): readonly string[] {
  return SOURCE.split('\n').filter((line) => /^(?:import|export)\b[^=]*\bfrom\b/.test(line.trim()))
}

describe('section-data erases at compile time', () => {
  test('every import is type-only', () => {
    const value = importLines().filter((line) => !/^(?:import|export)\s+type\b/.test(line.trim()))
    expect(value).toEqual([])
  })

  // The imports being type-only is half of it: a runtime declaration here would emit its own code even with no
  // value import at all, and a `const` in this module is a string the browser downloads.
  test('nothing runtime is declared', () => {
    const runtime = SOURCE.split('\n').filter((line) => /^export\s+(?:const|let|var|function|class|enum)\b/.test(line))
    expect(runtime).toEqual([])
  })

  // The scan is only worth anything if it is reading the imports it thinks it is. Two of them reach modules that
  // do carry paid copy, which is exactly why the form matters.
  test('the scan sees the imports that would leak', () => {
    const specifiers = importLines()
      .flatMap((line) => [...line.matchAll(/from\s*'([^']+)'/g)])
      .map((match) => match[1] ?? '')
    expect(specifiers).toContain('../../deep-type/role-families')
    expect(specifiers).toContain('../../deep-type/rules/free')
  })
})
