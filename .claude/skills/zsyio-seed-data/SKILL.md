---
name: zsyio-seed-data
description: Add or run sample/seed data for a Zsyio app. Use when asked to "seed", add demo data, or fill an empty module with realistic records.
---

# Zsyio seed data

Seeders live in `scripts/seed-<app>.ts` (`seed-zsyio.ts`, `seed-sales.ts`, `seed-hrms-full.ts`, `seed-notes.ts`, `seed-recruit.ts`).

## Pattern (copy `scripts/seed-recruit.ts`)
- `export async function seedX()` using `prisma` from `@zsyio/database`, plus a CLI guard at the bottom:
  `if (process.argv[1]?.includes("seed-x")) { seedX().catch(...).finally(() => prisma.$disconnect()) }`.
- **Additive and idempotent.** Look records up by a natural key (job title, job+email) and skip when present. Never delete or overwrite existing data; the user's own test records must survive.
- Take the author/owner from a real user (`role: "ADMIN"`, `active: true`, oldest) and fail with a clear message if none exists.
- Use relative dates (`daysFromNow`) so "upcoming" and "past" stay true whenever it runs.
- Cover every stage/status the UI shows, include realistic optional fields, and a few empty/edge cases. Use `example.com` emails and obviously fake links.
- Log how many records were created.

## Running
`pnpm db:seed:recruit` (or `tsx --env-file=.env.local scripts/seed-<app>.ts`). Confirm the target database host in `.env.local` first, and make sure any new columns are migrated (see the `zsyio-db-migration` skill). Re-run once to prove it creates 0 new rows, then verify counts with `psql`.
