---
name: zsyio-new-app
description: Add a new app to the Zsyio suite, or audit an existing app against the suite checklist. Use when creating apps/<name>, wiring it into the app switcher and permissions, or reviewing why an app feels different from the others.
---

# Adding / auditing a Zsyio app

Use `apps/recruit` as the smallest reference and `apps/hrms` / `apps/sales` as the fuller ones. Next.js here is 15.5 and may differ from older docs; read `node_modules/next/dist/docs/` if present before using unfamiliar APIs (see `AGENTS.md`).

## Checklist
1. **Package**: `apps/<name>/package.json` named `@zsyio/<name>`, dev script `next dev --turbopack -p <port>` (unique port; next free one after 3006), deps on `@zsyio/auth|database|types|ui|validators` as `workspace:*`.
2. **Config**: copy `next.config.ts` (CSP/security headers, `transpilePackages`, `serverExternalPackages: ["@prisma/client"]`, `optimizePackageImports`), `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`, `tsconfig.json`. `globals.css` imports tailwind, `@source` for `packages/ui/src`, and `@zsyio/ui/styles.css|base.css|theme.css`.
3. **Suite wiring**: add the id to `AppId` (`packages/auth/src/permissions.ts`: `canAccessApp` action map, `app:access:<name>` permission, admin defaults), to `AppSwitcher.tsx` and `SuiteSideRail.tsx` (and their id unions in `SuiteSidebar`/`SuiteHeader`), the `allowedApps` list in each app's dashboard layout, `.env.example` (`NEXT_PUBLIC_<NAME>_URL`) and root `package.json` (`dev:<name>`, `start:<name>`).
4. **Auth**: `middleware.ts` re-exporting `defaultAuthMiddleware`, `/api/auth/[...nextauth]`, `/api/users/theme`, `/api/users/me`, `/api/users/me/password` reusing the shared handlers; login via `LoginPageLayout` + `AuthLoginForm`.
5. **UI**: follow the `zsyio-ui` skill for the shell, page layout, loading/error/not-found.
6. **Data/API**: follow `zsyio-db-migration` and `zsyio-api-route`; add a short `docs/<name>.md` and seed data via `zsyio-seed-data`.
7. **Verify**: type-check and lint the app, run the unit tests, start it with `pnpm dev:<name>` and check light/dark and mobile width.

## Audit mode
Diff the app's `layout.tsx`, dashboard layout/shell, and page wrappers against HRMS/Sales for: fonts, `NavigationProgress`, sidebar cookie, `PageTransition`, nav `isActive`, `PageHeader` props, `<main>` padding, full-width content, and presence of `loading`/`error`/`not-found`.
