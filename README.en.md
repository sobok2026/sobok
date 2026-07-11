# sobok

## Requirements

- Bun 1.3
- Docker 29.3

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Run Postgres/Redis

```bash
bun run db:reset
```

Default ports:

- Web: `3000`
- Proxy: `3001`
- Backend: `3002`
- App Postgres: `5434`

> Note: `bun run db:reset` includes `docker compose down -v`, so it **resets the DB volumes and applies the DB schema**. Please use it only when starting over from scratch.

### 3. Run services

```bash
bun dev
```

## Contributing

Contributions are always welcome.

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SECURITY.md`](SECURITY.md)
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

## License

GPL-3.0. See [`LICENSE`](LICENSE) for details.
