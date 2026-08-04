# sobok

## Requirements

- Bun 1.3
- Docker 29.3

## Getting Started

### 1. 의존성 설치

```bash
bun install
```

### 2. Postgres/Redis 실행

```bash
bun run db:reset
```

기본 포트:

- Web: `3000`
- Proxy: `3001`
- Backend: `3002`
- App Postgres: `5434`

> 참고: `bun run db:reset`은 `docker compose down -v`를 포함해서 **DB 볼륨이 초기화돼고 DB 스키마 반영까지 진행돼요**. 처음부터 다시 시작할 때만 사용해 주세요.

### 3) 서비스 실행

```
bun dev
```

## 기여하기

기여는 언제든 환영해요.

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SECURITY.md`](SECURITY.md)
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

## Architecture

- [Sobok 통합 계정](docs/architecture/sobok-account.md)
- [Sobok 통합 계정 최초 배포](docs/operations/sobok-account-rollout.md)

## License

GPL-3.0. 자세한 내용은 [`LICENSE`](LICENSE)를 확인해 주세요.
