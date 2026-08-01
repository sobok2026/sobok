# Stella Zodiac Guardians

Stella의 확률형 유료 리포트와 컬렉션에 사용할 12별자리 캐릭터 시스템의 디자인 원본이다.

## 상태

- 캐릭터 화풍 및 12종 외형: 확정
- 확정일: 2026-07-30
- 네 주제 대표 카드 콘셉트: 확정
- `aries.love` Orbit·Nebula·Eclipse·Stella 희귀도 세트: 확정
- 유료 MVP: 4개 패밀리·7개 에디션으로 시작하고, production에서는 입력에 따라 네 기본 카드가 달라짐
- 카드 에셋: 유료 MVP는 4개 패밀리·7개 에디션, production 출시는 실제 3:4 에디션 최소 1,024장
- 질문 흐름: 무료 미리보기 2개, 결제 확인 뒤 선택형 16~20개, 별도 자유 입력은 선택 사항 최대 1개
- 한국어 유료 질문 v1: 선택형 44개·선택지 176개와 선택 메모 1개, 네 주제 각 4~5개 출제
- 유료 답변 효과: 네 주제 상세 본문·해석 초점·한 줄을 실질적으로 변경
- 유료 질문 소스: 원문·선택지·적응형 선택 정책·점수를 Git JSON으로 관리하고 DB에 불변 버전으로 게시
- 반복 구매: 사랑 카드의 일러스트와 한 줄만 저가 재추첨
- 계정과 출시: Stella 전용 웹 계정, 한국 → 중국 본토 → 이후 미정
- 게스트 구매: 결제 직전 이메일을 필수 복구 채널로 받고 계정 생성과 분리
- 배포 경계: `stella-stg`와 `stella`는 분리하되 Supabase 프로젝트·DB와 Hyperdrive는 공유
- 가격·확률·미보유 보장 수치: 한국 유료 MVP 1차안 확정
- 한국 첫 결제: PortOne V2 토스페이 직접 연동, 토스페이먼츠는 실결제 승인 뒤 추가
- 결제 인프라: 중앙 `apps/payments`가 PortOne 자격증명·웹훅·채널 정책을 소유하고 Stella 주문·권한은
  Stella schema에 유지
- 유료 서버 도메인: 상품·추첨·게스트 컬렉션·리포트·구매·획득·보장 기반 구현, 공개 API 미연결
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
- [유료 카드 리포트 MVP와 확장 전략](./paid-mvp-product-strategy.md): 상품, 가격, 추첨, 계정, 결제, 성장 루프
- [한국 전체 리포트 결제·공개 수직 슬라이스](./korea-paid-report-vertical-slice.md): 게스트 checkout, PortOne 검증, 결제 후 유료 질문, 카드 공개 구현 계약
- [유료 질문 콘텐츠 계약과 게시](./paid-questionnaire-content.md): Git 문항은행 계약, 불변 DB 버전, staging·production 게시 절차

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
