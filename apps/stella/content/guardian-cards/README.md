# Guardian card content

이 디렉터리는 수호령 카드 원고, 에디션 제작 계획, 사람의 시각 승인 기록과 R2 배포 매니페스트의 Git
source of truth다.

현재 제품 런타임은 자기이해 192장, 사랑 480장, 일 192장, 결정 192장 등 승인된 1,056개 에디션을 모두
오늘·내일 일일 카드 후보로 사용한다. 이전 전체 리포트와 사랑 카드 재추첨 상품은 운영하지 않으며, 기존
카드 원화와 원고를 매일 한 번 고정되는 카드 경험으로 재사용한다.

## 런타임 생성

```bash
bun --filter=@sobok/stella guardian-cards:materialize-runtime
bun --filter=@sobok/stella guardian-cards:validate
```

생성 결과는 `worker/guardian/runtime-catalog.generated.json`이다. 생성 과정은 전체 제작 카탈로그와 사람의
시각 승인 기록을 검증하고, 48개 패밀리와 1,056개 에디션을 일일 선택에 필요한 최소 필드로 투영한다.

## 원화 계약

- 승인 원본: Git에 넣지 않는 1080×1440 PNG
- 전달 형식: 1080×1440 WebP
- 객체 키: `guardian-cards/ko/{editionId}.{deliverySha256_12}.webp`
- cache: `public, max-age=31536000, immutable`
- 객체 배포: `.github/workflows/guardian-card-art-deploy.yml`
- bucket과 custom domain: `../sobok-ops` Terraform

기존 객체 키의 바이트를 덮어쓰지 않는다. 의미가 달라지면 새 edition ID를 만들고, 같은 의미의 원화 교정은
같은 ID와 새 콘텐츠 주소형 객체 키를 사용한다.
