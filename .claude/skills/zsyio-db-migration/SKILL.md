---
name: zsyio-db-migration
description: Change the Prisma schema or apply a migration in the Zsyio monorepo. Use when adding models or columns, writing migration SQL, regenerating the client, or when `prisma migrate` fails on the local database.
---

# Zsyio database migrations

## Where things live
- Schema is split by domain: `packages/database/prisma/schema/*.prisma` (e.g. `recruit.prisma`, `sales.prisma`).
- Migrations: `packages/database/prisma/migrations/<timestamp>_<name>/migration.sql`.
- Local database: `postgresql://abhishek@localhost:5432/zsyio_pms` (from `.env.local`). Read the host from `.env.local` before running anything; never print credentials.

## Making a change
1. Edit the `.prisma` file. Prefer additive changes: new nullable columns/tables, no drops or renames in the same step.
2. Hand-write the migration folder and SQL (`ALTER TABLE ... ADD COLUMN ...`) with a timestamp later than the newest folder.
3. Regenerate the client: `cd packages/database && pnpm db:generate`.
4. Update types, zod schemas, UI and tests, then type-check every app that uses the model.

## Applying locally
- Try `npx prisma migrate deploy` only if `npx prisma migrate status` shows a clean history.
- **Known gotcha:** the local DB was not built from the migration history. `migrate deploy` fails on the first old migration (`type "ClientStatus" already exists`) **and inserts a failed row for it in `_prisma_migrations`**, which blocks later runs. If that happens, delete only that failed row (`finished_at is null`, started just now), then:
  ```
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/migrations/<name>/migration.sql
  npx prisma migrate resolve --applied <name>
  ```
- Before and after, check `select migration_name, finished_at from _prisma_migrations order by started_at`.
- Never run migrations or seeds against a non-local database without the user explicitly saying so. State the target host first.
