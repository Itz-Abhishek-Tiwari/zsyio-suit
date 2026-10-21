---
name: zsyio-api-route
description: Add or change an API route or server logic in a Zsyio app. Use for any Next.js route handler, validation schema, permission check or database query so auth, validation and error shape stay consistent across the suite.
---

# Zsyio API route conventions

## Shape of a route
```ts
import { withApiHandler } from "@zsyio/auth/api-helpers";
export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireXUser(true);          // auth + permission
    const body = someSchema.parse(await request.json()); // zod
    return prisma.thing.create({ data: { ...body, createdBy: user.id } });
  });
}
```
- Wrap every handler in `withApiHandler` (`packages/auth/src/api-helpers.ts`). It returns your result as plain JSON (not wrapped in `{ data }`) and maps errors to `{ error: { code, message, fields? } }`: `ZodError` → 400 `VALIDATION_ERROR`, and the typed errors `BadRequestError` (400), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `GoneError` (410), `TooManyRequestsError` (429). A Prisma unique violation (`P2002`) becomes 409. Any other error, including `findUniqueOrThrow` not-found (`P2025`), becomes a 500, so throw `NotFoundError` yourself when a missing record is a normal case.
- Authenticate with `requireUser()` (or `requireAppAccess(appId)`) from `@zsyio/auth/api-helpers`, then `assertCan(user.role, action, user.permissions)` from `@zsyio/auth/permissions`. Keep per-app helpers in `src/server/access.ts` (see Recruit's `requireRecruitUser(write)`).
- Permission checks happen on the server for every read and write. Hiding a button is UX only.
- Use `errorResponse(code, message, status)` for expected failures (e.g. 409 conflicts).
- Next.js route `params` is a Promise: `const { id } = await context.params`.

## Validation
- Validate every body with zod. Normalize at the edge (trim, lowercase emails, empty string → `null`).
- Schemas used by more than one app belong in `packages/validators/src` (export from `index.ts`), never imported across apps. App-only schemas live in the app's `src/lib/schemas.ts`.
- Never trust client-supplied hiring/ownership fields (`createdBy`, `stage`, `source` on public endpoints); zod strips unknown keys, so list only what you accept and add a test that proves extras are dropped.
- Links stored from user input go through `optionalLink` (http/https only).

## Data rules
- Never return `passwordHash`, OTP hashes or tokens. Use the shared safe user select.
- Core PMS entities (`Task`, `Client`, `Product`) are soft-deleted with `deletedAt`, never hard-deleted.
- Use `$transaction` when a change and its audit/event row must succeed together (see Recruit stage changes).
- Public (unauthenticated) endpoints need an origin check, size limit, honeypot and a rate limit. Copy `apps/pms/src/app/api/careers/applications/route.ts`.

## Tests
Add unit tests in `tests/unit/*.test.ts` for schemas and permission rules, then run the specific files plus any test that imports the schema you changed: `npx vitest run tests/unit/<name>.test.ts`. Search `tests/` for the schema name before changing it; a changed schema can break a test in a different file.
