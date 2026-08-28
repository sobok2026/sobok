# Civil

Civil is Sobok's multi-tenant civil-engineering product. It is a greenfield TypeScript application;
the former Python server and single-file HTML prototype are not runtime dependencies or compatibility targets.

## Runtime boundaries

- `next build` produces the static `out/` site served by the public `civil` Worker.
- The public Worker forwards only `/api/*` to the private Database Worker's `CivilService` entrypoint.
- `CivilService` owns the host-local OIDC relying-party session and the PostgreSQL and calculation Queue bindings.
- `civil-compute` is a private Queue consumer with no database credential or public route. It claims immutable work
  through the Database Worker RPC, calculates the result in TypeScript, validates the output, and returns its hash.
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

## Commands

```sh
bun --filter=@sobok/civil dev
bun --filter=@sobok/civil build
bun --filter=@sobok/civil type
```

Schema changes use the environment's `civil_migrator` credential and `drizzle-kit push`. Runtime Workers never
create or alter database objects.
