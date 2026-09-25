import { readFile } from 'node:fs/promises'
import { linkReferences, sourceLine } from '../src/game/reference-links.ts'

try {
  const data = JSON.parse(await readFile(new URL('../src/data/references.generated.json', import.meta.url), 'utf8'))
  const links = linkReferences(data)
  console.log('카페 자료 연결 확인: 음료 5개, 폼·바모카·호지차 샷·콜드 브루 준비, 품질 기준 10개')
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
  for (const drink of [links.hojiHot, links.hojiIced])
    console.log(
      `- ${drink.reference.name} ${drink.reference.variant}: 클래식 ${drink.syrupPumps}펌프 × ${drink.syrupPumpMl}ml, 토핑 ${drink.powderTaps}톡`,
    )
  console.log(
    `- 호지차 샷: 정수 ${links.hojicha.waterMl}ml + 파우더 ${links.hojicha.powderScoops}스쿱, ${links.hojicha.shakes}회 쉐이킹`,
  )
  console.log('- 컵의 ml 환산·완성 수율·샷당 원두량·원팩 규격은 게임용 임시값을 유지합니다.')
  console.log('- N일 기한은 시작일 포함 N일의 마지막 날 종료까지, N시간은 시작 시각부터 계산합니다.')
  console.log('- 클래식 시럽의 1개월은 달력 한 달로 계산하며, 다음 달에 같은 날짜가 없으면 그 달 말일까지 사용합니다.')
  console.log('- 호지차 파우더 원팩의 개봉 후 7일·포장 규격·가격, 완성 수율·컵 계량·재혼합 횟수는 게임용 임시값입니다.')
  console.log(
    `- 바모카 원팩의 개봉 후 7일은 임시값입니다. ${sourceLine(links.mocha.reference.source)}의 ${links.mocha.reference.lifetime}은 완성 배합 기준입니다.`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
