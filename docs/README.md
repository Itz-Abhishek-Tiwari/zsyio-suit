# 📚 Zsyio Enterprise Operating System — Documentation Hub

Welcome to the official documentation repository for the **Zsyio Suite Monorepo**.

---

## 🧭 Documentation Structure

```
docs/
├── README.md                     # Central documentation hub index
├── rulebook.md                   # Authoritative system rules, permissions & architecture standards
├── design-system.md              # Zero-Drift Design System, tokens, geometry & components
├── deployment.md                 # Production deployment guide (Vercel, Supabase, Cron)
├── apps/                         # Suite applications documentation & visual galleries
│   ├── README.md                 # Suite applications overview & architecture
│   ├── 01-flow-pms/              # Zsyio Flow (Tasks, Sprints, Clients)
│   ├── 02-canvas-notes/          # Zsyio Canvas (Knowledge Base, RFCs, Mermaid)
│   ├── 03-pulse-sales/           # Zsyio Pulse (CRM, Deals Pipeline)
│   ├── 04-people-hrms/           # Zsyio People (Workforce, Punch Station, Leaves)
│   └── 05-console-admin/         # Zsyio Console (IAM, Roles, Governance)
└── architecture/
    ├── build-spec-v2.md          # Complete technical spec, design decisions & entity schemas
    └── cross-app-sso.md          # Cross-App SSO, cookie scoping & production authentication guide
```

---

## 📑 Core Documentation Index

### 1. 📱 [Suite Applications Documentation (`docs/apps/README.md`)](apps/README.md)
Detailed architectural breakdown, workflows, and visual screenshot galleries for all 5 enterprise applications:
* **[Zsyio Flow PMS](apps/01-flow-pms/README.md)**: Sprints, Tasks, stopwatch time tracking, Git branch assistant, and client SLA delivery.
* **[Zsyio Canvas Notes](apps/02-canvas-notes/README.md)**: Tiptap v2 GFM rich document editor, live Mermaid SVG architecture diagrams, and RFC templates.
* **[Zsyio Pulse Sales](apps/03-pulse-sales/README.md)**: Commercial CRM, deals pipeline Kanban, and client touchpoint logs.
* **[Zsyio People HRMS](apps/04-people-hrms/README.md)**: Digital punch station, daily/monthly timesheets, leave quotas, and presence roster.
* **[Zsyio Console Admin](apps/05-console-admin/README.md)**: Zero-Trust IAM, email domain whitelisting, 56-action RBAC matrix, and department tiers.

### 2. 🎨 [Design System Specification (`docs/design-system.md`)](design-system.md)
The official UI design system standard for Zsyio Suite:
* **Visual Philosophy**: Notion / Craft calm productivity aesthetic with zero raw hex colors.
* **Geometry Hierarchy**: Strict border radius rules (`rounded-md` for interactive controls, `rounded-xl`/`rounded-2xl` for containers).
* **Tokens**: Complete semantic color matrix, contrast ratios, and dark/light mode standards.
* **Typography**: Space Grotesk, Plus Jakarta Sans, and JetBrains Mono with tabular numbers.
* **Component Anatomy**: Standard usage guides for Buttons, Inputs, Badges, Cards, Modals, and Navigation.

### 3. 📘 [Official Rule Book (`docs/rulebook.md`)](rulebook.md)
The central rule book and technical reference for Zsyio:
* **Product Scope & Tenets**: Internal-only architecture, single-tenant user management, and `Client → Product → Task` flow.
* **Access Control & Permissions**: Role definitions (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `DEVELOPER`, `SUPPORT`, `CustomRole`), `assertCan()` server-side rule, task ownership scoping.
* **Data Integrity & Schema Rules**: Soft deletion policy (`deletedAt`), sensitive user data isolation (`SAFE_USER_SELECT`), `TSK-<shortCode>` ticket formatting.
* **Task Lifecycle & Workflow**: State machine (`BACKLOG` → `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `QA` → `DONE` + `BLOCKED`), dynamic Kanban columns, QA test sheet lifecycle, and Git branch naming conventions.

### 4. 🚀 [Deployment Guide (`docs/deployment.md`)](deployment.md)
Step-by-step instructions for deploying Zsyio Suite:
* **Monorepo Strategy**: Multi-project deployment on Vercel across all 5 applications.
* **Database Setup**: PostgreSQL configuration (Session vs Transaction pooling modes, `DATABASE_URL` vs `DIRECT_URL`).
* **Environment Configuration**: Complete environment matrix (`AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `ZEPTOMAIL_TOKEN`, `CRON_SECRET`).
* **Vercel Remote Caching**: Turborepo remote caching & `npx turbo-ignore` configuration.

### 5. 🏗️ [Technical Build Spec V2 (`docs/architecture/build-spec-v2.md`)](architecture/build-spec-v2.md)
Architect-reconciled technical specification:
* **Full Prisma Models**: Complete relational definitions for Clients, Products, Tasks, Assignees, Teams, Notes, and Notifications.
* **Design Token Engine**: Token compilation scripts and theme variables.

### 6. 🔐 [Cross-App Single Sign-On Architecture (`docs/architecture/cross-app-sso.md`)](architecture/cross-app-sso.md)
Production authentication and multi-app session sharing guide:
* **Root Cause Analysis**: Browser Public Suffix List (PSL) restrictions on `*.vercel.app`.
* **Architecture Evaluation**: Trade-offs between URL handshake tokens, reverse proxies, and shared cookies.
