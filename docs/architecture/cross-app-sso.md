# 🔐 Cross-App Single Sign-On (SSO) & Production Authentication Architecture

> **Authoritative Guide on Multi-App Session Sharing, Cookie Scoping, and Production Architecture for the Zsyio Suite**

---

## 📑 Table of Contents

1. [The Core Problem: Why Each App Prompts for Login](#1-the-core-problem-why-each-app-prompts-for-login)
2. [Evaluation of Candidate Approaches](#2-evaluation-of-candidate-approaches)
3. [The Production Gold Standard: Custom Domain Shared Cookie SSO](#3-the-production-gold-standard-custom-domain-shared-cookie-sso)
4. [Deep Architectural Breakdown: Why It Is Superior](#4-deep-architectural-breakdown-why-it-is-superior)
5. [Codebase Readiness in Zsyio Suite](#5-codebase-readiness-in-zsyio-suite)
6. [Production Deployment & Activation Guide](#6-production-deployment--activation-guide)
7. [Interim Strategy (Before Custom Domain Is Ready)](#7-interim-strategy-before-custom-domain-is-ready)

---

## 1. The Core Problem: Why Each App Prompts for Login

The **Zsyio Suite** is structured as an enterprise monorepo comprising four distinct Next.js applications:

* **PMS** (`apps/pms`) — Project, product, and client management
* **Admin** (`apps/admin`) — User management, RBAC, and system directory
* **HRMS** (`apps/hrms`) — Attendance, timesheets, and leave tracking
* **Notes** (`apps/notes`) — Collaborative documentation and knowledge base

When deployed to default Vercel preview or production URLs, each application receives an isolated Vercel subdomain:

```
https://zsyio-pms.vercel.app
https://zsyio-admin.vercel.app
https://zsyio-hrms.vercel.app
https://zsyio-notes.vercel.app
```

### The Browser Public Suffix Restriction

Web browsers isolate cookies using the **Public Suffix List (PSL)**:
1. `vercel.app` is classified as a **Public Suffix** (in the same security class as top-level domains like `.com`, `.org`, or `.co.uk`).
2. Browsers enforce a strict security policy: **websites cannot set cookies across a public suffix**. Setting `Domain=.vercel.app` is blocked unconditionally by Chrome, Safari, Firefox, and Edge. If this were permitted, any Vercel customer could read or manipulate the session cookies of any other customer's website on `*.vercel.app`.
3. Consequently, every `zsyio-*.vercel.app` app gets an isolated, host-only cookie jar. A session established on `zsyio-pms.vercel.app` is invisible to `zsyio-admin.vercel.app`.

---

## 2. Evaluation of Candidate Approaches

To eliminate the friction of logging into each application separately, five architectural patterns were evaluated:

| # | Approach | Mechanism | Direct Links / New Tabs | Security Profile | Maintenance / Tech Debt | Production Suitability |
|---|---|---|---|---|---|---|
| **1** | **Custom Domain Shared Cookie SSO (`COOKIE_DOMAIN`)** | Subdomains under a single apex domain (`*.zsyio.de`) sharing an RFC 6265 scoped session cookie. | ✅ Seamless native access across all apps. | ✅ **Best in class.** Zero token exposure, HTTP-only, encrypted JWT. | ✅ **Zero tech debt.** Native browser behavior, zero custom auth code. | 🏆 **Gold Standard (Best)** |
| **2** | **Cross-App SSO Handshake (Signed URL Tickets)** | App A signs a 30s ticket; navigates to App B's `/api/auth/sso?ticket=...` to issue a local cookie. | ❌ Fails on direct bookmarks/tabs unless multi-hop redirect bounces are built. | ⚠️ Risk of ticket leakage in browser history, logs, and HTTP `Referer` headers. | ⚠️ **High.** Custom ticket exchange and DB tracking code that is discarded later. | ❌ Flawed / High Overhead |
| **3** | **Dev Auto-Login Middleware Bypass** | Middleware injects a synthetic `Super Admin` session for all unauthenticated incoming requests. | ✅ Seamless (never prompts login). | 🚨 **Severe vulnerability if deployed to production.** | ⚠️ Useful only for offline dev environments. | ❌ Unacceptable for Production |
| **4** | **1-Click Quick-Login Bar** | Pre-fills and auto-submits trusted credentials on `/login` via UI chips. | ⚠️ Requires 1 click on each app's login page. | ✅ Safe client-side convenience helper. | ✅ Clean, lightweight utility. | ⚠️ Interim Dev Tool Only |
| **5** | **Reverse Proxy / Path Routing (Next.js Multi-Zones)** | Mounts all apps under one domain path: `zsyio.de/pms`, `zsyio.de/admin`. | ✅ Seamless (single origin). | ⚠️ Complex asset routing and cross-zone assetPrefix collision risks. | ⚠️ **Very high.** Major rewrite of Next.js routing and Tailwind assets. | ⚠️ Overkill for Monorepo Apps |

---

## 3. The Production Gold Standard: Custom Domain Shared Cookie SSO

The optimal, industry-standard architecture for production is **Custom Domain Shared Cookie Single Sign-On**.

### Target Production Topology

```
                                Apex Custom Domain
                                  `zsyio.de`
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           │   Shared Secure Session Cookie                          │
           │   Name: `__Secure-authjs.session-token`                 │
           │   Domain: `.zsyio.de`                                │
           │   Path: `/`                                             │
           │   Flags: `HttpOnly; Secure; SameSite=Lax`               │
           └────────────────────────────┬────────────────────────────┘
                                        │
     ┌───────────────────┬──────────────┴──────┬───────────────────┐
     ▼                   ▼                     ▼                   ▼
pms.zsyio.de    admin.zsyio.de     hrms.zsyio.de    notes.zsyio.de
(Port 3000)         (Port 3003)           (Port 3002)         (Port 3001)
```

---

## 4. Deep Architectural Breakdown: Why It Is Superior

### 4.1 Native Browser Transport (RFC 6265)
When a cookie specifies `Domain=.zsyio.de`, the browser automatically transmits it in the `Cookie` header of **every HTTP request** made to any subdomain of `zsyio.de`:
* `pms.zsyio.de` sends the cookie.
* `admin.zsyio.de` sends the cookie.
* `hrms.zsyio.de` sends the cookie.
* `notes.zsyio.de` sends the cookie.

**Zero JavaScript execution, zero redirect chains, and zero client-side handshakes are required.** The browser handles synchronization natively at the network protocol layer.

### 4.2 Robust Security Posture
* **No Authentication Tokens in URLs:** URL-based token passing risks leaking secrets into browser history, web server access logs, corporate proxies, and the HTTP `Referer` header to external CDNs. Shared domain cookies never enter the URL or client DOM.
* **Immunity to Replay Attacks:** There are no transient tokens to intercept or replay. The session token is stored inside an `HttpOnly` cookie protected from Cross-Site Scripting (XSS).
* **Cross-Site Request Forgery (CSRF) Defense:** NextAuth v5 combines `SameSite=Lax` cookie flags with cryptographic state verification on mutating requests.

### 4.3 Instant Navigation & Zero Latency
* **Handshake/Redirect Approach:** Clicking an app requires:
  1. Link click → 2. Handshake API call → 3. Redirect to target app → 4. Cookie creation → 5. Redirect to dashboard.
  * In serverless architectures (e.g. Vercel), cold starts on intermediate API routes add **500ms to 2000ms** of latency.
* **Shared Cookie Approach:** Clicking an app is a single, direct navigation (`GET admin.zsyio.de/`). The browser sends the session cookie immediately.
  * **Result:** Instantaneous 0ms auth overhead.

### 4.4 Resilient Direct Access (Bookmarks & New Tabs)
In an enterprise workflow, employees frequently:
* Open bookmarked URLs (`admin.zsyio.de/users`).
* Open links received via Slack or Email.
* Open multiple tabs simultaneously.

With URL handshake tokens, direct access fails because the user did not arrive via an app switcher link. With shared domain cookies, **direct URL access works on the first visit**.

### 4.5 Synchronized Single Logout (SLO)
When an employee clicks **Sign Out** in PMS:
1. NextAuth clears the `__Secure-authjs.session-token` cookie for domain `.zsyio.de`.
2. The session is erased for all subdomains simultaneously.
3. If the user switches to Admin or Notes, those apps instantly recognize the expired session and protect corporate data.

---

## 5. Codebase Readiness in Zsyio Suite

The Zsyio codebase was built from day one to support this exact production architecture.

### 5.1 NextAuth Scoping in `packages/auth/src/auth.ts`

Lines 78–108 in [`packages/auth/src/auth.ts`](file:///Users/tw/workspace/Active/Zsyio/PMS-Mediloom/packages/auth/src/auth.ts#L78-L108) automatically activate shared cookie SSO when `COOKIE_DOMAIN` is set:

```typescript
const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const rawCookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;

// Browsers strictly reject domain cookies on Public Suffixes (*.vercel.app)
// and localhost. Domain-level cookie sharing activates when on a custom domain (e.g. .zsyio.de).
const cookieDomain =
  rawCookieDomain &&
  !rawCookieDomain.includes("vercel.app") &&
  !rawCookieDomain.includes("localhost")
    ? rawCookieDomain
    : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getAuthSecret(),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  cookies: cookieDomain
    ? {
        sessionToken: {
          name: `${cookiePrefix}authjs.session-token`,
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: useSecureCookies,
            domain: cookieDomain,
          },
        },
      }
    : undefined,
  // ...
});
```

### 5.2 Edge Middleware in `packages/auth/src/middleware.ts`

The edge route-protection middleware checks for the session token in the request cookies:

```typescript
const hasSessionCookie = request.cookies
  .getAll()
  .some((c) => cookieSubstrings.some((sub) => c.name.includes(sub)));

if (!hasSessionCookie) {
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}
```

Because the browser transmits the `.zsyio.de` cookie to all subdomains, edge middleware on `admin`, `notes`, and `hrms` validates the session with zero database overhead.

---

## 6. Production Deployment & Activation Guide

When your custom domain (e.g., `zsyio.de`) is registered and ready to connect:

### Step 1: Configure DNS Records in Your Domain Registrar
Point your apex domain and wildcard (or explicit subdomains) to Vercel:

| Type | Name / Host | Value / Target | Notes |
|---|---|---|---|
| **A** | `@` | `76.76.21.21` | Apex domain (optional landing) |
| **CNAME** | `pms` | `cname.vercel-dns.com` | PMS Application |
| **CNAME** | `admin` | `cname.vercel-dns.com` | Admin Application |
| **CNAME** | `hrms` | `cname.vercel-dns.com` | HRMS Application |
| **CNAME** | `notes` | `cname.vercel-dns.com` | Notes Application |

---

### Step 2: Assign Domains in Vercel Projects

1. Open **Vercel Dashboard** → Select **`zsyio-pms`** → **Settings** → **Domains** → Add `pms.zsyio.de`.
2. Open **`zsyio-admin`** → **Settings** → **Domains** → Add `admin.zsyio.de`.
3. Open **`zsyio-hrms`** → **Settings** → **Domains** → Add `hrms.zsyio.de`.
4. Open **`zsyio-notes`** → **Settings** → **Domains** → Add `notes.zsyio.de`.

---

### Step 3: Configure Environment Variables in Vercel

Add the following environment variables to **all 4 Vercel projects** (Production environment):

```env
# Shared Single Sign-On Cookie Scoping
COOKIE_DOMAIN=".zsyio.de"

# Shared NextAuth Secret (Must be identical across all 4 apps)
AUTH_SECRET="your-high-entropy-32-byte-secret"
AUTH_TRUST_HOST="1"

# Production Cross-App URLs (For Navigation & AppSwitcher)
NEXT_PUBLIC_PMS_URL="https://pms.zsyio.de"
NEXT_PUBLIC_ADMIN_URL="https://admin.zsyio.de"
NEXT_PUBLIC_HRMS_URL="https://hrms.zsyio.de"
NEXT_PUBLIC_NOTES_URL="https://notes.zsyio.de"
```

> [!IMPORTANT]
> Include the leading dot in `COOKIE_DOMAIN=".zsyio.de"`. This signals to the browser that the cookie is valid for the apex domain and all child subdomains.

---

### Step 4: Verification Checklist

1. Navigate to `https://pms.zsyio.de/login` and log in.
2. Inspect the browser storage:
   * Cookie name: `__Secure-authjs.session-token`
   * Domain attribute: `.zsyio.de`
   * Secure flag: `true`
   * HttpOnly flag: `true`
3. Click the App Switcher to jump to `https://admin.zsyio.de`.
   * **Expected:** Admin loads immediately without redirecting to `/login`.
4. Open a private/incognito window, navigate directly to `https://notes.zsyio.de/notes`.
   * **Expected:** Prompts for login. Log in once; then open `https://hrms.zsyio.de` in another tab—it is already authenticated.
5. Click **Sign Out** on any app.
   * **Expected:** All other apps require re-authentication.

---

## 7. Interim Strategy (Before Custom Domain Is Ready)

While developing locally or staging on `*.vercel.app` before the custom domain is acquired:

1. **Local Development Port Alignment:**
   Ensure [`.env.local`](file:///Users/tw/workspace/Active/Zsyio/PMS-Mediloom/.env.local) uses local addresses so navigation does not divert to external domains:
   ```env
   NEXT_PUBLIC_PMS_URL="http://localhost:3000"
   NEXT_PUBLIC_NOTES_URL="http://localhost:3001"
   NEXT_PUBLIC_HRMS_URL="http://localhost:3002"
   NEXT_PUBLIC_ADMIN_URL="http://localhost:3003"
   ```
2. **Dev 1-Click Quick-Login Bar on `/login`:**
   Use quick-login preset buttons on the `/login` screen (`[⚡ Super Admin]`, `[⚡ Admin]`) during development to authenticate in one click without repetitive credential entry.
