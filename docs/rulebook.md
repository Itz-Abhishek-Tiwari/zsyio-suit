# 📘 Zsyio PMS — Official Rule Book & System Architecture

**Version:** 2.0  
**Application:** Zsyio Internal Product Management System (PMS)  
**Target Audience:** Engineering, Product Managers, Administrators, and AI Agents.

---

## 1. Product Scope & Tenets

1. **Internal-Only Workspace**: Zsyio PMS is strictly for internal staff (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `DEVELOPER`, `SUPPORT`, and custom team roles). There is **no public registration**, no client login portal, and no external access.
2. **Account Provisioning**: Users are provisioned exclusively through Administrator invitations.
3. **Core Hierarchy**:
   ```
   Client (Brand, Contract, Domain, Status)
      └── Product (Instance: Version, Repo, URL, Environment)
             └── Task / Ticket (Assignees, Teams, Priority, Type, QA Sheets, Notes)
   ```

---

## 2. Access Control & Permission Rules

### 2.1 Server-Side Enforcement Is Mandatory
* **Golden Rule**: Client-side UI element hiding (hiding buttons or tabs) is **strictly UX polish** and is **never trusted for security**.
* Every mutating endpoint and data retrieval function **must** invoke `assertCan(user.role, action, user.permissions)` in `src/lib/permissions.ts`.

### 2.2 Role Hierarchy & Responsibilities

| Role | Scope & Permissions |
|---|---|
| **SUPER_ADMIN** | Root owner: full administrative authority across all workspaces, users, settings, and database configurations. |
| **ADMIN** | Full administrative rights: manage clients, products, tasks, teams, users, roles, and settings. |
| **MANAGER** | Product & Client management: create/edit clients, products, assign tasks, view reports. Cannot manage users/roles or delete clients/tasks. |
| **DEVELOPER** | Execution: view assigned tasks ("own" tasks), update task status, add comments, run QA test cases, manage personal notes. Cannot view unassigned client data. |
| **SUPPORT** | Customer issue intake: read-only access to clients/products, can create tickets of type `SUPPORT_REQUEST`, edit own tickets and client notes. |
| **CUSTOM ROLES** | Dynamic granular roles stored in the `CustomRole` table with customizable permissions (e.g. `QA Specialist`, `DevOps Lead`, `Frontend Engineer`). |

### 2.3 Task Ownership Scoping Rule
* For `DEVELOPER` accounts with `task:view:own` permission, a task is considered **"own"** if and only if:
  1. `assignedToId === user.id` (legacy primary owner), **OR**
  2. `user.id ∈ TaskAssignee` (roster assignee), **OR**
  3. `user.id ∈ TeamMember` for `assignedTeamId` or any `TaskTeam` roster.
* This is enforced directly in the database query `where` clause via `taskRepository.list({ scopeToUserId })`, never filtered in-memory.

---

## 3. Data Integrity & Schema Rules

### 3.1 Soft Deletion Policy
* **Rule**: Core entities (`Task`, `Client`, `Product`) **must never be hard-deleted** from the database.
* Soft deletion is implemented using the `deletedAt DateTime?` timestamp.
* Hard deletions destroy referential integrity with the immutable `ActivityLog` and relational audit trails.

### 3.2 Security & Safe User Selection
* **Rule**: Never expose `passwordHash`, `resetOtpHash`, or sensitive tokens in API responses.
* All repository queries joining user records must use `SAFE_USER_SELECT` from `src/server/repositories/shared.ts`.

### 3.3 Ticket ID Standard
* Database stores standard `cuid()` as `id`.
* User-facing ticket format is generated as `TSK-<shortCode>` via `formatTicketId(id)`.
* Search queries must support searching by raw ID, uppercase `TSK-123`, lowercase `tsk-123`, or bare digits `123`.

### 3.4 Multi-Assignee & Team Roster Rules
* `assignedToId` represents the primary owner (for digest emails and default grouping).
* `TaskAssignee` (`taskId, userId`) contains the full assigned developer roster.
* `assignedTeamId` + `TaskTeam` (`taskId, teamId`) enables multi-team task ownership.

---

## 4. Task Lifecycle & Workflow Rules

### 4.1 Status State Machine

```
[ BACKLOG ] ───► [ TODO ] ───► [ IN_PROGRESS ] ───► [ IN_REVIEW ] ───► [ QA ] ───► [ DONE ]
       │            │                 │                   │              ▲
       ▼            ▼                 ▼                   ▼              │
  └────────────┴──────────► [ BLOCKED ] ◄─────────────────┴──────────────┘
```

1. **BACKLOG**: Unprioritized items or ideas waiting for grooming.
2. **TODO**: Scheduled for upcoming sprint/work cycle.
3. **IN_PROGRESS**: Actively being worked on by assigned developer(s).
4. **IN_REVIEW**: Pull request or code review submitted.
5. **QA**: Staging verification & test case execution.
6. **BLOCKED**: Progress halted (requires `blockedReason` markdown description).
7. **DONE**: Verified and deployed to production.
8. **Custom Kanban Columns**: Dynamic workspace columns (prefixed with `CUSTOM_`) can be created and reordered.

### 4.2 Task Priority Levels
* `CRITICAL` (Urgent — red): Production breakage or blocker.
* `HIGH` (High — orange): Core sprint feature or client deadline.
* `MEDIUM` (Medium — yellow): Standard operational task.
* `LOW` (Low — blue): Minor enhancement or polish.

### 4.3 Task Hierarchy Ranking Rules
When sorting actionable tasks on dashboards, the following strict hierarchy applies:
1. **Admin/Manager Created**: High-priority managerial assignments rank first.
2. **Imminent Due Date**: Earliest deadlines rank next.
3. **Priority Level**: `CRITICAL` > `HIGH` > `MEDIUM` > `LOW`.
4. **Creation Date**: Older open items before newer items.

### 4.4 QA Test Sheet Lifecycle
* Each task can have a QA verification test sheet containing multiple `TestCase` records.
* Test case status transitions: `PENDING` → `PASSED` | `FAILED` | `BLOCKED` | `SKIPPED`.
* Execution tracks `testedById`, `testedAt`, and tester execution `notes`.

### 4.5 Git Branch Naming Rule
* Automated branch naming helper follows:
  `{prefix}/{ticket-id}-{slug}`
  * e.g., `feat/TSK-8491-client-auth-flow`
  * e.g., `fix/TSK-2041-date-picker-hydration-bug`

---

## 5. Notes & Knowledge System Rules

1. **Note Categories**:
   * **Dashboard Notes**: High-visibility workspace announcements targeted to `All`, specific `Teams`, `Roles`, or `Users`.
   * **Client Notes**: Dedicated client logs, meeting minutes, and contract discussions attached to a `Client`.
   * **Task Notes**: Linked notes directly referencing a specific ticket `taskId`.
   * **Personal & Workspace Notes**: Folder-organized documentation.
2. **Sharing Cascades**:
   * Notes can be shared with individual users (`NoteShare`), entire teams (`NoteShare.teamId`), or specific custom roles (`NoteShare.customRoleId`).
   * Folder-level shares (`NoteFolderShare`) inherit permissions down to all enclosed notes.

---

## 6. Code Architecture & Development Standards

### 6.1 Layered Backend Architecture
Every feature follows a strict four-layer separation:
```
[ Next.js API Route ] (src/app/api/*)
       │  - Authentication via requireUser()
       │  - Input validation via Zod schemas
       ▼
[ Service Layer ] (src/server/services/*)
       │  - Authorization checks via assertCan()
       │  - Business logic, side effects, notifications
       ▼
[ Repository Layer ] (src/server/repositories/*)
       │  - Pure Prisma queries with relationLoadStrategy: "join"
       ▼
[ Database / Prisma ]
```

### 6.2 Frontend State & Caching Rules
* **Server Data**: Owned by **RTK Query** (`src/store/api/*`). Components use hooks (`useGetTasksQuery`, `useGetClientsQuery`).
* **Optimistic Updates**: Fast-moving operations (Kanban drag-and-drop, status toggles) must implement optimistic cache updates with rollback on error.
* **Client-Only State**: Pure UI states (filters, view toggles, sidebar open/closed) live in Redux slices (`src/store/slices/*`).

### 6.3 TypeScript & Validation Standards
* Strict TypeScript: `noImplicitAny: true`. Avoid type assertions (`as any`).
* All API inputs must have corresponding Zod schemas in `src/lib/validators/*.schema.ts`.

### 6.4 Design Tokens & Styling Rules
* **Authoritative Specification**: All UI elements must strictly comply with the [Official Design System Specification](design-system.md).
* **Geometry Standard**: Interactive controls (buttons, inputs, selects, dropdowns, tabs) strictly use `rounded-md` (or `rounded-sm`). Oversized bubbly radii (`rounded-xl`, `rounded-full` pills) are strictly prohibited.
* **No Hardcoded Colors**: Use semantic CSS tokens (`tokens.css`) mapped to brand definitions. Ad-hoc hex values (`#1e293b`) or arbitrary Tailwind colors are rejected.
* **Brand Tokens Engine**: Master tokens are defined in `tokens/` and compiled via `npm run build:tokens` (`scripts/build-tokens.mjs`).
* **Tabular Numbers**: Any numeric metric, timestamp, or ticket ID (`TSK-<shortCode>`) must enforce `font-mono tabular-nums`.

---

## 7. Database & Operational Rules

1. **Migration Policy**:
   * Never run `prisma db push` in production.
   * All schema changes must be applied via `npx prisma migrate dev --name <description>`.
2. **Environment Variables**:
   * `.env.local` is for local development only and is git-ignored.
   * Required production variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
3. **Automated Background Tasks**:
   * Overdue task digest and SLA reminders run via Next.js route handlers under `/api/cron/*`.
