# Civil

Civil is Sobok's multi-tenant civil-engineering product. It is a greenfield TypeScript application;
the former Python server and single-file HTML prototype are not runtime dependencies or compatibility targets.

## Runtime boundaries

- `next build` produces the static `out/` site served by the public `civil` Worker.
- The public Worker forwards only `/api/*` to the private Database Worker's `CivilService` entrypoint.
- `CivilService` owns the host-local OIDC relying-party session and the PostgreSQL, private R2, and Queue bindings.
- `civil-compute` is a private Queue consumer with no database credential or public route. It claims immutable work
  through the Database Worker RPC, calculates results, verifies artifact formats and hashes, and streams electronic
  delivery ZIP packages back to private R2.
- The deployment uses Workers and Queues available on Cloudflare Free; it has no Container or paid runtime dependency.

Production uses `https://civil.sobok.cc` and the fixed `civil-web` OIDC client. Staging uses
`https://civil-stg.sobok.cc` with an environment-specific client secret and database.

## Data isolation

Every business table belongs to the `civil` PostgreSQL schema and carries `organization_id`. The Worker sets
transaction-local actor and organization context after validating the Civil session. PostgreSQL RLS applies a
second, default-deny tenant boundary. Authentication tables are product-local relying-party state and contain no
business authorization roles.

Official calculations use a validated immutable input snapshot, versioned algorithm identifier, canonical input and
output hashes, append-only result revisions, approval history, and audit events. The Queue consumer can retry safely;
the Database Worker serializes claims and is the only runtime principal allowed to mutate authoritative records.

## Drawings, files, and electronic delivery

- Source artifacts are private R2 objects and have no `r2.dev`, custom-domain, or browser CORS access.
- Uploads use authenticated 8 MiB multipart requests, a 1 GiB per-file limit, per-organization quota, and a deployment
  storage cap. Production is capped at 6 GiB and staging at 1 GiB to remain below the account's R2 Free allowance.
- Civil checks the allowlisted extension, leading file signature, actual byte count, and SHA-256. It does **not** claim
  to scan for malware. All source responses are forced downloads with `nosniff` and private `no-store` caching.
- Drawing records preserve kind, revision lineage, coordinate reference system, and an optional project-CRS bounding box.
- Electronic deliveries are immutable uncompressed ZIP packages containing the verified originals and canonical
  `manifest.json`. Source hashes are rechecked during packaging; the manifest and completed ZIP get independent hashes.
- A ready package can be submitted once and then approved or returned for changes. Corrections are a new package revision,
  while status changes and review notes remain append-only events.

## Commands

```sh
bun --filter=@sobok/civil dev
bun --filter=@sobok/civil build
bun --filter=@sobok/civil type
```

Schema changes use the environment's `civil_migrator` credential and `drizzle-kit push`. Runtime Workers never
create or alter database objects.
