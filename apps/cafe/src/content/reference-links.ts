import { DRINK_SIZES, type RecipeSize, recipeSizeIds } from './drink-sizes'
import { type Lifetime, sameLifetime } from './lifetime'
import type referenceData from './references.generated.json'

type ReferenceData = typeof referenceData
type ImportedDrink = ReferenceData['recipes'][number]
export type DrinkStepReference = ImportedDrink['steps'][number]
export type DrinkReference = Pick<ImportedDrink, 'name' | 'variant'> & { steps: DrinkStepReference[] }
type PreparationReference = ReferenceData['preparations'][number]
type Source = DrinkStepReference['source']
type SourceStep = { order: number; item: string; unit: string; source: Source }
export const sourceLine = (source: Source) => `${source.file} / ${source.sheet} ${source.row}행`

function invalid(context: string, message: string): never {
  throw new Error(`카페 자료 연결 확인 · ${context}: ${message}`)
}
function unique<T>(items: T[], matches: (item: T) => boolean, context: string): T {
  if (!Array.isArray(items)) invalid(context, '자료 목록을 읽을 수 없어요.')
  const found = items.filter(matches)
  if (found.length !== 1) invalid(context, `항목이 ${found.length}개예요. 이름·온도·배합 조건을 확인해주세요.`)
  return found[0]
}
function linkSteps<T extends SourceStep, D extends Record<string, readonly [string, string]>>(
  steps: T[],
  definition: D,
  context: string,
): Record<keyof D, T> {
  const entries = Object.entries(definition)
  if (!Array.isArray(steps)) invalid(context, '제조 단계 목록을 읽을 수 없어요.')
  const linked = {} as Record<keyof D, T>
  entries.forEach(([key, [item, unit]], index) => {
    const step = unique(steps, (row) => row.item === item, `${context} / ${item}`)
    const location = `${context} / ${item} (${sourceLine(step.source)})`
    if (step.unit !== unit) invalid(location, `단위는 '${unit || '빈칸'}'이어야 해요. 현재 '${step.unit || '빈칸'}'.`)
    // Physical rows may move; changing the actual procedure requires an explicit gameplay review.
    if (step.order !== index + 1) invalid(location, `순서는 ${index + 1}이어야 해요. 현재 ${step.order}.`)
    linked[key as keyof D] = step
  })
  if (steps.length !== entries.length) {
    const extra = steps.filter((step) => !entries.some(([, [item]]) => item === step.item))
    invalid(
      context,
      `지원하지 않는 제조 단계가 있어요: ${extra.map((step) => `${step.item} (${sourceLine(step.source)})`).join(', ')}. 작업 흐름을 확인해주세요.`,
    )
  }
  return linked
}
function positive(value: unknown, context: string, whole = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || (whole && !Number.isInteger(value)))
    invalid(context, `${whole ? '양의 정수' : '양수'} 수량이 필요해요. 현재 ${JSON.stringify(value)}.`)
  return value
}
function sizes(step: DrinkStepReference, whole = false): Record<RecipeSize, number> {
  return Object.fromEntries(
    recipeSizeIds.map((size) => [
      size,
      positive(step[size], `${sourceLine(step.source)} / ${step.item} / ${DRINK_SIZES[size].name}`, whole),
    ]),
  ) as Record<RecipeSize, number>
}
function amount(step: PreparationReference['steps'][number], whole = false) {
  return positive(step.amount, `${sourceLine(step.source)} / ${step.item} / 배합량`, whole)
}
function notedNumber(text: string, pattern: RegExp, context: string) {
  const matches = [...text.matchAll(pattern)]
  if (matches.length !== 1) invalid(context, `수량·단위를 하나로 읽을 수 없어요. 현재 '${text}'.`)
  return positive(Number(matches[0][1]), context)
}
function pumpMl(step: { note: string; source: Source }) {
  return notedNumber(step.note, /(?<![\d.,+-])(\d+(?:\.\d+)?)\s*ml\b/gi, `${sourceLine(step.source)} / 펌프당 ml`)
}
function lifetime(text: string, context: string): Lifetime {
  const match = text.trim().match(/^(\d+(?:\.\d+)?)\s*(일|시간|개월)$/)
  if (!match) invalid(context, `일·시간·개월 단위의 기한이 필요해요. 현재 '${text}'.`)
  return {
    amount: positive(Number(match[1]), context, match[2] !== '시간'),
    unit: match[2] === '일' ? 'days' : match[2] === '개월' ? 'months' : 'hours',
  }
}
function storage(text: string, context: string): 'room' | 'fridge' {
  if (text === '실온') return 'room'
  if (text === '냉장') return 'fridge'
  return invalid(context, `냉장·실온 보관 조건을 확인해주세요. 현재 '${text}'.`)
}

// Only playable drinks and their supporting ingredients are linked here.
// Unimplemented menus and the rest of the quality workbook remain reference material.
export function linkReferences(data: ReferenceData) {
  const recipeFile = '26_pre-autumn_recipes.xlsx'
  const recipe = (name: string, variant: string): DrinkReference =>
    unique(
      data.recipes,
      (row) => row.name === name && row.variant === variant,
      `${recipeFile} / 음료 제조 / ${name} ${variant}`,
    )
  const preparation = (name: string, batch: string) =>
    unique(
      data.preparations,
      (row) => row.name === name && row.batch === batch,
      `${recipeFile} / 폼·베이스 제조 / ${name} / ${batch}`,
    )
  const finish = {
    drizzle: ['바모카 드리즐', '바퀴'],
    foam: ['글레이즈드 폼', 'ml (텀블러)'],
    powder: ['번트 카라멜 파우더', '톡'],
    serve: ['제공', ''],
  } as const
  const hot = recipe('블랙 글레이즈드 라떼', 'HOT')
  const iced = recipe('블랙 글레이즈드 라떼', 'ICED')
  const cold = recipe('콜드 브루', 'ICED')
  const hojiHot = recipe('호지 글레이즈드 티 라떼', 'HOT')
  const hojiIced = recipe('호지 글레이즈드 티 라떼', 'ICED')
  const hotSteps = linkSteps(
    hot.steps,
    {
      milk: ['일반 우유', ''],
      espresso: ['에스프레소', '샷'],
      glaze: ['글레이즈드 소스', '펌프'],
      mix: ['에스프레소·소스', ''],
      steamedMilk: ['스팀 우유', ''],
      ...finish,
    },
    `${recipeFile} / 음료 제조 / ${hot.name} ${hot.variant}`,
  )
  const icedSteps = linkSteps(
    iced.steps,
    {
      espresso: ['에스프레소', '샷'],
      glaze: ['글레이즈드 소스', '펌프'],
      mix: ['에스프레소·소스', ''],
      milk: ['일반 우유', ''],
      ice: ['얼음', ''],
      ...finish,
    },
    `${recipeFile} / 음료 제조 / ${iced.name} ${iced.variant}`,
  )
  const coldSteps = linkSteps(
    cold.steps,
    {
      extract: ['콜드 브루 추출액', ''],
      water: ['정수', ''],
      ice: ['얼음', ''],
    },
    `${recipeFile} / 음료 제조 / ${cold.name} ${cold.variant}`,
  )
  const hojiFinish = { foam: finish.foam, powder: finish.powder, serve: finish.serve }
  const hojiHotSteps = linkSteps(
    hojiHot.steps,
    {
      milk: ['일반 우유', ''],
      syrup: ['클래식 시럽', '펌프'],
      steamedMilk: ['스팀 우유', ''],
      tea: ['호지차 샷', 'ml (텀블러)'],
      ...hojiFinish,
    },
    `${recipeFile} / 음료 제조 / ${hojiHot.name} HOT`,
  )
  const hojiIcedSteps = linkSteps(
    hojiIced.steps,
    {
      syrup: ['클래식 시럽', '펌프'],
      milk: ['일반 우유', ''],
      tea: ['호지차 샷', ''],
      ice: ['얼음', ''],
      ...hojiFinish,
    },
    `${recipeFile} / 음료 제조 / ${hojiIced.name} ICED`,
  )
  const hojiAmounts = (steps: Pick<typeof hojiHotSteps, 'syrup' | 'foam' | 'powder'>) => ({
    syrupPumps: sizes(steps.syrup, true),
    syrupPumpMl: pumpMl(steps.syrup),
    powderTaps: sizes(steps.powder, true),
    tumblerFoamMl: sizes(steps.foam),
  })
  for (const group of [hot, iced, cold, hojiHot, hojiIced])
    for (const step of group.steps)
      if (!step.unit && recipeSizeIds.some((size) => step[size] !== null))
        invalid(
          `${sourceLine(step.source)} / ${group.name} ${group.variant} / ${step.item}`,
          '단위 없는 수량이 추가됐어요. 컵 기준선·게임용 환산을 확인해주세요.',
        )
  const latteAmounts = (steps: Pick<typeof icedSteps, 'espresso' | 'glaze' | 'drizzle' | 'powder' | 'foam'>) => ({
    shots: sizes(steps.espresso, true),
    glazePumps: sizes(steps.glaze, true),
    pumpMl: pumpMl(steps.glaze),
    drizzleTurns: sizes(steps.drizzle),
    powderTaps: sizes(steps.powder, true),
    tumblerFoamMl: sizes(steps.foam),
  })

  const foam = preparation('글레이즈드 폼', '기본 배합 / 약 9잔')
  const hojicha = preparation('호지차 샷', '기본 배합 / 약 5잔')
  const hojichaSteps = linkSteps(
    hojicha.steps,
    {
      water: ['정수', 'ml'],
      powder: ['호지차 파우더', '1티스푼 스쿱'],
      shake: ['쉐이킹', '회'],
    },
    `${recipeFile} / 폼·베이스 제조 / 호지차 샷 / ${hojicha.batch}`,
  )
  const foamSteps = linkSteps(
    foam.steps,
    {
      cream: ['휘핑크림', 'ml'],
      milk: ['일반 우유', 'ml'],
      glaze: ['글레이즈드 소스', '펌프'],
      blend: ['블렌딩', '회'],
    },
    `${recipeFile} / 폼·베이스 제조 / ${foam.name} / ${foam.batch}`,
  )
  if (amount(foamSteps.blend, true) !== 1 || foamSteps.blend.instruction !== '3번 버튼을 누른다.')
    invalid(sourceLine(foamSteps.blend.source), '기본 폼의 3번 버튼 1회 블렌딩 절차를 확인해주세요.')
  function preparedQuality(prep: PreparationReference, source: Source) {
    const context = `${sourceLine(source)} / ${prep.name}`
    const rule = prep.storage.match(/^제조 후 반드시 (냉장|실온) 보관\.\s*(\d+\s*(?:시간|일|개월))\./)
    if (!rule) invalid(context, `보관·기한을 확인해주세요. 현재 '${prep.storage}'.`)
    return {
      storage: storage(rule[1], context),
      lifetime: lifetime(rule[2], context),
      source: `${context} / ${prep.storage}`,
    }
  }

  const mocha = unique(
    data.prepGuide,
    (row) => row.name === '바모카',
    'ingredient_prep_guide.xlsx / 부재료 제조 / 바모카',
  )
  const mochaAmounts = mocha.instruction.match(/^바모카\s*(\d+)봉\s*\+\s*온수\s*(\d+(?:\.\d+)?)L$/)
  if (!mochaAmounts)
    invalid(sourceLine(mocha.source), `바모카 원팩 봉·온수 L 배합을 확인해주세요. 현재 '${mocha.instruction}'.`)

  function quality(file: string, sheet: string, name: string, field: 'lifetime' | 'opened' | 'portioned', state = '') {
    const row = unique(
      data.quality,
      (item) => item.source.file === file && item.source.sheet === sheet && item.name === name && item.state === state,
      `${file} / ${sheet} / ${name} ${state}`,
    )
    const condition = field === 'opened' ? '개봉후' : field === 'portioned' ? '소분후' : state
    const context = `${sourceLine(row.source)} / ${name} / ${condition}`
    return {
      storage: storage(row.storage, context),
      lifetime: lifetime(row[field], context),
      source: `${context} · ${row[field]}`,
    }
  }
  const qualities = {
    beans: quality('best_by_core.xlsx', '제조 베이스', '원두', 'lifetime', '개봉후'),
    milk: quality('best_by_core.xlsx', '코어 원재료', '우유(무지방,일반,저지방)', 'opened'),
    cream: quality('best_by_core.xlsx', '코어 원재료', '휘핑 크림 (프릿츠골드, 데빅듀오휩)', 'opened'),
    glaze: quality('best_by_special.xlsx', '특화 원재료', '글레이즈드 소스, 뉴글레이즈소스', 'opened'),
    powder: quality('best_by_special.xlsx', '특화 원재료', '번트 카라멜 파우더 30g', 'portioned'),
    mocha: quality('best_by_core.xlsx', '제조 베이스', '모카소스(초콜릿드리즐 포함)', 'lifetime', '제조후'),
    coldBrew: quality('best_by_core.xlsx', '제조 베이스', 'cold brew 커피 추출액', 'lifetime', '추출후'),
    classic: quality(
      'best_by_core.xlsx',
      '코어 원재료',
      '클래식, 바닐라, 스위트, 헤이즐넛, 심플시럽750ML CJ',
      'opened',
    ),
    foam: preparedQuality(foam, foamSteps.cream.source),
    hojicha: preparedQuality(hojicha, hojichaSteps.water.source),
  }
  if (
    qualities.mocha.storage !== storage(mocha.storage, sourceLine(mocha.source)) ||
    !sameLifetime(qualities.mocha.lifetime, lifetime(mocha.lifetime, sourceLine(mocha.source)))
  )
    invalid(
      sourceLine(mocha.source),
      `바모카 보관·기한이 품질 기준과 달라요. ${qualities.mocha.source} 항목을 함께 확인해주세요.`,
    )

  const brew = preparation('콜드 브루 추출액', 'Cold Brew Blend 5lb 기준')
  const brewSteps = linkSteps(
    brew.steps,
    {
      beans: ['Cold Brew Blend', 'lb'],
      water: ['정수 물', 'L'],
      time: ['추출 시간', '시간'],
    },
    `${recipeFile} / 폼·베이스 제조 / ${brew.name} / ${brew.batch}`,
  )
  // Beans/water are recorded, but direct weighing and extraction yield are still prototype gameplay.
  amount(brewSteps.beans)
  amount(brewSteps.water)
  const brewStorage = brew.storage.match(/피처에 옮긴 후 (냉장|실온) 최대 (\d+\s*(?:일|시간))\.$/)
  if (
    !brewStorage ||
    qualities.coldBrew.storage !== storage(brewStorage[1], sourceLine(brewSteps.time.source)) ||
    !sameLifetime(qualities.coldBrew.lifetime, lifetime(brewStorage[2], sourceLine(brewSteps.time.source)))
  )
    invalid(sourceLine(brewSteps.time.source), `콜드 브루 보관·기한을 ${qualities.coldBrew.source}와 대조해주세요.`)

  return {
    hot: { reference: hot, steps: hotSteps, ...latteAmounts(hotSteps) },
    iced: { reference: iced, steps: icedSteps, ...latteAmounts(icedSteps) },
    cold: { reference: cold, steps: coldSteps },
    hojiHot: {
      reference: hojiHot,
      steps: hojiHotSteps,
      ...hojiAmounts(hojiHotSteps),
      tumblerTeaMl: sizes(hojiHotSteps.tea),
    },
    hojiIced: { reference: hojiIced, steps: hojiIcedSteps, ...hojiAmounts(hojiIcedSteps) },
    hojicha: {
      reference: hojicha,
      steps: hojichaSteps,
      waterMl: amount(hojichaSteps.water),
      powderScoops: amount(hojichaSteps.powder, true),
      shakes: amount(hojichaSteps.shake, true),
    },
    foam: {
      reference: foam,
      steps: foamSteps,
      creamMl: amount(foamSteps.cream),
      milkMl: amount(foamSteps.milk),
      glazePumps: amount(foamSteps.glaze, true),
      pumpMl: pumpMl(foamSteps.glaze),
      seconds: notedNumber(
        foamSteps.blend.note,
        /(?<![\d.,+-])(\d+(?:\.\d+)?)\s*초/g,
        `${sourceLine(foamSteps.blend.source)} / 블렌딩 시간`,
      ),
    },
    mocha: {
      reference: mocha,
      packs: positive(Number(mochaAmounts[1]), sourceLine(mocha.source), true),
      waterMl: positive(Number(mochaAmounts[2]), sourceLine(mocha.source)) * 1000,
    },
    brew: { reference: brew, steps: brewSteps, hours: amount(brewSteps.time) },
    quality: qualities,
  }
}
