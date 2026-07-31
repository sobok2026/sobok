# Guardian questionnaire sources

유료 질문의 Git source of truth를 두는 디렉터리다. 질문 원문, 선택지, 분기와 signal을 포함한
각 JSON 파일을 version ID와 같은 파일명으로 커밋한다.

```text
guardian-paid-ko-mvp-v1.json
guardian-paid-ko-mvp-v2.json
```

이 디렉터리는 Next의 `src`나 정적 `public` 아래가 아니므로 웹 정적 export에 자동 포함되지
않는다. 운영 시 [게시 절차](../../design/zodiac-guardians/paid-questionnaire-content.md)에 따라
검증한 JSON을 `stella_stg`와 `stella` schema에 게시한다.

게시한 version의 기존 파일은 수정하지 않는다. 문구·분기·signal 변경은 새 version 파일을 추가하고
상품 manifest pointer를 새 ID로 이동한다.
