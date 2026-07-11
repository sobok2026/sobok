import { getElementBySecureFisherYates } from '@sobok/std'

const adjectives = [
  '반짝이는',
  '설레는',
  '포근한',
  '따뜻한',
  '수줍은',
  '씩씩한',
  '몽글몽글한',
  '두근두근한',
  '빛나는',
  '조용한',
  '명랑한',
  '다정한',
  '엉뚱한',
  '느긋한',
  '용감한',
  '순수한',
  '발랄한',
  '차분한',
  '재빠른',
  '단단한',
]

const nouns = [
  '별사탕',
  '응원봉',
  '달빛',
  '첫줄',
  '앙코르',
  '무대인사',
  '포토카드',
  '하이터치',
  '별자리',
  '소절',
  '후렴',
  '커튼콜',
  '리허설',
  '입덕요정',
  '최애바라기',
  '공연장',
  '떼창',
  '플래시',
  '설렘',
  '소복이',
]

export function generateRandomNickname() {
  const adjective = getElementBySecureFisherYates(adjectives)
  const noun = getElementBySecureFisherYates(nouns)
  return `${adjective} ${noun}`
}
