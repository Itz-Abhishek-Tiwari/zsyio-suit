---
name: zsyio-ui
description: Build or change UI in any Zsyio app (admin, pms, hrms, notes, sales, recruit) so it matches the suite. Use before writing pages, shells, forms, modals, tables or loading/error states, or when asked to make an app "look like" or "use common components" from the others.
---

# Zsyio UI conventions

Every app must look and behave like the others. Reuse `@zsyio/ui` instead of hand-rolling markup.

## Before writing UI
1. Check `packages/ui/src/index.ts` for an existing component. Wrap or extend the shared one; do not copy it into an app.
2. If something is missing and would be useful to 2+ apps, add it to `packages/ui`, not to the app.
3. Apps never import from other apps. Share through `packages/*` (`@zsyio/ui`, `@zsyio/validators`, `@zsyio/auth`, `@zsyio/types`).

## App shell (copy the HRMS/Sales/Recruit pattern)
- Root `layout.tsx`: load `Inter` (`--font-body`) and `JetBrains_Mono` (`--font-mono`), wrap in `ThemeProvider` (`accentCookieDomain`, `attribute={["class","data-theme"]}`, `defaultTheme="light"`, `enableSystem`) and render `<Toaster />`.
- `(dashboard)/layout.tsx` (server): `auth()` → redirect to `/login`; compute `allowedApps` with `canAccessApp`; render `AccessRestricted` (pass `userEmail`) when no access; read the `sidebar_collapsed` cookie server-side; wrap in `SessionProvider` and `<Suspense><NavigationProgress/></Suspense>`.
- Shell (client): `SuiteSidebar` + `SuiteHeader` inside `TooltipProvider`; persist collapse to the `sidebar_collapsed` cookie; close the mobile drawer on route change; set `isActive` on nav items (nested paths count); wrap `children` in `<PageTransition key={pathname}>`; render `ChangePasswordModal forced` only when `mustChangePassword`.
- `<main>` padding is `p-4 sm:p-6`. Do not add `lg:p-8`, and do not cap content width with `max-w-*`/`mx-auto`. Content runs full width in every app.
- Also provide `loading.tsx`, `error.tsx` and `not-found.tsx` (copy the HRMS/PMS versions).

## Pages
- Page wrapper: `space-y-6 animate-fade-in pb-12`.
- Always use `PageHeader` with `eyebrow`, `titleIcon`, `description` and `borderBottom`. Actions go in `actions`.
- Stats: `KpiCard`. Empty/error: `EmptyState`. Loading: `Skeleton`, `CardGridSkeleton`, `TableSkeleton`, `KanbanBoardSkeleton`.
- Forms: `Modal` (with footer buttons; `form="id"` on the submit button), `Label`, `Input`, `Textarea`, `Select`, `DatePicker`, `SearchInput`. Boards: `KanbanBoard`/`KanbanColumn`/`KanbanCard`. Tables: `Table*`. Status: `StatusBadge`/`Badge`. People: `UserAvatar`.
- Dates: use `formatDate`/`formatTime` from `@zsyio/ui`, not `toLocaleString()`.
- Colors come from design tokens (`bg-primary`, `text-muted-foreground`, `notion-*`). No raw hex or inline color styles (`pnpm check:colors` enforces this).
- Links rendered from user input must be http(s) only.

## Verify
`pnpm --filter <app> exec tsc --noEmit`, `pnpm --filter <app> exec eslint src`, then look at it in the browser at the app's port in light and dark.
