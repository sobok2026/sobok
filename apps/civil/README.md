# Civil

Civil is Sobok's multi-tenant spatial civil-engineering product. It is a greenfield TypeScript application;
the former Python server and single-file HTML prototype are not runtime dependencies or compatibility targets.

## Runtime boundaries

- `next build` produces the static `out/` site served by the public `civil` Worker.
- The public Worker forwards only `/api/*` to the private Database Worker's `CivilService` entrypoint.
- `CivilService` owns the host-local OIDC relying-party session and the PostgreSQL, Queue, and private R2 bindings.
- Browser uploads are split into fixed 8 MiB parts. The service keeps the R2 upload ID and every part ETag in
  PostgreSQL; clients never receive an R2 credential, upload ID, object key, or public bucket URL.
- `civil-compute` consumes isolated calculation and artifact queues. Calculation jobs and artifact inspections use
  separate job-scoped Cloudflare Containers with no database credential and no public route.
- The calculation Container receives an immutable input snapshot and returns a deterministic official result. The
  artifact Container streams files to ephemeral disk, calculates SHA-256, and runs fail-closed ClamAV inspection.

Production uses `https://civil.sobok.cc` and the fixed `civil-web` OIDC client. Staging uses
`https://civil-stg.sobok.cc` with an environment-specific client secret and database.

## Data isolation

Every business table belongs to the `civil` PostgreSQL schema and carries `organization_id`. The Worker sets
transaction-local actor and organization context after validating the Civil session. PostgreSQL RLS applies a
second, default-deny tenant boundary. Authentication tables are product-local relying-party state and contain no
business authorization roles.

Original files and full GeoJSON belong in the environment's private R2 bucket. `r2.dev` remains disabled and every
upload, part, completion, abort, list, and ranged download operation is authorized against the current project.
Completed files remain quarantined until asynchronous inspection succeeds; rejected objects are never downloadable
and are deleted from R2. PostgreSQL stores the authoritative quota reservation, upload state, checksum, revision
state, and queryable PostGIS footprints. The scanner image is rebuilt weekly so the immutable ClamAV signature set
does not depend on runtime Internet access.

## Commands

```sh
bun --filter=@sobok/civil dev
bun --filter=@sobok/civil build
bun --filter=@sobok/civil type
```

Schema changes use the environment's `civil_migrator` credential and `drizzle-kit push`. Runtime Workers never
create or alter database objects.
