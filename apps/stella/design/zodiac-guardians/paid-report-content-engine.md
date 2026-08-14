# 한국어 개인화 리포트 본문 엔진과 최종 계약

## 현재 구성

| 항목           | 값                                   |
| -------------- | ------------------------------------ |
| 상품           | `guardian-report-full-v1`            |
| 질문           | `guardian-paid-ko.json`              |
| 본문           | `report-copy-ko.ts`                  |
| 지원 locale    | `ko`                                 |
| 서버 구현      | `worker/guardian/report*.ts`         |
| 불변 저장 위치 | `guardian_report.narrative_snapshot` |

본문 원본과 선택기는 Worker bundle에만 들어간다. Next 정적 앱에는 질문 은행이나 본문 선택표를
import하지 않는다. 다른 locale은 기존 한국어 문장을 런타임 번역하지 않고 locale별 질문 JSON과
copy generator를 추가한다. 질문과 본문은 현재 배포된 Worker 번들이 정본이며 report에 별도 콘텐츠
버전을 저장하지 않는다.

## 생성 입력과 선택 규칙

마지막 유료 답변을 저장하는 report transaction 안에서 다음 입력을 함께 사용한다.

- checkout 때 고정한 정규화 차트와 무료 답변 2개
- 완료된 16~20개 선택 답변과 선택 메모
- 선택 답변에서 합산한 signal snapshot
- 한 번 선택한 네 family와 card edition
- 현재 Worker의 질문 콘텐츠와 locale별 본문 generator

signal과 원래 답변의 역할은 분리한다.

- `self.need.*`, `love.need.*`, `work.value.*`, `choice.need.*`는 섹션 중심과 한 줄을 고른다.
- `self.coping.*`, `love.pace.*`, `work.need.*`, `choice.protect.*`는 다음 행동 조언을 고른다.
- `guidance.tone.*`은 전체 문장의 말투를, `report.path.*`는 종합 제목·요약·마지막 행동을 고른다.
- 선택된 모든 `questionId/optionId`는 질문별 authored frame과 결합해 상세 근거 문단 한 개가 된다.
  따라서 합산 signal에서 1등이 아닌 답도 최종 본문에서 사라지지 않는다.
- 선택 메모는 점수나 카드 선택을 바꾸지 않고 capability로 보호되는 종합 섹션에 원문 그대로
  보조 맥락으로만 둔다.

차트는 원시 경도 대신 섹션에 필요한 배치 이름만 최종 계약에 남긴다.

| 섹션     | 사용하는 배치                                   |
| -------- | ----------------------------------------------- |
| 자기이해 | 태양, 확정 가능한 달, 출생 시각이 있으면 상승궁 |
| 사랑     | 금성                                            |
| 일       | 토성, 출생 시각이 있으면 중천점                 |
| 결정     | 수성, 화성                                      |

출생 시각이 없으면 상승궁·중천점·하우스를 사용하지 않는다. 달의 가능한 경도 범위가 한 별자리에
머물 때만 달 별자리 이름을 표시하며, 이 제한은 `hero.chartNote`에도 설명한다.

사랑 카드의 title·대체 텍스트·한 줄은 실제 rarity edition을 반영한다. 희귀도는 기존 독립 난수 추첨
결과를 읽기만 하며 질문 답변이나 본문 signal이 확률을 바꾸지 않는다. 사랑 카드 재추첨은 현재
locale별 card copy와 기존 답변 snapshot에서 새 edition용 presentation을 한 번 만들고 획득 행에
보존한다. 사용자가 그 카드를 리포트에 걸면 카드 표현만 교체하며 chart·상세 문단·조언·성찰 질문은
최초 `narrative_snapshot`을 그대로 사용한다.

## 불변 fulfillment

본문은 요청 때마다 다시 조합하지 않는다.

```text
마지막 답변 저장
  → answer·signal snapshot 고정
  → family·edition 선택
  → 한국어 본문 전체 렌더
  → acquisition 4건 기록
  → card_snapshot + narrative_snapshot + fulfilled 전환
```

위 작업은 report row lock을 잡은 하나의 DB transaction이다. 생성 도중 locale별 copy, 선택 답변,
카드 또는 질문별 본문 frame이 맞지 않으면 transaction 전체가 실패하며 다른 문장으로 대체하지 않는다.
이미 `fulfilled`인 report는 엔진을 다시 실행하지 않고 저장된 두 snapshot을 반환한다.

`narrative_snapshot`에는 최종 사용자에게 보여 줄 한국어 문자열을 그대로 저장한다. 선택 key만 저장해
나중의 renderer에 의존하지 않으므로 질문 문구나 copy 코드가 바뀌어도 구매한 결과는 달라지지 않는다.
draft report는 현재 배포된 generator로 완성한다. 이미 게시한 카드의 의미나 표현을 실질적으로 바꿀
때는 기존 edition ID를 덮어쓰지 않고 새 ID를 추가한다.

질문 콘텐츠 검증은 Worker 번들에 등록된 questionnaire에 대해 다음 항목도 함께 확인한다.

- 선택형 44개 모두에 같은 slot의 상세 본문 frame이 있음
- 모든 frame이 실제 선택 답변 문구를 한 번 이상 사용함
- 본문 중심·조언·말투·종합 경로 selector의 signal을 실제 option이 생성함
- 중심·조언·종합 경로를 정하는 각 핵심 option이 해당 selector signal을 정확히 하나 생성함
- manifest의 모든 edition ID에 locale별 카드 title·대체 텍스트가 있고, 모든 사랑 edition에 고유한
  한 줄 builder가 있음

## 최종 `GET report` 계약

`GET /api/guardian-reports/:reportPublicId`는 collection capability와 paid entitlement를 모두 확인한다.
draft에서는 질문 진행 메타데이터만, fulfilled에서만 다음 결과를 반환한다.

```ts
type FulfilledGuardianReport = {
  reportPublicId: string
  status: 'fulfilled'
  locale: 'ko'
  fulfilledAt: string
  cards: Array<{
    cardEditionId: string
    familyId: string
    slot: 'self' | 'love' | 'work' | 'choice'
    rarity: 'orbit' | 'nebula' | 'eclipse' | 'stella' | null
    artworkPath: string
  }>
  narrative: {
    locale: 'ko'
    hero: {
      eyebrow: string
      title: string
      introduction: string
      oneLine: string
      chartNote: string | null
    }
    sections: Array<{
      slot: 'self' | 'love' | 'work' | 'choice'
      label: string
      title: string
      guardians: string
      artworkAlt: string
      oneLine: string
      chart: {
        summary: string
        placements: Array<{
          body: 'sun' | 'moon' | 'ascendant' | 'venus' | 'saturn' | 'midheaven' | 'mercury' | 'mars'
          sign: string
          label: string
        }>
      }
      details: Array<{ title: string; body: string }>
      guidance: { title: string; body: string }
      reflection: string
    }>
    closing: {
      title: string
      body: string[]
      action: string
      personalNote: { label: string; body: string } | null
    }
  }
}
```

`cards`는 선택·원화 데이터, `narrative`는 화면에 표시할 locale별 구매 결과다. 두 배열은
`self → love → work → choice` 순서이며 `slot`으로 연결한다. API는 `messageKey`를 노출하지 않고 이미
결정된 문자열을 반환한다. 전체 질문 은행, 다른 option의 본문, 원시 차트, answer snapshot,
signal snapshot, family snapshot은 반환하지 않는다.
