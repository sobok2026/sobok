# Guardian questionnaire sources

유료 질문의 Git source of truth를 두는 디렉터리다. 질문 원문, 선택지, 적응형 선택 정책과 signal을 포함한
JSON을 Database Worker의 서버 전용 번들에 포함한다.

```text
guardian-paid-ko.json
```

한국어 원본은 `guardian-paid-ko.json`이다. 선택형 44개와 선택 메모 1개로
구성되며, 사용자 한 명은 누적 답변에 따라 선택형 16~20개를 지난 뒤 메모를 선택적으로 남긴다.

이 디렉터리는 Next의 `src`나 정적 `public` 아래가 아니므로 웹 정적 export에 자동 포함되지
않는다. [질문 콘텐츠 계약](../../design/zodiac-guardians/paid-questionnaire-content.md)에 따라 검증하며,
`worker/guardian/questionnaire-content.ts`가 명시적으로 import한 파일만 Database Worker에 배포된다.

질문과 선택지 ID는 저장된 답변의 영구 식별자다. 기존 ID의 의미를 바꾸거나 다른 질문·선택지에 재사용하지
않는다. 문구·선택 정책·signal은 이 파일을 수정하고 Worker를 배포해 반영하며, DB 게시나 진행 답변 초기화는
수행하지 않는다.
