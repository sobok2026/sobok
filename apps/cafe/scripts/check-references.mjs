import { readFile } from 'node:fs/promises'
import { linkReferences, sourceLine } from '../src/game/reference-links.ts'

try {
  const data = JSON.parse(await readFile(new URL('../src/data/references.generated.json', import.meta.url), 'utf8'))
  const links = linkReferences(data)
  console.log('카페 자료 연결 확인: 음료 3개, 폼·바모카·콜드 브루 준비, 품질 기준 8개')
  for (const drink of [links.hot, links.iced])
    console.log(
      `- ${drink.reference.name} ${drink.reference.variant}: Tall ${drink.shots}샷, ${drink.glazePumps}펌프 × ${drink.pumpMl}ml, 토핑 ${drink.powderTaps}톡`,
    )
  console.log(
    `- 폼: 크림 ${links.foam.creamMl}ml + 우유 ${links.foam.milkMl}ml + ${links.foam.glazePumps}펌프, 블렌딩 ${links.foam.seconds}초`,
  )
  console.log(
    `- 바모카: ${links.mocha.packs}봉 + 온수 ${links.mocha.waterMl}ml / 콜드 브루 추출: ${links.brew.hours}시간`,
  )
  console.log('- 컵의 ml 환산·완성 수율·샷당 원두량·원팩 규격은 게임용 임시값을 유지합니다.')
  console.log(
    `- 바모카 원팩의 개봉 후 7일은 임시값입니다. ${sourceLine(links.mocha.reference.source)}의 ${links.mocha.reference.lifetime}은 완성 배합 기준입니다.`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
