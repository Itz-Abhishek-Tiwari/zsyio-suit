# Zsyio — Internal Product Management Platform
## Build Spec v2 (Architect Consolidation)

**Audience:** This document is written to be handed directly to an AI coding agent (Claude Code, etc.) as the single source of truth. Where it conflicts with anything pasted earlier in the same session, **this file wins.**

**Status of inputs this doc reconciles:**
1. `product-management-platform.md` — original spec (aspirational, not fully built)
2. Zsyio CMS feature doc — what's actually running today ("as-built")
3. Figma file (`m8B4jZbK039EV7eUH5HpA6`, node `8150-12795`) — **visual design-system reference only.** It is not a page-by-page spec, not a component-count target, and not a data-model source. Use it for palette, type scale, spacing rhythm, corner radii, and elevation conventions — nothing else. (Note: I don't have edit access to that file, so I couldn't pull its variables programmatically. Section 6 gives whoever *does* have edit access — likely you, in Figma's Dev Mode / variables panel — a 15-minute checklist to populate the token file for real. Until then, the placeholder tokens below are reasonable internal-tool defaults, not final brand values.)

---

## 0. Architect's Changelog — what changed and why

The three source docs disagree with each other in ways that would cause real bugs if built literally. Fixes below are load-bearing; everything else in this doc assumes them.

| # | Conflict found | Decision | Why |
|---|---|---|---|
| 1 | Spec says single assignee; as-built CMS already shipped multi-assignee (`TaskAssignee` join + legacy `assignedToId`) | **Keep multi-assignee.** Canonicalize `assignedToId` as "owner" (drives digest emails, "my tasks" default view), `TaskAssignee` as the full roster. | The as-built version is strictly more capable and already has UI (avatar stack) and server-side scoping built around it. Don't regress. |
| 2 | Spec: soft-delete Clients/Products only. As-built: **Tasks are hard-deleted**, but `ActivityLog` is "append-only, immutable, full audit trail." | **Soft-delete Tasks too** (`deletedAt`), same as Client/Product. Change `DELETE /api/tasks/:id` to a soft-delete. | This is a real bug, not a style choice: hard-deleting a `Task` while `ActivityLog` has a mandatory FK to it either (a) cascades and silently destroys the "immutable" audit trail, or (b) orphans rows and breaks referential integrity. You cannot have both "hard delete tasks" and "append-only audit log" — pick one. Soft-delete wins because auditability is an explicit NFR. |
| 3 | As-built uses `prisma db push`, no migration history | **Move to `prisma migrate`** with committed migration files from day one of this rebuild. | `db push` is fine for prototyping, not for a tool that's now handling real client/contract data. No migration history means no safe rollback and no reviewable schema diffs in PRs. |
| 4 | No `middleware.ts`; access control is per-route only | **Add a thin edge `middleware.ts`** for session-presence redirect (logged-out → `/login`), keep the real authorization decision in per-route `assertCan()` calls. | Middleware is UX/redirect convenience, never the security boundary — matches the spec's own stated philosophy. Missing it today just means logged-out users see a flash of a page shell before client-side redirect, which is sloppy, not insecure. Cheap fix. |
| 5 | Permission matrices disagree slightly: spec says Support can create tasks "support type only"; as-built allows Support to create any task type; spec says Support cannot view client management, as-built table shows Support **can** view Clients | **Canonical matrix in §2 below** — Support can view Clients/Products (needs context to log accurate tickets) but not edit them; Support-created tasks are restricted to `type: SUPPORT_REQUEST` server-side. | Splitting the difference in the direction that (a) matches what's already shipped where it's more useful, (b) closes the actual security gap (unrestricted task type creation by the least-privileged writing role). |
| 6 | `.env.example` promises email, file storage, and cron; none exist in as-built | **Explicitly phase these** (§9) instead of leaving them as dead promises. Phase 1.1, not "later, undefined." | Vague roadmap items rot. Given concrete scope now. |
| 7 | Known gaps: no client edit page (dead link), no product CRUD, no user deactivate/edit, seed script ships real-looking demo passwords | **All four are now in-scope, explicit backlog items with acceptance criteria** (§10). | These are the actual highest-leverage next steps for the team using this tool today — more valuable than any net-new feature. |
| 8 | No design-token/theming system exists; Tailwind + shadcn are used with default/ad-hoc values | **New §6: single-file token architecture** so brand colors, radii, spacing, and type can be changed in one place and propagate everywhere, including every shadcn/ui primitive. | This was the user's explicit ask — "change the whole file and it reflects on the full website in future." Solved properly below, not with scattered Tailwind classes. |

---

## 1. Product Overview

**What it is:** Internal-only tool for a team running white-labeled SaaS products across many clients. Tracks `Client → Product → Task`, who owns what, current status, and full history.

**Who uses it:** Company staff only — Admin, Manager, Developer, Support — plus leadership (CEO/execs) who need visibility into the same data. No client, contractor, or external party ever has an account. This is not "no client access for now" — it's a hard requirement: there is no client-facing surface anywhere in this build, no roadmap item to add one, and no public registration. Users are provisioned by an Admin only.

**Core object flow:**

```
Client (brand, domain, contract, status)
   └── Product (deployed instance: version, URL, repo, environment)
          └── Task (assignee(s), status, priority, type, due date, comments, activity log)
```

---

## 2. Roles & Canonical Permission Matrix

Four roles: `ADMIN`, `MANAGER`, `DEVELOPER`, `SUPPORT`. Enforced **server-side** in every API route via `assertCan(role, action, resource)` in `lib/permissions.ts` — this is the only source of truth. UI-level hiding of nav items/buttons is UX polish, never trusted for security.

| Action | Admin | Manager | Developer | Support |
|---|:---:|:---:|:---:|:---:|
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View clients & products | ✅ | ✅ | ❌ | ✅ (read-only) |
| Create / edit clients | ✅ | ✅ | ❌ | ❌ |
| Delete (soft) clients | ✅ | ❌ | ❌ | ❌ |
| Create / edit products | ✅ | ✅ | ❌ | ❌ |
| View tasks | ✅ all | ✅ all | own only¹ | ✅ all |
| Create tasks | ✅ any type | ✅ any type | ❌ | ✅ `SUPPORT_REQUEST` only² |
| Edit own assigned task (status, comment) | ✅ | ✅ | ✅ | ✅ |
| Edit any task / reassign | ✅ | ✅ | ❌ | ❌ |
| Delete (soft) tasks | ✅ | ❌ | ❌ | ❌ |
| View reports/dashboards (aggregate) | ✅ | ✅ | ❌ | ❌ |
| Manage users & roles | ✅ | ❌ | ❌ | ❌ |

¹ "own" = `assignedToId === self` OR `self ∈ TaskAssignee` for that task. Enforced in the `GET /api/tasks` query itself (a `WHERE` clause), never filtered client-side.
² Enforced server-side in the task-creation service, not just hidden in the create form — a Support user hitting the API directly with `type: "FEATURE"` gets a `403`.

### 2.1 CEO / leadership access

There's no separate "Executive" role in V1 — that would be a fifth role to build, test, and maintain for one or two people, for a tool where the underlying data (reports, dashboard, client list) is already fully visible to Admin and Manager. **Default: give the CEO an `ADMIN` account.** They get full visibility (dashboard, reports, every client/task) plus edit capability they likely won't use day-to-day, which is a reasonable trade for not building a whole new role.

If in practice the CEO account ends up being used to make changes that should really go through a Manager (reassigning tasks, editing client contracts) and that becomes a problem, the fix is cheap later: add `EXECUTIVE` to the `Role` enum, give it the same `can()` entries as `MANAGER` minus every mutation (view-only across clients/products/tasks/reports, zero create/edit/delete), and reassign the CEO's account to it — a config change, not a rebuild, since every check already runs through the single `can()` table in §2. Flagged as an open decision in §16 rather than built now, since it's not clear yet whether it's actually needed.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15, App Router | TypeScript strict mode, zero `any` in services/repositories |
| Database | PostgreSQL | |
| ORM | Prisma, `prisma migrate` (not `db push`) | Committed migrations from commit #1 |
| Auth | NextAuth v4/v5, credentials provider, JWT sessions | No OAuth for V1; role + id embedded in token |
| Validation | Zod on every mutating route, schemas in `lib/validators/` | |
| Styling | Tailwind v4 + shadcn/ui, driven entirely by CSS-variable design tokens (§6) | |
| State / data layer | Redux Toolkit + RTK Query | RTK Query owns all server data + caching (§14); plain slices only for client-only UI state |
| Branding / providers | Interface + registry plugin pattern (§6.7) | Branding, email, and storage are swappable modules, never hardcoded imports |
| Hosting | Vercel | Cron, previews, edge middleware |
| Testing | Vitest (unit/integration) + Playwright (E2E) | |

---

## 4. Data Model

### 4.1 Full Prisma Schema

```prisma
// ---------- Core entities ----------

model Client {
  id             String       @id @default(cuid())
  name           String
  logoUrl        String?
  domain         String?
  contractStart  DateTime?
  contractEnd    DateTime?
  status         ClientStatus @default(ONBOARDING)
  contactName    String?
  contactEmail   String?
  contactPhone   String?
  notes          String?
  deletedAt      DateTime?    // soft delete
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  products       Product[]

  @@index([status])
  @@index([deletedAt])
}

model Product {
  id           String      @id @default(cuid())
  clientId     String
  client       Client      @relation(fields: [clientId], references: [id])
  name         String
  version      String?
  deployedUrl  String?
  repoUrl      String?
  environment  Environment @default(PRODUCTION)
  lastDeployed DateTime?
  deletedAt    DateTime?   // soft delete — was missing in as-built (products had no CRUD at all)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  tasks        Task[]

  @@index([clientId])
  @@index([deletedAt])
}

model Task {
  id            String        @id @default(cuid())
  productId     String
  product       Product       @relation(fields: [productId], references: [id])
  title         String
  description   String?       // markdown
  status        TaskStatus    @default(BACKLOG)
  priority      Priority      @default(MEDIUM)
  type          TaskType
  dueDate       DateTime?
  blockedReason String?
  deletedAt     DateTime?     // soft delete — CHANGED from as-built hard-delete; see Changelog #2

  // Legacy single "owner" field — drives default "my tasks" view + digest grouping.
  assignedToId  String?
  assignedTo    User?         @relation("AssignedTasks", fields: [assignedToId], references: [id])

  createdById   String
  createdBy     User          @relation("CreatedTasks", fields: [createdById], references: [id])
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  assignees     TaskAssignee[]  // full roster, canonicalized from as-built
  comments      Comment[]
  attachments   Attachment[]
  activityLogs  ActivityLog[]
  watchers      TaskWatcher[]

  @@index([productId])
  @@index([assignedToId])
  @@index([status, priority])
  @@index([dueDate])
  @@index([deletedAt])
}

model TaskAssignee {
  taskId String
  userId String
  task   Task @relation(fields: [taskId], references: [id])
  user   User @relation(fields: [userId], references: [id])

  @@id([taskId, userId])
}

// ---------- Users & access ----------

model User {
  id                String   @id @default(cuid())
  name              String
  email             String   @unique
  passwordHash      String?
  role              Role     @default(DEVELOPER)
  active            Boolean  @default(true)
  mustChangePassword Boolean @default(true) // NEW — forces reset on first login for Admin-created accounts
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  assignedTasks     Task[]         @relation("AssignedTasks")
  createdTasks      Task[]         @relation("CreatedTasks")
  taskAssignments   TaskAssignee[]
  comments          Comment[]
  activityLogs      ActivityLog[]
  watching          TaskWatcher[]
}

// ---------- Collaboration ----------

model Comment {
  id         String    @id @default(cuid())
  taskId     String
  task       Task      @relation(fields: [taskId], references: [id])
  authorId   String
  author     User      @relation(fields: [authorId], references: [id])
  body       String    // markdown
  createdAt  DateTime  @default(now())
  editedAt   DateTime?

  @@index([taskId])
}

model Attachment {
  id         String   @id @default(cuid())
  taskId     String
  task       Task     @relation(fields: [taskId], references: [id])
  fileName   String
  fileUrl    String
  fileSize   Int
  uploadedAt DateTime @default(now())
}

model TaskWatcher {
  taskId String
  userId String
  task   Task @relation(fields: [taskId], references: [id])
  user   User @relation(fields: [userId], references: [id])

  @@id([taskId, userId])
}

// ---------- Audit ----------

model ActivityLog {
  id        String    @id @default(cuid())
  taskId    String
  task      Task      @relation(fields: [taskId], references: [id])
  actorId   String
  actor     User      @relation(fields: [actorId], references: [id])
  action    LogAction
  field     String?   // e.g. "status", "assignedTo"
  oldValue  String?
  newValue  String?
  createdAt DateTime  @default(now())

  @@index([taskId])
}

// ---------- Enums ----------

enum ClientStatus { ACTIVE ONBOARDING PAUSED CHURNED }
enum Environment  { PRODUCTION STAGING DEVELOPMENT }
enum TaskStatus   { BACKLOG TODO IN_PROGRESS IN_REVIEW BLOCKED DONE }
enum Priority     { LOW MEDIUM HIGH CRITICAL }
enum TaskType     { FEATURE BUG SUPPORT_REQUEST CUSTOMIZATION DEPLOYMENT MAINTENANCE }
enum Role         { ADMIN MANAGER DEVELOPER SUPPORT }
enum LogAction    { CREATED STATUS_CHANGED REASSIGNED COMMENTED FIELD_EDITED ATTACHMENT_ADDED DELETED RESTORED }
```

**Rules that must hold, and must be tested:**
- All list queries filter `deletedAt: null` by default; no query returns soft-deleted rows unless explicitly asked (`?includeDeleted=true`, Admin-only).
- `ActivityLog` has no `PATCH`/`DELETE` route, full stop.
- Deleting a `Client` soft-deletes it and cascades a soft-delete to its `Product`s and their `Task`s in one transaction (so a churned client's history stays queryable but off every active list).
- An orphaned `Task` (product deleted, task not) is disallowed — enforced by the cascade above, not by an application-level check that can be forgotten.

---

## 5. API Surface

REST-style, all under `/api`, all requiring a session unless noted. Every mutating route validates its body with Zod before touching the service layer. Every list endpoint supports `page`, `pageSize`, `sortBy`, `sortDir`.

Standard error shape: `{ error: { code, message, fields? } }` — 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 500 server.

| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/api/clients` | List (paginated, filterable by status/name/domain/contact) | Admin, Manager, Support (read-only) |
| `POST` | `/api/clients` | Create | Admin, Manager |
| `GET` | `/api/clients/:id` | Profile + products | Admin, Manager, Support (read-only) |
| `PATCH` | `/api/clients/:id` | Update — **NEW, closes the dead-link gap** | Admin, Manager |
| `DELETE` | `/api/clients/:id` | Soft-delete, cascades to products/tasks | Admin |
| `GET` | `/api/products?clientId=` | List for a client | Admin, Manager, Support (read-only) |
| `POST` | `/api/products` | Create — **NEW, closes the "seed-only" gap** | Admin, Manager |
| `PATCH` | `/api/products/:id` | Update | Admin, Manager |
| `DELETE` | `/api/products/:id` | Soft-delete, cascades to tasks | Admin |
| `GET` | `/api/tasks` | List, server-scoped by role (filter: client, product, status, priority, assignee, type, due range, text) | All (scoped) |
| `POST` | `/api/tasks` | Create; Support restricted to `SUPPORT_REQUEST` server-side | Admin, Manager, Support |
| `GET` | `/api/tasks/:id` | Detail (comments, attachments, activity log) | All (scoped) |
| `PATCH` | `/api/tasks/:id` | Update fields/status | Admin, Manager, assignee |
| `PATCH` | `/api/tasks/:id/assign` | Reassign / edit roster | Admin, Manager |
| `DELETE` | `/api/tasks/:id` | **Soft**-delete — **CHANGED, see Changelog #2** | Admin |
| `POST` | `/api/tasks/:id/comments` | Add comment (+ `COMMENTED` activity entry, one transaction) | All (scoped) |
| `POST` | `/api/tasks/:id/attachments` | Signed upload URL, then attach — **Phase 1.1, see §9** | All (scoped) |
| `GET` | `/api/tasks/:id/activity` | Full activity log | All (scoped) |
| `GET` | `/api/users` | List staff | Admin |
| `POST` | `/api/users` | Invite/create (forces `mustChangePassword: true`) | Admin |
| `PATCH` | `/api/users/:id` | Edit name/role, **deactivate/reactivate** — **NEW, closes the "no edit flow" gap** | Admin |
| `GET` | `/api/reports/client/:id` | Per-client completion report | Admin, Manager |
| `GET` | `/api/reports/workload` | Team workload view | Admin, Manager |
| `POST` | `/api/cron/overdue-digest` | Vercel Cron trigger — Phase 1.1, see §9 | Internal (`CRON_SECRET` header) |
| `*` | `/api/auth/[...nextauth]` | Session handling | Public |

Deactivating a user (`active: false`) never deletes their `assignedTasks` — those remain visible with a "needs reassignment" badge wherever the owner is inactive (matches the original spec's own acceptance criterion, which the as-built version hadn't implemented yet).

---

## 6. Design System & Theming — single-file token architecture

**Goal stated by the team:** change one file, have it reflect across the entire site, forever — no hunting through components for hardcoded hex values.

The Figma file linked is treated strictly as a **design-language reference**: palette family, type pairing, spacing rhythm, corner-radius convention, elevation/shadow style. It is not wired into the build automatically (view-only access), so populate the primitives below by hand from Figma's Dev Mode / variables panel — that's a 15-minute task for whoever has edit access, not a rebuild.

### 6.1 Three-layer token model

```
tokens/primitives.json   →  raw values, no meaning attached (color-blue-500, space-4, radius-md)
        ↓ (generated)
src/styles/tokens.css    →  CSS custom properties, semantic layer (--brand-primary, --surface-elevated)
        ↓ (referenced)
tailwind.config.ts       →  Tailwind theme extended with var(--token), never raw hex
        ↓ (consumed)
shadcn/ui components     →  already read --background, --primary, --border, etc. — zero component edits needed
```

**Why three layers and not just "put colors in Tailwind config":** primitives (`blue-500`) are brand palette facts; semantic tokens (`brand-primary`, `danger`, `surface-elevated`) are *decisions* about what role each primitive plays, and decisions are what change over time (a rebrand swaps semantic mappings, not primitive names). Components should never reference a primitive directly — only semantic tokens — so a rebrand is a one-file edit in `tokens.css`, nothing in `.tsx` files ever changes.

### 6.2 `tokens/primitives.json` — source of truth, edit this first

```json
{
  "color": {
    "neutral": { "0": "#FFFFFF", "50": "#F7F8FA", "100": "#EEF0F3", "300": "#C7CCD4",
                 "500": "#8A9099", "700": "#4A4F58", "900": "#1C1E22" },
    "brand":   { "500": "#2F6FED", "600": "#255ACB", "700": "#1D4699" },
    "success": { "500": "#1F9D55" },
    "warning": { "500": "#D97706" },
    "danger":  { "500": "#DC2626" }
  },
  "radius":  { "sm": "6px", "md": "10px", "lg": "16px", "full": "9999px" },
  "space":   { "1": "4px", "2": "8px", "3": "12px", "4": "16px", "6": "24px", "8": "32px", "12": "48px" },
  "font": {
    "family": { "display": "\"General Sans\", sans-serif", "body": "\"Inter\", sans-serif", "mono": "\"JetBrains Mono\", monospace" },
    "size":   { "xs": "12px", "sm": "13px", "md": "14px", "lg": "16px", "xl": "20px", "2xl": "28px" }
  },
  "shadow": { "sm": "0 1px 2px rgba(16,24,40,0.06)", "md": "0 4px 8px rgba(16,24,40,0.08)" }
}
```

> Replace the placeholder hex values in `color` with the real ones from the Figma file's variables/styles panel. Everything downstream regenerates from this file — don't hand-edit `tokens.css` directly, it's generated.

### 6.3 Generation script — `scripts/build-tokens.mjs`

A ~40-line Node script (no dependency on Style Dictionary needed for a set this small) that reads `primitives.json` and writes `src/styles/tokens.css`, mapping semantic roles to primitives and emitting both a light and dark block:

```css
/* AUTO-GENERATED by scripts/build-tokens.mjs — do not hand-edit */
:root {
  --background:      var(--color-neutral-0);
  --foreground:       var(--color-neutral-900);
  --surface-elevated: var(--color-neutral-50);
  --border:           var(--color-neutral-100);
  --primary:          var(--color-brand-500);
  --primary-hover:    var(--color-brand-600);
  --primary-foreground: var(--color-neutral-0);
  --destructive:      var(--color-danger-500);
  --success:          var(--color-success-500);
  --warning:           var(--color-warning-500);
  --radius:            var(--radius-md);
}
[data-theme="dark"] {
  --background:      var(--color-neutral-900);
  --foreground:       var(--color-neutral-0);
  --surface-elevated: var(--color-neutral-700);
  --border:           var(--color-neutral-700);
  /* brand/destructive/success usually stay identical across themes — only surfaces/text invert */
}
```

Run `npm run build:tokens` as a `pre-dev` / `pre-build` npm script, so it's always regenerated from `primitives.json` and never drifts.

### 6.4 Wiring into Tailwind + shadcn

`tailwind.config.ts` maps every color/radius/font Tailwind uses back to the CSS variables (never a literal hex):

```ts
theme: {
  extend: {
    colors: {
      background: "var(--background)",
      foreground: "var(--foreground)",
      primary: { DEFAULT: "var(--primary)", hover: "var(--primary-hover)", foreground: "var(--primary-foreground)" },
      destructive: "var(--destructive)",
      success: "var(--success)",
      warning: "var(--warning)",
      border: "var(--border)",
    },
    borderRadius: { DEFAULT: "var(--radius)" },
    fontFamily: { display: "var(--font-display)", body: "var(--font-body)" },
  },
}
```

shadcn/ui's generated components (`components/ui/*`) already reference `bg-primary`, `text-foreground`, `border-border`, etc. by convention — **do not touch generated component files to theme them.** The instant `tokens.css` regenerates from a new `primitives.json`, every button, card, badge, and input across the whole app updates with zero component-level changes. This is exactly the "change one file, it reflects everywhere" behavior requested.

### 6.5 Dark mode / future per-client branding

`next-themes` toggles `data-theme="dark"` on `<html>`. Because this is internal-only — there is no client-facing surface, now or planned — that's the only theme axis for V1. The three-layer structure is still future-proofed for a legitimate internal need: if a specific internal department or acquired sub-team ever needs its own look on this same internal tool, that's a fourth JSON file (`tokens/overrides/{teamId}.json`) merged over the primitives at build or request time — no architecture change required, just a new leaf file. This is explicitly not a mechanism for exposing anything to a client.

### 6.6 Governance rule (put this in the repo's `CONTRIBUTING.md`)

No hex codes, no raw `px` spacing, no inline `style={{color: '...'}}` anywhere outside `tokens/primitives.json`. Lint this with a small ESLint rule (`no-restricted-syntax` on hex-literal JSXAttribute values) so it's enforced, not just requested.

### 6.7 Branding as a plugin, not a build-time constant

The token pipeline in §6.1–6.4 makes *values* swappable. This section makes the *whole branding bundle* swappable — logo, favicon, product name, font files, and the primitives file itself — as a drop-in module, so re-skinning the internal tool (e.g. if the company rebrands, or a specific internal team wants its own look on the same tool — never a client, per §1) is "add a folder + flip an env var," never a code change.

**Contract every branding module implements** (`plugins/branding/types.ts`):

```ts
export interface BrandingPlugin {
  id: string;                 // "zsyio-default"
  displayName: string;        // shown in <title>, email footers
  primitives: TokenPrimitives; // same shape as tokens/primitives.json §6.2
  logo: { light: string; dark: string; favicon: string };
  fonts?: { display?: string; body?: string }; // font file paths, optional override
}
```

**Registry** (`plugins/branding/registry.ts`) — a plain object map, no dynamic filesystem magic:

```ts
import zsyioDefault from "./zsyio-default";
// import a future brand the same way: import acmeBrand from "./acme";

export const brandingRegistry: Record<string, BrandingPlugin> = {
  "zsyio-default": zsyioDefault,
  // "acme": acmeBrand,
};

export function getActiveBranding(): BrandingPlugin {
  const id = process.env.ACTIVE_BRAND ?? "zsyio-default";
  return brandingRegistry[id] ?? brandingRegistry["zsyio-default"];
}
```

`scripts/build-tokens.mjs` (§6.3) reads `getActiveBranding().primitives` instead of a hardcoded path, so switching `ACTIVE_BRAND` in `.env` and rerunning `npm run build:tokens` re-skins colors, logo, and fonts everywhere in one step — no component touches anything branding-specific directly; everything goes through tokens + a single `<Logo />` component that reads `getActiveBranding().logo`.

**Same pattern for the two other swappable-by-design integrations already flagged in §9 (Phase 1.1):**

```ts
// lib/providers/types.ts
export interface EmailProvider { send(to: string, subject: string, body: string): Promise<void>; }
export interface StorageProvider { getUploadUrl(fileName: string, size: number): Promise<{ url: string; fileUrl: string }>; }
```

`lib/providers/email/resend.ts`, `lib/providers/email/sendgrid.ts`, `lib/providers/storage/vercel-blob.ts`, `lib/providers/storage/s3.ts` each implement the interface; `lib/providers/index.ts` picks the active one off an env var the same way branding does. Swapping Vercel Blob for S3 later is a new file + one env var, not a refactor of every route that uploads a file.

**Rule:** nothing outside `plugins/` or `lib/providers/` ever imports a specific brand or a specific provider by name. Business logic depends on the *interface*, the registry resolves the *implementation*. This is the actual mechanism behind "change one thing, it reflects everywhere" — the token system handles values, this handles whole swappable modules.

---

## 7. Auth & Security

- NextAuth, credentials provider, bcrypt (cost 12), JWT session with `role`/`id` embedded.
- `lib/auth.ts` → `getCurrentUser()`; `lib/permissions.ts` → `can()`/`assertCan()` matching §2 exactly.
- Thin `middleware.ts`: redirect to `/login` if no session cookie. **Not** a substitute for per-route `assertCan()` — every mutating and every scoped-list route calls it server-side before touching Prisma.
- CSRF protection on mutations (NextAuth handles this by default for its own routes; custom mutation routes should require the session cookie + same-site enforcement, not rely on a bearer token in a header alone).
- Since this holds real client contract/contact data, treat it above "just an internal tool" bar: httpOnly secure cookies, `NEXTAUTH_SECRET` rotated per environment, seeded demo credentials **must** be rotated before any shared use — enforce via `mustChangePassword: true` on every Admin-created account (see schema §4.1), not a README warning nobody reads.
- Recommend, for real deployment: restrict at the edge too — Vercel deployment password/IP allowlist, or gate NextAuth sign-in to the company email domain, so an exposed login page isn't the only line of defense.

---

## 8. Folder Structure

Full tree, nothing collapsed — every path below is a real file or folder the build should produce, not a shorthand. Rationale and placement rules follow in §8.2.

```
zsyio/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # lint → typecheck → unit → integration → build
│       └── e2e.yml                         # runs Playwright against the preview deploy
├── .husky/
│   └── pre-commit                          # lint-staged: eslint + prettier on staged files
├── docs/
│   ├── zsyio-build-spec-v2.md           # this file — kept in-repo, not just in chat
│   ├── adr/                                # Architecture Decision Records, one file per real decision
│   │   ├── 0001-soft-delete-tasks.md
│   │   ├── 0002-plugin-pattern-for-branding-and-providers.md
│   │   └── 0003-rtk-query-over-rest-hooks.md
│   └── runbooks/
│       └── rotate-seed-credentials.md
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                             # single Admin + 2–3 sample clients/products/tasks
│   └── migrations/                         # committed history — no `db push` (Changelog #3)
│       └── <timestamp>_init/migration.sql
├── tokens/
│   └── primitives.json                     # §6.2 — the one file that drives the whole visual system
├── plugins/
│   └── branding/
│       ├── types.ts                        # §6.7 — BrandingPlugin contract
│       ├── registry.ts                     # ACTIVE_BRAND → implementation lookup
│       └── zsyio-default/
│           ├── index.ts                    # implements BrandingPlugin
│           ├── primitives.json             # this brand's copy of §6.2's shape
│           ├── logo-light.svg
│           ├── logo-dark.svg
│           ├── favicon.svg
│           └── README.md                   # §15 — what this brand overrides, and why
├── scripts/
│   ├── build-tokens.mjs                    # §6.3 — reads active brand's primitives.json → tokens.css
│   └── check-no-raw-colors.mjs             # §6.6 lint check, run in CI
├── public/
│   └── fonts/                              # self-hosted font files referenced by tokens.css
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # root layout — wraps ReduxProvider, ThemeProvider, Toaster
│   │   ├── globals.css                     # imports src/styles/tokens.css, Tailwind base/components/utilities
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       ├── page.tsx
│   │   │       └── login-form.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                  # sidebar + topbar shell, role-aware nav
│   │   │   ├── page.tsx                    # dashboard home — KPI cards, workload chart
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx                # Client Directory
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [clientId]/
│   │   │   │       ├── page.tsx            # Client Profile
│   │   │   │       └── edit/page.tsx       # NEW — closes the dead-link gap
│   │   │   ├── products/
│   │   │   │   └── [productId]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx                # Kanban/Table toggle board
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [taskId]/page.tsx       # Task Detail panel
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── users/
│   │   │           ├── page.tsx            # user list + invite
│   │   │           └── [userId]/page.tsx   # NEW — edit role / deactivate
│   │   └── api/
│   │       ├── clients/
│   │       │   ├── route.ts                # GET list, POST create
│   │       │   └── [id]/route.ts           # GET, PATCH, DELETE (soft)
│   │       ├── products/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── tasks/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── assign/route.ts
│   │       │       ├── comments/route.ts
│   │       │       ├── attachments/route.ts   # Phase 1.1
│   │       │       └── activity/route.ts
│   │       ├── users/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts           # NEW — PATCH role/active
│   │       ├── reports/
│   │       │   ├── client/[id]/route.ts
│   │       │   └── workload/route.ts
│   │       ├── cron/
│   │       │   └── overdue-digest/route.ts # CRON_SECRET-guarded
│   │       └── auth/
│   │           └── [...nextauth]/route.ts
│   ├── components/
│   │   ├── ui/                             # shadcn/ui primitives — generated, don't hand-theme (§6.4)
│   │   ├── shared/
│   │   │   ├── Logo.tsx                    # reads getActiveBranding().logo — §6.7
│   │   │   ├── DataTable.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── RoleGate.tsx                # UI-only visibility helper — never the security boundary
│   │   ├── clients/
│   │   │   ├── ClientTable.tsx
│   │   │   ├── ClientForm.tsx              # shared by new/ and edit/
│   │   │   └── ClientStatusBadge.tsx
│   │   ├── products/
│   │   │   ├── ProductForm.tsx
│   │   │   └── ProductCard.tsx
│   │   └── tasks/
│   │       ├── KanbanBoard.tsx
│   │       ├── KanbanColumn.tsx
│   │       ├── TaskCard.tsx
│   │       ├── TaskTable.tsx
│   │       ├── TaskDetailPanel.tsx
│   │       ├── CommentThread.tsx
│   │       ├── ActivityTimeline.tsx
│   │       └── TaskFiltersBar.tsx
│   ├── lib/
│   │   ├── prisma.ts                       # singleton client
│   │   ├── auth.ts                         # NextAuth config, getCurrentUser()
│   │   ├── permissions.ts                  # can() / assertCan() — §2's matrix, source of truth
│   │   ├── validators/
│   │   │   ├── client.schema.ts
│   │   │   ├── product.schema.ts
│   │   │   ├── task.schema.ts
│   │   │   └── user.schema.ts
│   │   ├── email.ts                        # thin wrapper calling the active EmailProvider
│   │   └── providers/
│   │       ├── types.ts                    # EmailProvider / StorageProvider contracts — §6.7
│   │       ├── index.ts                    # env-driven resolver, same pattern as branding registry
│   │       ├── email/
│   │       │   ├── resend.ts
│   │       │   └── console-logger.ts       # local-dev default — no real provider needed to run the app
│   │       └── storage/
│   │           ├── vercel-blob.ts
│   │           └── local-disk.ts           # local-dev default
│   ├── server/
│   │   ├── services/                       # business logic — the only layer allowed to call permissions.ts
│   │   │   ├── client.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── task.service.ts             # status-transition rules, soft-delete + cascade logic
│   │   │   └── user.service.ts
│   │   └── repositories/                   # Prisma query layer — the only layer allowed to import prisma.ts
│   │       ├── client.repository.ts
│   │       ├── product.repository.ts
│   │       ├── task.repository.ts
│   │       └── user.repository.ts
│   ├── store/                              # §14 — Redux Toolkit + RTK Query
│   │   ├── index.ts                        # configureStore
│   │   ├── provider.tsx                    # <ReduxProvider> client component wrapping app/layout.tsx
│   │   ├── hooks.ts                        # typed useAppDispatch / useAppSelector
│   │   ├── api/
│   │   │   ├── baseApi.ts                  # shared fetchBaseQuery + 401/403 interceptor
│   │   │   ├── clientsApi.ts
│   │   │   ├── productsApi.ts
│   │   │   ├── tasksApi.ts
│   │   │   ├── usersApi.ts
│   │   │   └── reportsApi.ts
│   │   └── slices/
│   │       ├── uiSlice.ts                  # modals, toasts, sidebar collapsed
│   │       ├── filtersSlice.ts             # task board filters — persisted, not server data
│   │       └── boardViewSlice.ts           # "kanban" | "table"
│   ├── styles/
│   │   └── tokens.css                      # generated by scripts/build-tokens.mjs — never hand-edited
│   ├── types/
│   │   ├── index.ts                        # shared cross-cutting types
│   │   └── next-auth.d.ts                  # session/JWT type augmentation (role, id on session.user)
│   └── middleware.ts                       # session-presence redirect only — §7
├── tests/
│   ├── unit/
│   │   ├── permissions.test.ts
│   │   └── task-status-transitions.test.ts
│   ├── integration/
│   │   ├── clients.api.test.ts
│   │   ├── tasks.api.test.ts
│   │   └── users.api.test.ts
│   └── e2e/
│       └── core-flow.spec.ts               # login → client → product → task → drag → activity log
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 8.2 Placement rules (what goes where, so this doesn't drift)

- **`app/api/**/route.ts` stays thin.** A route handler does exactly three things: parse/validate the request with a Zod schema from `lib/validators/`, call one function in `server/services/`, and shape the response. If a route file has a Prisma import or an `if (role === ...)` check in it, that logic is in the wrong layer — move it to `server/services/` and `lib/permissions.ts` respectively.
- **`server/services/` is the only layer that calls `assertCan()`.** Repositories don't know about roles; they just query. This keeps authorization checkable in one place per action, matching §2's matrix one-to-one.
- **`server/repositories/` is the only layer that imports `lib/prisma.ts`.** No API route, no service, no component ever writes a raw Prisma query outside a repository — this is what makes "add a soft-delete filter to every list query" a one-file change instead of a grep-and-pray across the codebase.
- **A component only talks to the server through `store/api/*Api.ts` hooks** (§14), never through a bare `fetch` in a `useEffect`. If you're reaching for `useEffect` + `fetch`, the correct fix is adding an RTK Query endpoint, not writing the effect.
- **`components/tasks/`, `components/clients/`, `components/products/` are feature-scoped** — a component only lives in `components/ui/` or `components/shared/` if at least two different feature folders use it unmodified. One-off variants stay local to their feature folder; don't prematurely generalize into `shared/`.
- **Nothing outside `plugins/` and `lib/providers/` imports a specific brand or provider by name** (§6.7/§15) — always through the registry.
- **New Prisma fields ship with a migration in the same PR**, never a schema-only change waiting for someone to remember to run `migrate dev` later.
- **Tests live in `tests/`, mirroring the source path they cover** (`tests/unit/permissions.test.ts` tests `src/lib/permissions.ts`), so the pairing is discoverable without a mapping file.

---

## 9. Phasing (closes the "vague roadmap" gap from Changelog #6)

**V1 — this build:**
- Everything in §5's API surface except the cron route's actual email send
- Client/Product full CRUD (incl. the missing edit pages)
- User edit/deactivate flow
- Soft-delete on Task, migration history, token architecture
- Kanban + table task board, comments, activity log, dashboard, reports

**Phase 1.1 — immediately after V1 ships, same repo:**
- Real email sending for the overdue digest (`EMAIL_PROVIDER_API_KEY`) — the cron route and query logic exist in V1, wired to a no-op logger; swapping in a provider is a one-file change in `lib/email.ts`
- File attachments (`STORAGE_PROVIDER_*`) — schema and UI slot already exist, add the signed-upload endpoint

**Phase 2 — roadmap, not this build:**
- Slack notifications, SLA tracking/escalation, per-client export, time tracking, custom fields, internal webhooks

---

## 10. Backlog carried over from as-built gaps (now in-scope, with acceptance criteria)

| Gap | Acceptance criteria |
|---|---|
| Client edit page | `/clients/[id]/edit` exists, `PATCH /api/clients/:id` works, dead link resolved |
| Product CRUD | Admin/Manager can create/edit/soft-delete a Product from the Client Profile page, not just via seed |
| User edit/deactivate | Admin can change a user's role, deactivate/reactivate; deactivated user's tasks stay visible with a "needs reassignment" flag |
| Seed credential hygiene | Seeded Admin has `mustChangePassword: true`; app blocks any authenticated action until password is changed |
| Task soft-delete | `DELETE /api/tasks/:id` sets `deletedAt`; soft-deleted tasks excluded from all default queries; `ActivityLog` entries for that task remain intact and queryable by Admin |

---

## 11. Testing Strategy

| Layer | Tooling | Must cover |
|---|---|---|
| Unit | Vitest | `permissions.ts` (every cell in §2's matrix), status-transition rules, digest grouping logic |
| Integration | Vitest + Docker Postgres | Client/Product/Task/User API routes end-to-end, including 403s for role violations and the Support task-type restriction |
| E2E | Playwright | Login → create client → create product → create task → drag across board → confirm activity log entry → edit client (new) → deactivate a user (new) |
| Type safety | `tsc --noEmit` in CI | Zero `any` in `server/` |
| Lint | ESLint + Prettier, Husky pre-commit | Includes the no-raw-hex-color rule from §6.6 |

---

## 12. Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname

NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=

EMAIL_FROM=notifications@your-domain.com
EMAIL_PROVIDER_API_KEY=          # Phase 1.1

STORAGE_PROVIDER_URL=            # Phase 1.1
STORAGE_PROVIDER_ACCESS_KEY=
STORAGE_PROVIDER_SECRET_KEY=
STORAGE_BUCKET_NAME=

CRON_SECRET=                      # verifies requests to /api/cron/*
```

---

## 13. Acceptance Criteria (V1)

- [ ] A Manager can create a Client, add a Product to it, and create a Task against that Product in under 5 clicks
- [ ] A Manager can edit an existing Client and Product (no dead links)
- [ ] A Developer only ever sees tasks where they're the owner or on the assignee roster
- [ ] A Support user can create a task and it's forced to `type: SUPPORT_REQUEST` even if the client sends a different type
- [ ] Reassigning a task logs an activity entry and updates within 5 seconds, no page refresh
- [ ] Dragging a task on the Kanban board persists and is reflected in Table view without refresh
- [ ] Deleting a Task soft-deletes it; its ActivityLog rows are still visible to an Admin
- [ ] An Admin can deactivate a user; that user's tasks remain visible, flagged as needing reassignment
- [ ] An Admin can edit a user's role
- [ ] A Support user cannot see client-management edit controls or the Reports page; hitting those API routes directly returns 403
- [ ] Changing a single value in `tokens/primitives.json` and running `npm run build:tokens` visibly changes color/radius across at least three different pages without touching any component file
- [ ] Schema changes are tracked via `prisma migrate`, with a committed migration history in the repo

---

## 14. State Management & API Layer — Redux Toolkit + RTK Query

**Principle that drives everything below:** there are two kinds of state, and they must not be mixed. *Server state* (clients, products, tasks, users, reports — anything that lives in Postgres) has one source of truth: the database, reached through the API. *Client/UI state* (which board view is active, which filters are checked, is a modal open) has no server backing at all. Redux Toolkit handles the second; RTK Query — built on top of Redux Toolkit, so this is still "using Redux" — handles the first. Never duplicate server data into a hand-written slice; that's the #1 way this kind of app rots (stale cache, "why did the board not update," two sources of truth disagreeing).

### 14.1 Store shape

```ts
// src/store/index.ts
export const store = configureStore({
  reducer: {
    ui: uiReducer,               // sidebar collapsed, active modal, toast queue
    filters: filtersReducer,     // task board filters — persisted to localStorage, not the server
    boardView: boardViewReducer, // "kanban" | "table" toggle
    [clientsApi.reducerPath]: clientsApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(
    clientsApi.middleware, productsApi.middleware, tasksApi.middleware,
    usersApi.middleware, reportsApi.middleware,
  ),
});
```

`filters` and `boardView` are the only slices worth persisting client-side (`redux-persist`, localStorage) — they're preferences, not data. `ui` is ephemeral and resets on reload by design.

### 14.2 One base query, not five copy-pasted fetch wrappers

```ts
// src/store/api/baseApi.ts
const rawBaseQuery = fetchBaseQuery({ baseUrl: "/api", credentials: "include" });

const baseQueryWithErrorHandling: BaseQueryFn = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    window.location.href = "/login"; // session expired — single place this is handled
  }
  if (result.error?.status === 403) {
    store.dispatch(uiSlice.actions.showToast({ type: "error", message: "You don't have permission to do that." }));
  }
  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Client", "Product", "Task", "User", "Report"],
  endpoints: () => ({}), // each resource injects its own endpoints — see 14.3
});
```

Every domain API (`clientsApi`, `tasksApi`, ...) uses `baseApi.injectEndpoints(...)` rather than calling `createApi` again — one shared cache, one shared 401/403 interceptor, no route ever hand-rolls its own `fetch`.

### 14.3 Example resource slice — `tasksApi.ts`

```ts
export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTasks: build.query<Task[], TaskFilters>({
      query: (filters) => ({ url: "/tasks", params: filters }),
      providesTags: (result) => result
        ? [...result.map((t) => ({ type: "Task" as const, id: t.id })), { type: "Task", id: "LIST" }]
        : [{ type: "Task", id: "LIST" }],
    }),
    updateTaskStatus: build.mutation<Task, { id: string; status: TaskStatus }>({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: "PATCH", body }),
      // Optimistic update — this is *why* RTK Query over plain fetch for the Kanban board:
      // the card moves instantly on drag, then rolls back automatically if the PATCH 403s/fails.
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(tasksApi.util.updateQueryData("getTasks", undefined, (draft) => {
          const task = draft.find((t) => t.id === id);
          if (task) task.status = status;
        }));
        try { await queryFulfilled; } catch { patch.undo(); }
      },
      invalidatesTags: (r, e, { id }) => [{ type: "Task", id }, { type: "Task", id: "LIST" }],
    }),
  }),
});
export const { useGetTasksQuery, useUpdateTaskStatusMutation } = tasksApi;
```

Components call `useGetTasksQuery(filters)` and `useUpdateTaskStatusMutation()` — no component ever imports `fetch`, `axios`, or constructs a URL by hand. This is also what makes the acceptance criterion in §13 ("dragging a task persists and reflects in Table view without refresh") close to free: both views subscribe to the same `getTasks` cache entry, so a mutation from the Kanban board updates the Table view automatically via tag invalidation.

### 14.4 What does *not* go in Redux

Form-in-progress state (React Hook Form + Zod resolver, local to the component), anything derivable from a render (don't store `isTaskOverdue` — compute it from `dueDate` at render time), and anything RTK Query already caches. If you find yourself dispatching an action to store data that also has a `getX` query for it, that's the duplication this section exists to prevent — delete the slice, read the query cache instead.

---

## 15. Maintainability & Plugin Governance

This section is what keeps §6.7 (branding/provider plugins) and §14 (Redux/RTK Query) from decaying as the team and the codebase grow.

- **Interface stability over convenience.** `BrandingPlugin`, `EmailProvider`, `StorageProvider` (§6.7) are contracts. Adding a field to one is a breaking change to every implementation — treat it like a public API, bump a comment-noted version, update every file under `plugins/` and `lib/providers/` in the same PR, never partially.
- **One plugin, one folder, one README.** Every `plugins/branding/<name>/` folder gets its own `README.md` stating what it overrides and why it exists — a rebrand six months from now shouldn't require reverse-engineering which brand is "the real one" from git history.
- **No cross-imports between plugin implementations.** `plugins/branding/acme/` must never import from `plugins/branding/zsyio-default/`. If two brands need to share something, that shared thing belongs in `types.ts` or a `shared/` helper, not in one plugin depending on another.
- **RTK Query tags are the contract between the API layer and every screen.** When adding a new mutation, ask "what should re-fetch after this succeeds" and encode it in `invalidatesTags` — don't add a manual `refetch()` call in a component as a workaround; that's a sign a tag is missing.
- **Dependency & migration hygiene:** `prisma migrate diff` reviewed in every PR that touches `schema.prisma`; a quarterly pass to update Next.js/Prisma/RTK Query minor versions rather than letting them drift years behind; CI blocks merge on `tsc --noEmit` and the ESLint hex-literal rule from §6.6, not just on tests passing.
- **New engineers' first PR should be a plugin, not a core-file edit.** If onboarding requires touching `server/services/` or `store/api/` to make a routine change (new brand, new email provider), that's a sign the plugin boundary in §6.7 isn't actually being respected — treat it as a bug in the architecture, not in the new engineer.

---

## 16. Open Decisions (unresolved, flag to the team before or during build)

- Digest timing: one fixed UTC send time, or per-client timezone? (V1 default: fixed UTC 08:00, revisit in Phase 1.1)
- File storage provider: Vercel Blob vs S3 — depends on expected attachment volume, decide before Phase 1.1
- Should Support see Product deployment URLs/repo, or just Client + Task layer? (Current default: read-only visibility into both, since accurate support tickets need product context — revisit if that turns out to leak more than intended)
- Real design tokens: pending someone with Figma edit access exporting the actual palette/type/spacing values into `tokens/primitives.json` (§6.2 placeholders are internal-tool defaults, not final brand)
