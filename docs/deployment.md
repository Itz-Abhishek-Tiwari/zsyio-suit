# 🚀 Mediloon Suite — Vercel Monorepo Production Deployment Guide

> **Monorepo Stack**: Next.js 15 (Turborepo + pnpm) · Prisma ORM · PostgreSQL (Supabase) · NextAuth v5 · Tailwind CSS v4 · Vercel

---

## 📑 Table of Contents

1. [Architecture & Deployment Strategy](#1-architecture--deployment-strategy)
2. [How Shared Packages (`packages/*`) Work in Vercel](#2-how-shared-packages-packages-work-in-vercel)
3. [Prerequisites](#3-prerequisites)
4. [Database Setup (Supabase / PostgreSQL)](#4-database-setup-supabase--postgresql)
5. [Step-by-Step Vercel Deployment](#5-step-by-step-vercel-deployment)
   - [Deploying `@zsyio/pms` (Project Management)](#51-deploying-mediloonpms-apps-pms)
   - [Deploying `@zsyio/notes` (Collaborative Notes)](#52-deploying-mediloonnotes-apps-notes)
6. [Complete Environment Variables Reference](#6-complete-environment-variables-reference)
7. [Vercel Cron Jobs Configuration](#7-vercel-cron-jobs-configuration)
8. [Vercel Remote Caching & Turbo-Ignore (Build Optimization)](#8-vercel-remote-caching--turbo-ignore-build-optimization)
9. [Custom Domains & Cross-App Navigation](#9-custom-domains--cross-app-navigation)
10. [Automated CI/CD Database Migrations (GitHub Actions)](#10-automated-cicd-database-migrations-github-actions)
11. [Troubleshooting & FAQs](#11-troubleshooting--faqs)
12. [Post-Deployment Verification Checklist](#12-post-deployment-verification-checklist)

---

## 1. Architecture & Deployment Strategy

The **Mediloon Suite** is organized as a Turborepo monorepo powered by **pnpm workspaces**. It contains two Next.js 15 applications that share internal packages (`@zsyio/database`, `@zsyio/auth`, `@zsyio/ui`, `@zsyio/validators`, `@zsyio/editor`, `@zsyio/types`):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GitHub Repository                              │
│                         (Mediloon PMS Monorepo)                             │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       ▼                               ▼
       ┌───────────────────────────────┐ ┌───────────────────────────────┐
       │     Vercel Project 1          │ │     Vercel Project 2          │
       │     `mediloon-pms`            │ │     `mediloon-notes`          │
       │     Root: `apps/pms`          │ │     Root: `apps/notes`        │
       │     Domain: pms.mediloon.de   │ │     Domain: notes.mediloon.de │
       └───────────────┬───────────────┘ └───────────────┬───────────────┘
                       │                                 │
                       │   DATABASE_URL (Port 6543)      │
                       └───────────────┬─────────────────┘
                                       ▼
                       ┌───────────────────────────────┐
                       │       Supabase Database       │
                       │    PostgreSQL 15 + Pooler     │
                       │   (PgBouncer Transaction)     │
                       └───────────────────────────────┘
```

### Monorepo Deployment Model on Vercel
On Vercel, monorepo apps are deployed as **separate Vercel Projects connected to the same Git repository**. Each project has its own:
- **Root Directory** pointing to its workspace (`apps/pms` or `apps/notes`).
- **Environment Variables** (scoped to that specific application and shared keys).
- **Custom Domain** (e.g. `pms.mediloon.de` and `notes.mediloon.de`).
- **Build Caching** powered by Turborepo & Vercel Remote Cache.

---

## 2. How Shared Packages (`packages/*`) Work in Vercel

A common question in monorepos is: **"Do I need to deploy the packages separately or publish them to npm?"**

> [!NOTE]
> **Short Answer**: **No.** You do not deploy packages separately, nor do you publish them to npm. Vercel builds and bundles all internal packages (`packages/*`) directly into the Next.js applications during the app build process.

### 2.1 The Internal Package Ecosystem

| Package | Workspace Name | Purpose | How It Is Consumed in Production |
|---|---|---|---|
| [`packages/database`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/database) | `@zsyio/database` | Prisma ORM multi-schema definitions, migrations, and database singleton client. | Generated during `postinstall` (`turbo run db:generate`), compiled into server runtime. |
| [`packages/auth`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/auth) | `@zsyio/auth` | NextAuth v5 configuration, JWT session callbacks, RBAC permissions (`assertCan`). | Bundled directly into Next.js server components and API routes. |
| [`packages/ui`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/ui) | `@zsyio/ui` | Shared Radix UI components, modals, dialogs, design token styles. | Transpiled and bundled directly into client & server bundles. |
| [`packages/validators`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/validators) | `@zsyio/validators` | Zod validation schemas for forms and API request payloads. | Bundled into client forms and API route validators. |
| [`packages/editor`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/editor) | `@zsyio/editor` | Shared Tiptap WYSIWYG rich text editor for notes and task descriptions. | Transpiled directly into React UI bundles. |
| [`packages/types`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/types) | `@zsyio/types` | Shared TypeScript interfaces and domain models. | Stripped during TypeScript compilation (zero runtime overhead). |
| [`packages/config-eslint`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/config-eslint) | `@zsyio/config-eslint` | Shared ESLint rules and configs. | Used during CI/CD linting checks. |
| [`packages/config-typescript`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/config-typescript) | `@zsyio/config-typescript` | Base `tsconfig.json` compiler presets. | Used during TypeScript type checking. |

### 2.2 How Vercel Resolves & Bundles Packages Step-by-Step

```
1. Vercel Clones Monorepo
   └── Detects root `pnpm-workspace.yaml` and `package.json`

2. Dependency Installation (`pnpm install`)
   └── pnpm links `packages/*` into `node_modules/@zsyio/*` via symlinks (`workspace:*`)

3. Postinstall Hook (`postinstall`)
   └── Executes: `node scripts/setup-env.mjs && turbo run db:generate`
   └── Prisma generates `@prisma/client` inside `@zsyio/database`

4. Next.js App Compilation (`next build`)
   └── Next.js reads `transpilePackages` in `next.config.ts`:
       - Transpiles raw TypeScript from `@zsyio/*` on the fly
       - Bundles server code into Serverless Functions
       - Bundles client code into optimized static JavaScript chunks
```

### 2.3 The Role of `transpilePackages` in `next.config.ts`

Because internal packages are written in raw TypeScript/React without needing pre-compilation steps (`dist/` folders), both `apps/pms/next.config.ts` and `apps/notes/next.config.ts` specify:

```typescript
// apps/pms/next.config.ts & apps/notes/next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: [
    "@zsyio/database",
    "@zsyio/types",
    "@zsyio/validators",
    "@zsyio/auth",
    "@zsyio/ui",
    "@zsyio/editor",
  ],
  // ...
};
```

This tells Next.js and Webpack to treat your local monorepo packages exactly like local source code—optimizing, tree-shaking, and minifying them for production.

---

## 3. Prerequisites

Before starting your deployment, ensure you have:
- [x] A **GitHub / GitLab** account with push access to the repository.
- [x] A **Vercel** account ([vercel.com](https://vercel.com)).
- [x] A **Supabase** account ([supabase.com](https://supabase.com)) or another PostgreSQL 15+ provider.
- [x] Node.js **>= 20.0.0** and **pnpm >= 11.22.0** installed locally.
- [x] Zoho ZeptoMail API account or Resend key (for email notifications).
- [x] (Optional) Google Gemini API Key (for automated Git branch name & QA generation).

---

## 4. Database Setup (Supabase / PostgreSQL)

Mediloon PMS uses Prisma ORM with multi-file schema support located in [`packages/database/prisma/schema/`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/database/prisma/schema/).

### 4.1 Create a Supabase Project

1. Log into [supabase.com](https://supabase.com) and click **New Project**.
2. Set:
   - **Name**: `mediloon-production`
   - **Database Password**: Generate a secure password and save it in a password manager.
   - **Region**: Choose the region closest to your users (e.g., `Central EU (Frankfurt)` for Europe or `ap-south-1` for India).
3. Wait for provisioning (~2 minutes).

### 4.2 Retrieve Connection Strings (Session vs Transaction Mode)

Navigate to **Project Settings → Database → Connection String** in Supabase:

| Connection Type | Port | Parameter / Mode | Used For | Environment Variable |
|---|---|---|---|---|
| **Transaction Pooler** | `6543` / Neon `-pooler` | `?pgbouncer=true&connection_limit=1&pool_timeout=15&connect_timeout=15` | Serverless Next.js API Routes / SSR (Lambda) | `DATABASE_URL` |
| **Session / Direct Pooler** | `5432` / Neon direct | Direct Connection (`?connect_timeout=15`) | Prisma Migrations (`prisma migrate deploy`), Seed, Schema Push | `DIRECT_URL` |

> [!IMPORTANT]
> **Colocate Vercel Serverless Functions with your Database Region (`fra1`)**:
> If your database is in Frankfurt (`eu-central-1`), your Vercel projects MUST be configured to run in Frankfurt (`fra1`). In a monorepo, each app workspace (`apps/pms`, `apps/sales`, etc.) has its own `vercel.json` defining `"regions": ["fra1"]`. Omitting this causes Vercel to default to `iad1` (Washington DC) or `hnd1` (Tokyo), adding 100–240ms of cross-continental latency to every single database query!
>
> **Serverless Connection Pooling**:
> In serverless lambdas on Vercel, set `connection_limit=1` on `DATABASE_URL`. Because each lambda handles one request at a time, higher limits waste connection slots in PgBouncer and cause pool exhaustion under concurrent traffic.

### 4.3 Apply Database Migrations and Seed

Run migrations from your local terminal against the Supabase database:

```bash
# 1. Ensure root .env.local has your production credentials
# (Use DIRECT_URL for migrations and DATABASE_URL for runtime)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20"

# 2. Generate Prisma Client
pnpm run db:generate

# 3. Deploy migrations to Supabase
pnpm --filter=@zsyio/database db:migrate:deploy

# 4. (Optional) Seed initial roles and test accounts
pnpm run db:seed
```

---

## 5. Step-by-Step Vercel Deployment

### 5.1 Deploying `@zsyio/pms` (`apps/pms`)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your Git repository and click **Import**.
3. Configure the project settings:
   - **Project Name**: `mediloon-pms`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `apps/pms`.
   - **Package Manager**: `pnpm` (Vercel auto-detects `pnpm-lock.yaml` at root).
4. **Build and Output Settings**:
   - Vercel automatically infers Turborepo build commands.
   - Default Build Command: `pnpm run build` (or leave default).
   - Install Command: `pnpm install` (or leave default).
   - Output Directory: Next.js default (`.next`).
5. **Environment Variables**:
   - Add all required environment variables listed in [Section 6](#6-complete-environment-variables-reference).
6. Click **Deploy**.

---

### 5.2 Deploying `@zsyio/notes` (`apps/notes`)

1. Go to [vercel.com/new](https://vercel.com/new) again.
2. Select the **same** Git repository and click **Import**.
3. Configure the project settings:
   - **Project Name**: `mediloon-notes`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `apps/notes`.
4. **Build and Output Settings**:
   - Keep default settings.
5. **Environment Variables**:
   - Add the environment variables listed in [Section 6](#6-complete-environment-variables-reference), ensuring `AUTH_URL` points to the notes deployment and `NEXT_PUBLIC_PMS_URL` points to the PMS deployment.
6. Click **Deploy**.

---

## 6. Complete Environment Variables Reference

Configure these variables in **Vercel Dashboard → Project Settings → Environment Variables**.

### 6.1 Environment Variables Matrix

| Variable Name | Required By | Scope | Description / Example |
|---|---|---|---|
| `DATABASE_URL` | Both | Prod, Preview | Supabase Transaction Pooler URL (Port 6543) with `?pgbouncer=true&connection_limit=10&pool_timeout=20` |
| `DIRECT_URL` | Both | Prod, Preview | Supabase Session Mode URL (Port 5432) |
| `AUTH_SECRET` | Both | Prod, Preview, Dev | High-entropy 32+ char secret generated via `openssl rand -base64 32` or `npx auth secret` |
| `AUTH_URL` | Both | Prod, Preview | Canonical URL of the specific app (e.g., `https://pms.mediloon.de` for PMS, `https://notes.mediloon.de` for Notes) |
| `AUTH_TRUST_HOST` | Both | Prod, Preview | Set to `"1"` (Mandatory for NextAuth v5 on Vercel proxy) |
| `NEXT_PUBLIC_APP_URL` | Both | Prod, Preview | Base URL for the current application |
| `NEXT_PUBLIC_PMS_URL` | Both | Prod, Preview | Public URL of PMS App (`https://pms.mediloon.de`) |
| `NEXT_PUBLIC_NOTES_URL` | Both | Prod, Preview | Public URL of Notes App (`https://notes.mediloon.de`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Prod, Preview | `https://[PROJECT-REF].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | Prod, Preview | Supabase `anon` public key (used for realtime channels) |
| `ACTIVE_BRAND` | Both | All | `mediloon-default` |
| `CRON_SECRET` | PMS | Prod | Random 32-character secret for securing `/api/cron/*` endpoints |
| `ALLOWED_EMAIL_DOMAINS` | Both | All | Comma-separated allowed domains, e.g. `mediloon.de,mediloon.com` |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` | Both | All | Same as above (`mediloon.de,mediloon.com`) |
| `SUPER_ADMIN_EMAIL` | Both | All | Primary workspace owner email (e.g. `admin@mediloon.de`) |
| `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` | Both | All | Same as above (`admin@mediloon.de`) |
| `ZEPTOMAIL_TOKEN` | PMS | Prod, Preview | Zoho ZeptoMail Send Mail Token (`Zoho-enczapikey wSsVR6...`) |
| `ZEPTOMAIL_URL` | PMS | Prod, Preview | ZeptoMail API endpoint (EU: `https://api.zeptomail.eu/`, US: `https://api.zeptomail.com/`) |
| `ZEPTOMAIL_FROM_EMAIL` | PMS | Prod, Preview | Verified sender email, e.g. `notifications@mediloon.de` |
| `ZEPTOMAIL_FROM_NAME` | PMS | Prod, Preview | Sender display name, e.g. `Mediloon Suite` |
| `EMAIL_FROM` | PMS | Prod, Preview | Sender address fallback (`notifications@mediloon.de`) |
| `EMAIL_FROM_NAME` | PMS | Prod, Preview | `Mediloon Suite` |
| `TEAMS_WEBHOOK_URL` | PMS (Optional) | Prod, Preview | Microsoft Teams Workflow Webhook URL for task alerts |
| `GEMINI_API_KEY` | PMS (Optional) | Prod, Preview | Google Gemini API Key for generating Git branch slugs & QA test cases |
| `GEMINI_MODEL` | PMS (Optional) | Prod, Preview | AI model override (default: `gemini-2.5-flash`) |
| `STORAGE_PROVIDER_URL` | PMS (Optional) | Prod, Preview | S3-compatible / Cloudflare R2 endpoint URL |
| `STORAGE_PROVIDER_ACCESS_KEY` | PMS (Optional) | Prod, Preview | S3 / R2 Access Key ID |
| `STORAGE_PROVIDER_SECRET_KEY` | PMS (Optional) | Prod, Preview | S3 / R2 Secret Access Key |
| `STORAGE_BUCKET_NAME` | PMS (Optional) | Prod, Preview | S3 / R2 bucket name |
| `NODE_ENV` | Both | Prod | `production` |

---

## 7. Vercel Cron Jobs Configuration

Mediloon PMS features an automated daily overdue task digest route at [`apps/pms/src/app/api/cron/overdue-digest/route.ts`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/apps/pms/src/app/api/cron/overdue-digest/route.ts).

To configure automatic execution on Vercel:

### 7.1 Add `vercel.json` in `apps/pms` (or root)

Ensure `apps/pms/vercel.json` contains:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/overdue-digest",
      "schedule": "0 8 * * *"
    }
  ]
}
```

> **Schedule format**: Standard 5-field cron. `"0 8 * * *"` executes daily at 08:00 UTC.

### 7.2 Securing Cron Endpoints with `CRON_SECRET`

1. In Vercel Project Settings for `mediloon-pms`, add `CRON_SECRET=<your-random-token>`.
2. When Vercel triggers scheduled cron jobs, it automatically attaches the header:
   ```http
   Authorization: Bearer <CRON_SECRET>
   ```
3. The route verifies this header using constant-time buffer comparison (`crypto.timingSafeEqual`) to prevent timing attacks.

---

## 8. Vercel Remote Caching & Turbo-Ignore (Build Optimization)

### 8.1 Enable Turborepo Remote Caching

Turborepo remote caching caches build outputs across your team and CI/CD pipelines, reducing build times from minutes to seconds.

Link your local repository to Vercel Remote Cache:

```bash
# Authenticate Turbo with Vercel
npx turbo login

# Link repository to your Vercel team/project
npx turbo link
```

### 8.2 Configure Ignore Build Step (`turbo-ignore`)

To prevent Vercel from rebuilding `@zsyio/notes` when only `@zsyio/pms` changes (and vice versa):

1. Go to **Vercel Project Settings → Git → Ignored Build Step**.
2. Select **Custom** and enter:
   - For **`mediloon-pms`**:
     ```bash
     npx turbo-ignore --task=build --filter=@zsyio/pms
     ```
   - For **`mediloon-notes`**:
     ```bash
     npx turbo-ignore --task=build --filter=@zsyio/notes
     ```
3. Click **Save**.

---

## 9. Custom Domains & Cross-App Navigation

To achieve seamless single sign-on (SSO) and unified navigation between PMS and Notes:

### 9.1 Domain Setup Example

Assign custom domains under **Project Settings → Domains**:

| Application | Recommended Domain |
|---|---|
| **PMS App** | `pms.mediloon.de` (or `app.mediloon.de`) |
| **Notes App** | `notes.mediloon.de` |

### 9.2 Shared Cookie Domain for NextAuth Session Sharing

If you want users to log in once and remain logged in across both subdomains (`*.mediloon.de`):

In [`packages/auth/src/auth.ts`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/packages/auth/src/auth.ts), cookie options can be configured with `domain: ".mediloon.de"`:

```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? ".mediloon.de" : undefined,
    },
  },
}
```

---

## 10. Automated CI/CD Database Migrations (GitHub Actions)

To automatically deploy database migrations to Supabase upon merging pull requests to `main`:

Create `.github/workflows/db-migrate.yml`:

```yaml
name: Deploy Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'packages/database/prisma/**'

jobs:
  migrate:
    name: Apply Prisma Migrations
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 11.22.0

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm run db:generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}

      - name: Deploy Migrations
        run: pnpm --filter=@zsyio/database db:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

> **GitHub Secrets**: Add `DATABASE_URL` (Port 6543) and `DIRECT_URL` (Port 5432) to your GitHub repository under **Settings → Secrets and variables → Actions**.

---

## 11. Troubleshooting & FAQs

### ❌ Issue: `PrismaClientInitializationError: Can't reach database server`
* **Cause**: Incorrect database connection string or port mismatch.
* **Fix**:
  1. Confirm `DATABASE_URL` uses **port 6543** (PgBouncer pooler).
  2. Confirm `DIRECT_URL` uses **port 5432**.
  3. Verify Supabase IP allowlist or check that SSL mode is enabled (`sslmode=require`).

---

### ❌ Issue: `[auth][error] UntrustedHost: Host must be trusted`
* **Cause**: NextAuth v5 requires explicit host trust on reverse proxies / Vercel.
* **Fix**: Ensure `AUTH_TRUST_HOST="1"` is added to Environment Variables for all environments (Production, Preview, Development).

---

### ❌ Issue: `Module not found: Can't resolve '@zsyio/...'`
* **Cause**: Monorepo packages not transpiled by Next.js.
* **Fix**: Verify [`apps/pms/next.config.ts`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/apps/pms/next.config.ts) and [`apps/notes/next.config.ts`](file:///Users/tw/workspace/Active/Mediloon/PMS-Mediloom/apps/notes/next.config.ts) have:
  ```typescript
  transpilePackages: [
    "@zsyio/database",
    "@zsyio/types",
    "@zsyio/validators",
    "@zsyio/auth",
    "@zsyio/ui",
    "@zsyio/editor",
  ],
  ```

---

### ❌ Issue: `Prisma client not generated during Vercel build`
* **Cause**: Build command ran before `pnpm run db:generate`.
* **Fix**: The root `package.json` includes:
  ```json
  "postinstall": "node scripts/setup-env.mjs && turbo run db:generate"
  ```
  Vercel automatically executes `postinstall` after `pnpm install`, generating `@prisma/client` before `next build`.

---

### ❌ Issue: Email sending fails in production
* **Cause**: Missing or unverified ZeptoMail sender address.
* **Fix**:
  1. Ensure `ZEPTOMAIL_FROM_EMAIL` domain is verified with SPF/DKIM/CNAME records in Zoho ZeptoMail.
  2. Confirm `ZEPTOMAIL_URL` matches your ZeptoMail data center (`https://api.zeptomail.eu/` for EU, `https://api.zeptomail.com/` for US).

---

## 12. Post-Deployment Verification Checklist

Once deployed, perform these verification checks:

- [ ] **Database Connection**: Navigate to `/login` and attempt to log in with an admin account.
- [ ] **Realtime Updates**: Open two browser windows, create or update a task, and verify real-time status sync via Supabase Realtime channels.
- [ ] **Cross-App Navigation**: Click the **Notes** icon in the PMS sidebar and verify seamless transition to `@zsyio/notes`.
- [ ] **Email Dispatch**: Trigger a task assignment or password reset to verify ZeptoMail delivery.
- [ ] **Cron Execution**: Check Vercel Dashboard → **Project** → **Cron Jobs** to verify `/api/cron/overdue-digest` status.
- [ ] **Security Headers**: Inspect HTTP response headers using `curl -I https://pms.mediloon.de` to verify `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.

---

*Mediloon Suite Engineering Team · Documentation updated for Turborepo Next.js 15 Monorepo*
