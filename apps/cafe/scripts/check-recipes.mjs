import { readdir, readFile } from 'node:fs/promises'
import { buildMenu } from '../src/content/playable-menu.ts'
import { parseRecipeCatalog, recipeVariantExecutionIssues } from '../src/content/recipe-catalog.ts'

const root = new URL('../data/', import.meta.url)
const read = async (name) => JSON.parse(await readFile(new URL(name, root), 'utf8'))
async function recipesAt(folder) {
  const result = []
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), folder)
    if (entry.isDirectory()) result.push(...(await recipesAt(url)))
    else if (entry.name.endsWith('.json')) {
      try {
        result.push(JSON.parse(await readFile(url, 'utf8')))
      } catch (error) {
        throw new Error(`${url.pathname}: ${error.message}`)
      }
    }
  }
  return result
}
try {
  const [recipes, materials, equipment, vessels] = await Promise.all([
    recipesAt(new URL('recipes/', root)),
    read('materials.json'),
    read('equipment.json'),
    read('vessels.json'),
  ])
  const catalog = parseRecipeCatalog({ recipes, materials, equipment, vessels })
  const variants = [...catalog.recipes.values()].flatMap((recipe) => recipe.variants)
  const reviewCount = variants.filter((variant) => variant.review.length).length
  const unresolved = [...catalog.recipes.values()].flatMap((recipe) =>
    recipe.variants.filter(
      (variant) => !variant.review.length && recipeVariantExecutionIssues(catalog, recipe.id, variant.id).length,
    ),
  )
  const menu = Object.values(buildMenu(catalog, await read('menu.json')))
  const combinations = menu.reduce((sum, item) => sum + Object.keys(item.sizes).length, 0)
  console.log(`레시피 JSON 확인: ${catalog.recipes.size}개 항목 / ${variants.length}개 제조 구분`)
  console.log(`원문 확인 필요 ${reviewCount}개 / 그 외 정량 미기재·동작 확인 필요 ${unresolved.length}개`)
  console.log(
    `재료 ${catalog.materials.size}개 / 도구·장비 ${catalog.equipment.size}개 / 용기 ${catalog.vessels.size}개`,
  )
  console.log(`현재 판매 ${menu.length}개 메뉴 · ${combinations}개 사이즈 조합의 제조 순서 확인`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
