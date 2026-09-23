import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import readExcelFile from 'read-excel-file/node'

const root = new URL('../../../', import.meta.url)
const referencesDir = new URL('../references/', import.meta.url)
const files = ['26_pre-autumn_recipes.xlsx', 'best_by_core.xlsx', 'best_by_special.xlsx', 'ingredient_prep_guide.xlsx']
const sources = []
const sheets = {}
for (const file of files) {
  const path = fileURLToPath(new URL(file, referencesDir))
  const buffer = await readFile(path)
  const workbook = await readExcelFile(buffer)
  sources.push({ file, sha256: createHash('sha256').update(buffer).digest('hex') })
  for (const { sheet, data } of workbook) {
    if (!data[5]?.[0]) throw new Error(`${file} / ${sheet}: expected header on row 6`)
    sheets[`${file}/${sheet}`] = data
  }
}
const rowsOf = (file, sheet) => {
  const rows = sheets[`${file}/${sheet}`]
  if (!rows) throw new Error(`Missing sheet: ${file}/${sheet}`)
  return rows
}
const text = (value) => (value === null || value === undefined ? '' : String(value))
const recipes = []
let name = ''
let recipe
for (const [index, row] of rowsOf(files[0], '음료 제조').entries()) {
  if (index < 6 || !row[2]) continue
  if (row[0]) name = text(row[0])
  if (row[1]) {
    recipe = { name, variant: text(row[1]), steps: [] }
    recipes.push(recipe)
  }
  if (!recipe) throw new Error(`Missing recipe group at row ${index + 1}`)
  recipe.steps.push({
    order: Number(row[2]),
    item: text(row[3]),
    unit: text(row[4]),
    tall: row[5] ?? null,
    grande: row[6] ?? null,
    venti: row[7] ?? null,
    instruction: text(row[8]),
    note: text(row[9]),
    source: { file: files[0], sheet: '음료 제조', row: index + 1 },
  })
}
const preparations = []
name = ''
let preparation
for (const [index, row] of rowsOf(files[0], '폼·베이스 제조').entries()) {
  if (index < 6 || !row[2]) continue
  if (row[0]) name = text(row[0])
  if (row[1]) {
    preparation = { name, batch: text(row[1]), tools: text(row[7]), storage: text(row[8]), steps: [] }
    preparations.push(preparation)
  }
  if (!preparation) throw new Error(`Missing preparation at row ${index + 1}`)
  preparation.steps.push({
    order: Number(row[2]),
    item: text(row[3]),
    unit: text(row[4]),
    amount: row[5] ?? null,
    instruction: text(row[6]),
    note: text(row[9]),
    source: { file: files[0], sheet: '폼·베이스 제조', row: index + 1 },
  })
}
const quality = []
for (const [file, sheet, prepared] of [
  [files[1], '제조 베이스', true],
  [files[1], '코어 원재료', false],
  [files[2], '특화 원재료', false],
]) {
  for (const [index, row] of rowsOf(file, sheet).entries()) {
    if (index < 6 || !row[1]) continue
    quality.push({
      category: text(row[0]),
      name: text(row[1]),
      storage: text(row[2]),
      state: prepared ? text(row[3]) : '',
      lifetime: prepared ? text(row[4]) : '',
      portioned: prepared ? '' : text(row[3]),
      opened: prepared ? '' : text(row[4]),
      marking: text(row[5]),
      note: text(row[6]),
      source: { file, sheet, row: index + 1 },
    })
  }
}
const prepGuide = rowsOf(files[3], '부재료 제조').flatMap((row, index) =>
  index < 6 || !row[0]
    ? []
    : [
        {
          name: text(row[0]),
          instruction: text(row[1]),
          code: text(row[2]),
          lifetime: text(row[3]),
          marking: text(row[4]),
          storage: text(row[5]),
          source: { file: files[3], sheet: '부재료 제조', row: index + 1 },
        },
      ],
)
if (recipes.length !== 14 || preparations.length !== 6)
  throw new Error('Recipe groups changed; review the import mapping before regenerating.')
const output = new URL('../src/data/references.generated.json', import.meta.url)
await mkdir(new URL('.', output), { recursive: true })
await writeFile(
  output,
  `${JSON.stringify({ version: 1, sources, recipes, preparations, quality, prepGuide }, null, 2)}\n`,
)
execFileSync('bun', ['x', 'biome', 'format', '--write', fileURLToPath(output)], {
  cwd: fileURLToPath(root),
  stdio: 'inherit',
})
console.log(
  `Imported ${recipes.length} recipe variants, ${preparations.length} preparations, ${quality.length} quality rules, ${prepGuide.length} preparation rows.`,
)
