import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import readExcelFile from 'read-excel-file/node'
import { linkReferences } from '../src/game/reference-links.ts'

const root = new URL('../../../', import.meta.url)
const referencesDir = new URL('../references/', import.meta.url)
const files = ['26_pre-autumn_recipes.xlsx', 'best_by_core.xlsx', 'best_by_special.xlsx', 'ingredient_prep_guide.xlsx']
const headers = {
  '음료 제조': [
    '메뉴',
    '구분',
    '순서',
    '재료·대상',
    '단위',
    'Tall',
    'Grande',
    'Venti',
    '제조 방법·계량 기준',
    '주의·대체 방법',
  ],
  '폼·베이스 제조': [
    '제조 항목',
    '배합 기준',
    '순서',
    '재료·대상',
    '단위',
    '수량',
    '제조 방법',
    '도구',
    '보관·품질 기한',
    '주의·대체 방법',
  ],
  '제조 베이스': ['분류', '품목', '보관기준', '구분', '내부품질기한', '표기법', '참고'],
  '코어 원재료': ['구분', 'SKU 명', '보관기준', '소분후', '개봉후(원팩)', '표기법', '참고'],
  '특화 원재료': ['구분', 'SKU 명', '보관기준', '소분후', '개봉후(원팩)', '표기법', '참고'],
  '부재료 제조': ['이름', '제조 방법', '마킹명', '유통기한', '표기법', '보관방법'],
}
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
  for (const [column, expected] of headers[sheet].entries())
    if (rows[5]?.[column] !== expected)
      throw new Error(
        `${file} / ${sheet} 6행 ${column + 1}열: '${expected}' 헤더를 확인해주세요. 현재 '${rows[5]?.[column] ?? '빈칸'}'.`,
      )
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
const result = { version: 1, sources, recipes, preparations, quality, prepGuide }
// Validate the candidate before touching the last usable generated file.
linkReferences(result)
const output = new URL('../src/data/references.generated.json', import.meta.url)
const formatted = execFileSync('bun', ['x', 'biome', 'format', '--stdin-file-path', fileURLToPath(output)], {
  cwd: fileURLToPath(root),
  input: `${JSON.stringify(result, null, 2)}\n`,
  encoding: 'utf8',
})
await mkdir(new URL('.', output), { recursive: true })
await writeFile(output, formatted)
console.log(
  `Imported ${recipes.length} recipe variants, ${preparations.length} preparations, ${quality.length} quality rules, ${prepGuide.length} preparation rows.`,
)
