# Guardian questionnaire sources

유료 질문의 Git source of truth를 두는 디렉터리다. 질문 원문, 선택지, 적응형 선택 정책과 signal을 포함한
각 JSON 파일을 version ID와 같은 파일명으로 커밋한다.

```text
guardian-paid-ko-mvp-v1.json
guardian-paid-ko-mvp-v2.json
```

현재 한국어 MVP 원본은 `guardian-paid-ko-mvp-v1.json`이다. 선택형 44개와 선택 메모 1개로
구성되며, 사용자 한 명은 누적 답변에 따라 선택형 16~20개를 지난 뒤 메모를 선택적으로 남긴다.

이 디렉터리는 Next의 `src`나 정적 `public` 아래가 아니므로 웹 정적 export에 자동 포함되지
않는다. 운영 시 [게시 절차](../../design/zodiac-guardians/paid-questionnaire-content.md)에 따라
검증한 JSON을 staging과 production Supabase 프로젝트의 `stella` schema에 게시한다.

게시한 version의 기존 파일은 수정하지 않는다. 문구·선택 정책·signal 변경은 새 version 파일을 추가하고
상품 manifest pointer를 새 ID로 이동한다.
