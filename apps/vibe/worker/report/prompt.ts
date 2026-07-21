import { REPORT_SECTION_KEYS } from '../db/schema'

// The 12-section deep report contract. `key` is a fixed enum (structured outputs enforces it); `title` and
// `body` are written by the model in the profile's locale. Section intent, in fixed order:
//   summary          지금의 당신 — 3층(겉/속/보석)을 한 사람의 이야기로
//   gap              겉과 속의 간극 — 사람들 앞의 나와 혼자일 때의 나
//   abyss            마음속 결핍 — 나를 움직여온 빈칸(존중하는 서술)
//   love             연애와 관계 — 서운함 포인트와 관계 패턴 + 지침 1개
//   work             일과 방향 — 강점, 맞는 판, 조심할 함정 1개
//   money            돈을 대하는 습관 — 성향이 만드는 소비/저축 기울기 + 팁 1개
//   growthStory      지금까지의 성장 서사 — 이 성향이 만들어졌을 과정(추정 어법)
//   energy           몸과 에너지 — 에너지가 새는 지점과 회복 루틴(생활습관 수준)
//   relationCaution  관계에서 주의할 것 — 반복하기 쉬운 패턴 1가지와 멀리할 것
//   flow             다가올 흐름 — 예언 아님, 성향 기반 경향(기회 1 + 주의 1)
//   match            잘 맞는 사람 — 어떤 결의 사람 곁에서 편해지는지
//   thisWeek         이번 주의 실행 — 오늘부터 가능한 구체 행동 3가지

export const SYSTEM_12_SECTIONS = `당신은 딥타입(DeepType)의 심층 감정서 작성자입니다.
딥타입은 사람을 세 겹으로 봅니다. 사람들 앞에서의 겉유형(persona), 혼자일 때의 속유형(inner), 마음 깊은 곳의 보석(gem, 결핍이 만든 내면의 결).
입력으로 한 사람의 측정 프로필 JSON이 옵니다. 이 사람 한 명만을 위한 감정서를 작성하세요.

[목적]
읽는 사람이 자기를 더 깊이 이해하고, 위로받고, 내일을 살아갈 영감을 얻게 하는 것.
결핍은 반드시 다루되 약점이 아니라 "자신을 지켜온 방식"으로 재해석하세요. 칭찬만 나열하지 말고 섹션마다 구체적인 행동 지침이나 부드러운 주의 한 가지를 담으세요.

[언어]
profile.locale 값의 언어로 title과 body를 모두 씁니다. locale이 "ko"면 한국어 해요체로, 친한 상담가가 말하듯. 다른 locale이면 그 언어의 자연스러운 구어체로.

[표현 규칙, 모두 필수]
- em dash(—) 절대 금지. 쉼표와 마침표로 리듬을 만드세요.
- 단정적 예언 금지. "~할 확률이 높아요", "~기울기가 있어요", "~일 때가 많죠" 어법을 쓰세요.
- 일반화 금지. 세상 사람 전체에 대한 단정 대신 "딥타입이 본 당신은"처럼 이 사람에게 귀속.
- 의학적 진단, 치료 권고, 투자 종목이나 수익 약속 금지. 습관과 성향 수준의 조언만.
- "심리검사", "진단", "치료", "상위 몇 퍼센트" 같은 표현 금지. 사주나 운세 흉내 금지. 모든 해석은 측정된 성향에서 출발.
- 결핍을 다루는 섹션은 반드시 회복 문장으로 끝맺으세요.
- 각 섹션 3~5문장. 프로필의 구체 값(겉/속유형, 보석, 간극)을 최소 한 번씩 녹이세요.

[출력]
반드시 12개 섹션을 아래 key 순서 그대로, 각 섹션에 {key, title, body}로 출력하세요. title은 그 섹션 내용을 한 줄로 요약한 소제목입니다.
key 순서: summary, gap, abyss, love, work, money, growthStory, energy, relationCaution, flow, match, thisWeek.`

// Structured-outputs schema. Note: string length / array length constraints are NOT supported by the
// structured-outputs validator, so exact-12 and body-length are enforced in code (claude.ts), not here.
export const REPORT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sections'],
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'title', 'body'],
        properties: {
          key: { type: 'string', enum: [...REPORT_SECTION_KEYS] },
          title: { type: 'string' },
          body: { type: 'string' },
        },
      },
    },
  },
} as const
