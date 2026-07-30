# Stella Zodiac Guardians

Stella의 확률형 유료 리포트와 컬렉션에 사용할 12별자리 캐릭터 시스템의 디자인 원본이다.

## 상태

- 캐릭터 화풍 및 12종 외형: 확정
- 확정일: 2026-07-30
- 네 주제 대표 카드 콘셉트: 확정
- `aries.love` Orbit·Nebula·Eclipse·Stella 희귀도 세트: 확정
- 공개 이름: `ko`, `zh`, `ja`, `en`별 독립 작업명 확정
- 공개 이름 표시: 줄바꿈 없는 한 줄
- 대사, 카드 제목: 작업안
- 모바일 카드 리포트 프로토타입: `/[locale]/cards`에 적용
- 프로토타입 공개 상태: 내비게이션·사이트맵 미노출, `noindex`

이 폴더는 디자인 원본과 기획 문서를 보관한다. 앱에서 사용하는 최적화 WebP 에셋은
`apps/stella/public/images/zodiac-guardians`에 따로 둔다.

## 확정 설정 시트

| 원소 | 캐릭터                         | 파일                            |
| ---- | ------------------------------ | ------------------------------- |
| 불   | 양자리, 사자자리, 사수자리     | [fire.png](./sheets/fire.png)   |
| 흙   | 황소자리, 처녀자리, 염소자리   | [earth.png](./sheets/earth.png) |
| 공기 | 쌍둥이자리, 천칭자리, 물병자리 | [air.png](./sheets/air.png)     |
| 물   | 게자리, 전갈자리, 물고기자리   | [water.png](./sheets/water.png) |

## 문서

- [캐릭터 바이블](./character-bible.md): 이름, 성격, 말투, 색상, 소품, 관계
- [카드 카탈로그](./card-catalog.md): 48장 기본 카드와 희귀도 확장 규칙
- [대표 카드 제작 기록](./cards/representative/README.md): 네 주제 원화, 공통 프롬프트, 제작 메모
- [모바일 카드 리포트 프로토타입](./card-report-prototype.md): 개봉, 리포트, 저장, 공유, 댓글 흐름과 구현 경계

## 네 주제 대표 카드

| 주제     | 카드 ID        | 중심 장면                                      | 파일                                                                    |
| -------- | -------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| 자기이해 | `cancer.self`  | 달집 안에서 자기 모습을 바라보는 모루          | [cancer-self.png](./cards/representative/cancer-self.png)               |
| 사랑     | `aries.love`   | 걸린 하트를 함께 잡은 포피와 모루              | [aries-love-eclipse.png](./cards/representative/aries-love-eclipse.png) |
| 일       | `taurus.work`  | 기울어진 별쿠키 탑을 함께 수습하는 토토와 누리 | [taurus-work.png](./cards/representative/taurus-work.png)               |
| 결정     | `libra.choice` | 저울을 내려놓고 분홍 문손잡이를 잡은 틸리      | [libra-choice.png](./cards/representative/libra-choice.png)             |

`aries.love`의 네 희귀도 원화와 장면 차이는 [대표 카드 제작 기록](./cards/representative/README.md#arieslove-희귀도-세트)에 정리한다.

## 확정된 공통 원칙

- 폭신한 봉제인형형 별자리 수호령
- 머리 약 60%, 몸 약 40%
- 눈은 큰 형태를 유지하되 큰 하이라이트 1개와 작은 하이라이트 1개만 사용
- 짙은 보라색 눈과 외곽선
- 가슴에 네 갈래 황금색 Stella 별표
- 캐릭터마다 고유 실루엣, 성격적 모순, 대표 소품을 하나씩 부여
- 카드 한 장에는 중심 캐릭터, 중심 소품, 중심 감정을 하나씩 둔다
- 귀여움은 외형뿐 아니라 작은 실수와 관계 행동에서 만든다
