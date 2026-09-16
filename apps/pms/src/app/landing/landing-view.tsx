"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Workflow,
  FileText,
  Fingerprint,
  Terminal,
  Target,
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
  KeyRound,
  Bot,
  Play,
  Pause,
  Copy,
  Check,
  ChevronRight,
  Database,
  CheckCircle2,
} from "lucide-react";
import { Logo, ThemeToggle, motion, transitions, cn } from "@zsyio/ui";

interface LandingViewProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  appUrls: {
    pms: string;
    notes: string;
    hrms: string;
    admin: string;
    sales: string;
  };
}

const ENTERPRISE_SPECS = [
  {
    id: "sso",
    category: "Architecture & SSO",
    title: "Apex-Domain Cryptographic Session Orchestration",
    summary:
      "Zsyio issues an ed25519-signed session token scoped to your apex root domain (.yourcompany.com). Next.js Edge middleware on every subdomain validates incoming sessions in < 2ms without cross-origin database queries.",
    statLabel: "Token validation latency",
    statValue: "< 1.8ms",
    badge: "Zero-Trust",
    code: `// packages/auth/src/middleware.ts
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
const session = await verifyApexSession(req.cookies.get("zsyio_auth"));`,
  },
  {
    id: "domain",
    category: "Corporate Whitelist",
    title: "Domain Restriction & Tenant Isolation",
    summary:
      "Enforce organization-wide identity boundaries at DNS edge. Admin console allows defining trusted email domains (e.g. @yourcompany.com). Unmatched logins and invitations are rejected with cryptographic audit trails.",
    statLabel: "Domain lookup overhead",
    statValue: "0 ms (Edge cache)",
    badge: "Policy Gate",
    code: `// packages/auth/src/domain-restriction.ts
const isAllowed = isDomainAllowed(userEmail, tenant.allowedDomains);
if (!isAllowed) throw new DomainRestrictionError();`,
  },
  {
    id: "rbac",
    category: "Granular RBAC",
    title: "Atomic 40+ Permission Capability Matrix",
    summary:
      "Granular role-based capability model decoupled across all 5 suite subdomains. A lead developer can possess full Admin rights in Flow and Canvas, Employee rights in People, and zero access to Pulse and Console.",
    statLabel: "Permission grants",
    statValue: "42 atomic flags",
    badge: "RBAC Matrix",
    code: `// packages/auth/src/permissions.ts
export const canEditSprint = hasPermission(user, "tasks:write");
export const canViewSalaries = hasPermission(user, "hrms:payroll:read");`,
  },
  {
    id: "deploy",
    category: "Self-Hosting & Cloud",
    title: "Private Cloud, Docker, & Kubernetes Ready",
    summary:
      "Engineered on Next.js 15, Turborepo, and PostgreSQL/Prisma. Deploy entirely within your sovereign AWS VPC, Azure tenant, Google Cloud, or on-premises Docker swarm with zero proprietary cloud dependencies.",
    statLabel: "Docker cold start",
    statValue: "< 850ms",
    badge: "Self-Hostable",
    code: `docker compose up -d
# Running 5 apps + PostgreSQL + Redis proxy
# Endpoints bound to *.internal.net`,
  },
];

export function LandingView({ user, appUrls }: LandingViewProps) {
  const [activeSpec, setActiveSpec] = useState<number>(0);

  // Interactive Live Timer Simulator
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(9918); // 02:45:18

  // Interactive Code Copy Simulator
  const [copiedCode, setCopiedCode] = useState(false);

  // Active Subdomain in interactive visual
  const [activeNode, setActiveNode] = useState<string>("pms");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCopyCode = () => {
    setCopiedCode(true);
    navigator.clipboard?.writeText?.(
      'COOKIE_DOMAIN = ".yourcompany.com";\nexport const session = await auth();'
    );
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20 selection:text-primary transition-colors duration-200 overflow-x-hidden font-sans">
      {/* ── Subtle Geometric Dot Grid Pattern ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.015] dark:opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Floating "Fluid Island" Navigation Bar ────────────────────── */}
      <header className="sticky top-4 z-50 px-4 sm:px-6 max-w-5xl mx-auto transition-all duration-300">
        <div className="rounded-full border border-border/80 bg-background/85 dark:bg-card/85 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/25 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <Link
            href="/landing"
            className="flex items-center gap-2.5 group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Logo variant="full" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
              Suite 2.0
            </span>
          </Link>

          {/* Center Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-5 text-xs font-semibold text-muted-foreground"
          >
            <a
              href="#bento"
              className="hover:text-foreground transition-colors rounded-full py-1 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Bento Grid
            </a>
            <a
              href="#apps"
              className="hover:text-foreground transition-colors rounded-full py-1 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              5 Modules
            </a>
            <a
              href="#architecture"
              className="hover:text-foreground transition-colors rounded-full py-1 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Architecture
            </a>
            <a
              href="#faq"
              className="hover:text-foreground transition-colors rounded-full py-1 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Controls: Nested Island Button */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {user ? (
              <Link
                href="/"
                className="group inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span>Dashboard</span>
                <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span>Launch Suite</span>
                  <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Landing Content ──────────────────────────────────────── */}
      <main className="relative z-10">
        {/* ── 1. Hero Section (Strict Hero Discipline) ─────────────────── */}
        <section className="pt-20 sm:pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          {/* Headline (Max 2 lines desktop) */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-foreground max-w-4xl mx-auto leading-[1.06]"
          >
            One Cohesive Suite.{" "}
            <span className="text-primary">
              Engineered In Harmony.
            </span>
          </motion.h1>

          {/* Subtext (Max 20 words, punchy) */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Unify Flow, Canvas, People, Console, and Pulse. A single sign-on experience built for maximum team velocity and zero SaaS fragmentation.
          </motion.p>

          {/* Island Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <Link
              href={user ? "/" : "/login"}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 pl-6 pr-2 py-3 rounded-full text-sm font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span>{user ? "Open Flow Workspace" : "Enter Zsyio Workspace"}</span>
              <span className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <a
              href="#apps"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-border/80 hover:border-primary/40 bg-surface-subtle/80 hover:bg-surface-elevated text-foreground transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Layers className="w-4 h-4 text-primary" />
              <span>Explore Applications</span>
            </a>
          </motion.div>

          {/* Micro Proof Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-12 pt-8 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-foreground">5 APPS</span>
              <p className="text-[11px] text-muted-foreground">PMS, Notes, HRMS, Sales, Admin</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">SUB-10MS</span>
              <p className="text-[11px] text-muted-foreground">Edge Cookie Authentication</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-primary">MERMAID</span>
              <p className="text-[11px] text-muted-foreground">Live Deployed Architecture Graphs</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">ZERO TOKENS</span>
              <p className="text-[11px] text-muted-foreground">100% Guarded CSS Design System</p>
            </div>
          </motion.div>
        </section>

        {/* ── 2. Unified Suite Application Showcase ──────────────────── */}
        <section id="apps" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
                SUITE APPLICATIONS
              </span>
              <h2 className="mt-1.5 text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
                The Complete Operating Canvas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Engineered with concentric double-bezel cards and interactive hardware widgets. Try interacting with any element below.
            </p>
          </div>

          {/* ── BENTO GRID WITH DOUBLE-BEZEL HARDWARE SHELLS ───────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5" id="apps">
            {/* ── Bento Card 1: Flow (PMS) - Main Stage (Col 7) ────────── */}
            <div className="lg:col-span-7 rounded-[2rem] p-1.5 bg-surface-subtle/60 border border-border/80 shadow-md group hover:border-primary/40 transition-all">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card p-6 sm:p-7 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Workflow className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base font-display text-foreground">Zsyio Flow</h3>
                        <p className="text-[11px] text-muted-foreground font-mono">Agile Sprints & Velocity</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-primary border border-blue-500/20">
                      +38% Velocity
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                    High-velocity sprint management with live active timers, multi-column Kanban pipelines, and automated test sheets.
                  </p>

                  {/* Interactive Simulated Kanban & Active Timer */}
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-4 space-y-3 backdrop-blur-sm shadow-xs">
                    {/* Live Active Timer Strip */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle/80 border border-border/70 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 w-11 h-11 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                          aria-label={isTimerRunning ? "Pause Sprint Task Timer" : "Start Sprint Task Timer"}
                        >
                          {isTimerRunning ? <Pause className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                        </button>
                        <div>
                          <div className="font-mono font-bold text-primary text-xs">
                            {formatTimer(timerSeconds)}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate block">
                            FLW-402: Root Cookie Session Tunnel
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
                        Active Now
                      </span>
                    </div>

                    {/* Kanban Columns Preview */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-surface-subtle/40 border border-border/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase">Todo</span>
                        <div className="p-2 rounded-lg bg-card border border-border/70 font-medium text-[11px] truncate shadow-2xs">
                          Audit Log Schema
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-subtle/40 border border-border/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-primary font-mono uppercase">In Review</span>
                        <div className="p-2 rounded-lg bg-card border border-primary/30 font-medium text-[11px] truncate shadow-2xs">
                          RBAC Matrix Grants
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-subtle/40 border border-border/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-600 font-mono uppercase">Shipped</span>
                        <div className="p-2 rounded-lg bg-card border border-border/70 font-medium text-[11px] truncate shadow-2xs">
                          ZeptoMail SMTP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Portfolio SLA: 100% On Time</span>
                  <a
                    href={appUrls.pms}
                    className="font-bold text-primary hover:text-primary-hover flex items-center gap-1 group/link rounded py-0.5 px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span>Launch Flow</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Bento Card 2: Canvas (Notes) - Architecture Hub (Col 5) ─ */}
            <div className="lg:col-span-5 rounded-[2rem] p-1.5 bg-surface-subtle/60 border border-border/80 shadow-md group hover:border-sky-500/40 transition-all">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card p-6 sm:p-7 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base font-display text-foreground">Zsyio Canvas</h3>
                        <p className="text-[11px] text-muted-foreground font-mono">Docs & Mermaid Architecture</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      RFC-042 Ready
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                    Distraction-free markdown with deployed Mermaid SVG architecture graphs, Edit/Preview toggles, and document backlinks.
                  </p>

                  {/* Simulated Document Snippet */}
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-4 space-y-2.5 backdrop-blur-sm text-xs font-mono shadow-xs">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-2 border-b border-border/70">
                      <span className="font-sans font-bold text-foreground">RFC-042: Event-Driven Kafka</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 -mr-1.5 flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                        aria-label="Copy RFC SSO code snippet"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-sans font-medium">{copiedCode ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      {"// Deployed Mermaid architecture graph"}
                    </div>
                    <div className="text-sky-600 dark:text-sky-400 text-[11px]">
                      graph LR: Postgres --&gt; Kafka --&gt; Zsyio
                    </div>
                    <div className="text-foreground text-[11px]">
                      export const session = await auth();
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">12,000+ Team Knowledge Docs</span>
                  <a
                    href={appUrls.notes}
                    className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 group/link rounded py-0.5 px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    <span>Launch Canvas</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Bento Card 3: People (HRMS) - Workforce & Clock (Col 4) ── */}
            <div className="lg:col-span-4 rounded-[2rem] p-1.5 bg-surface-subtle/60 border border-border/80 shadow-md group hover:border-emerald-500/40 transition-all">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card p-6 sm:p-7 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base font-display text-foreground">Zsyio People</h3>
                        <p className="text-[11px] text-muted-foreground font-mono">HRMS & Attendance</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      99.9% Audit
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    One-tap punch station, shift timers, leave balance accounting, and regularization approvals.
                  </p>

                  {/* Attendance Barometer Widget */}
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-3.5 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping motion-reduce:animate-none" />
                        Clocked In: 08:58 AM
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">Today</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Team Presence: <span className="text-foreground font-bold font-mono">94% Present</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 w-[94%]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">18 PTO Days Remaining</span>
                  <a
                    href={appUrls.hrms}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 group/link rounded py-0.5 px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <span>Launch People</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Bento Card 4: Pulse (Sales) - Deals & Funnel (Col 4) ──── */}
            <div className="lg:col-span-4 rounded-[2rem] p-1.5 bg-surface-subtle/60 border border-border/80 shadow-md group hover:border-amber-500/40 transition-all">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card p-6 sm:p-7 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base font-display text-foreground">Zsyio Pulse</h3>
                        <p className="text-[11px] text-muted-foreground font-mono">CRM & Deal Funnel</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      $4.2M Pipeline
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Visual lead progression pipelines, stage probability forecasting, and sales velocity metrics.
                  </p>

                  {/* Pipeline Card Widget */}
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-3.5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">BioHealth EU</span>
                      <span className="font-mono font-bold text-emerald-600">$180,000</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Negotiation Stage</span>
                      <span className="text-amber-500 font-bold font-mono">80% Probability</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 w-[80%]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">+26% Conversion Rate</span>
                  <a
                    href={appUrls.sales}
                    className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 group/link rounded py-0.5 px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <span>Launch Pulse</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Feature Card 5: Console (Admin) - Governance (Col 4) ────── */}
            <div className="lg:col-span-4 rounded-[2rem] p-1.5 bg-surface-subtle/60 border border-border/80 shadow-md group hover:border-primary/40 transition-all">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card p-6 sm:p-7 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <Terminal className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base font-display text-foreground">Zsyio Console</h3>
                        <p className="text-[11px] text-muted-foreground font-mono">Security & Governance</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary">
                      40+ Permissions
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Zero-trust identity management, corporate domain whitelist guards, and granular RBAC matrices.
                  </p>

                  {/* Domain & RBAC Widget */}
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-3.5 space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Domain Restriction:</span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded text-[10px]">
                        @zsyio.com
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Active Team Members:</span>
                      <span className="text-foreground font-bold font-mono">48 Verified Users</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Strict Mode Enabled</span>
                  <a
                    href={appUrls.admin}
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 group/link rounded py-0.5 px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <span>Launch Console</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Bento Card 6: SSO Architecture (Col 8) ───────────────── */}
            <div className="lg:col-span-8 rounded-[2rem] p-1.5 bg-surface-subtle/60 border border-border/80 shadow-md group hover:border-primary/40 transition-all">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card p-6 sm:p-7 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base font-display text-foreground">
                        Unified Root Cookie SSO Architecture
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Shared cross-subdomain authentication across every port and service
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Authenticate once in any module and a hardened cryptographic cookie transmits automatically across the entire monorepo without OAuth handshake overhead.
                  </p>

                  {/* Interactive Subdomain Nodes Visual */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { key: "pms", name: "Flow", port: ":3000", color: "text-primary" },
                      { key: "notes", name: "Canvas", port: ":3001", color: "text-sky-500" },
                      { key: "hrms", name: "People", port: ":3002", color: "text-emerald-500" },
                      { key: "admin", name: "Console", port: ":3003", color: "text-purple-500" },
                      { key: "sales", name: "Pulse", port: ":3004", color: "text-amber-500" },
                    ].map((node) => (
                      <button
                        key={node.key}
                        type="button"
                        onClick={() => setActiveNode(node.key)}
                        className={cn(
                          "p-3 rounded-2xl border transition-all cursor-pointer text-left sm:text-center",
                          activeNode === node.key
                            ? "bg-primary/10 border-primary/40 shadow-xs"
                            : "bg-surface-subtle/80 border-border/70 hover:bg-surface-elevated"
                        )}
                      >
                        <div className={cn("font-bold text-xs", node.color)}>{node.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{node.port}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    AES-256 GCM Cookie Encryption
                  </span>
                  <span className="text-emerald-500 font-mono font-bold">100% Zero Re-auth</span>
                </div>
              </div>
            </div>

            {/* ── Bento Card 7: Gemini AI Accelerator (Col 4) ─────────── */}
            <div className="lg:col-span-4 rounded-[2rem] p-1.5 bg-surface-subtle/60 border border-border/80 shadow-md group hover:border-indigo-500/40 transition-all">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card p-6 sm:p-7 h-full flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base font-display text-foreground">
                        Gemini AI Accelerators
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Automated code and task assistance</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Synthesize conventional git branch names, compile automated test sheets, and generate PR summaries from ticket requirements with one click.
                  </p>

                  {/* AI Terminal Output */}
                  <div className="rounded-2xl border border-border/70 bg-surface-subtle/70 p-3.5 text-[11px] font-mono space-y-1.5 shadow-xs">
                    <div className="text-muted-foreground">{"// Prompt: \"Add SSO token support\""}</div>
                    <div className="text-indigo-600 dark:text-indigo-400 font-bold truncate">
                      $ git checkout -b feat/FLW-402-sso-tunnel
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                      ✓ 4 Unit test cases generated
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Gemini 2.5 Flash</span>
                  <span className="text-primary font-bold">Built-In</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. High-Impact Architecture Section ──────────────────────── */}
        <section id="architecture" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto scroll-mt-24">
          <div className="rounded-[2.5rem] p-1.5 bg-surface-subtle/60 border border-border/80 shadow-xl">
            <div className="rounded-[calc(2.5rem-0.375rem)] bg-card p-6 sm:p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
                  ENGINEERING CORE
                </span>
                <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold font-display text-foreground">
                  Monorepo Modularity. Enterprise Scale.
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Shared packages guarantee continuous design compliance and type safety while allowing individual teams to deploy modules independently.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-surface-subtle/70 border border-border/70 space-y-2 shadow-xs hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <KeyRound className="w-4 h-4 text-primary" />
                    <span>@zsyio/auth</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    NextAuth v5 session engine, domain enforcement, and bcrypt encryption.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-subtle/70 border border-border/70 space-y-2 shadow-xs hover:border-indigo-500/40 transition-colors">
                  <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>@zsyio/ui</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    SuiteSidebar, SuiteHeader, frosted glass tokens, and responsive charts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-subtle/70 border border-border/70 space-y-2 shadow-xs hover:border-sky-500/40 transition-colors">
                  <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <Database className="w-4 h-4 text-sky-500" />
                    <span>@zsyio/database</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Shared multi-tenant Prisma client and PostgreSQL transaction pooler.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-subtle/70 border border-border/70 space-y-2 shadow-xs hover:border-purple-500/40 transition-colors">
                  <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span>@zsyio/validators</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Type-safe Zod schema validation across all API routes and contracts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Interactive Enterprise Specifications Matrix ─────────── */}
        <section id="specs" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-24">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
              TECHNICAL SPECIFICATIONS
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-foreground tracking-tight">
              Built for High-Stakes Production Environments
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Deep dive into single sign-on orchestration, DNS edge policies, and deployment blueprints.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Spec Selectors */}
            <div className="lg:col-span-5 space-y-2.5" role="tablist" aria-label="Enterprise specifications">
              {ENTERPRISE_SPECS.map((spec, idx) => {
                const isActive = activeSpec === idx;
                return (
                  <button
                    key={spec.id}
                    role="tab"
                    id={`spec-tab-${idx}`}
                    aria-selected={isActive}
                    aria-controls={`spec-panel-${idx}`}
                    onClick={() => setActiveSpec(idx)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex flex-col gap-1 relative overflow-hidden",
                      isActive
                        ? "bg-surface-elevated border-primary/40 shadow-sm"
                        : "bg-surface-subtle/60 border-border/80 hover:bg-surface-elevated hover:border-border"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-md" />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
                        {spec.category}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-border/80 bg-background/80 text-muted-foreground">
                        {spec.badge}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground tracking-tight">
                      {spec.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Double-Bezel Hardware Architecture Viewer */}
            <div className="lg:col-span-7">
              {ENTERPRISE_SPECS[activeSpec] && (
                <div
                  id={`spec-panel-${activeSpec}`}
                  role="tabpanel"
                  aria-labelledby={`spec-tab-${activeSpec}`}
                  className="rounded-[2rem] p-1.5 border border-border/80 bg-surface-subtle/80 backdrop-blur-xl shadow-xl transition-all"
                >
                  <div className="rounded-[calc(2rem-0.375rem)] bg-card border border-border/60 p-6 sm:p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] space-y-5">
                    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                          {ENTERPRISE_SPECS[activeSpec].category}
                        </span>
                        <h3 className="text-lg font-bold text-foreground font-display">
                          {ENTERPRISE_SPECS[activeSpec].title}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-[10px] font-mono uppercase text-muted-foreground">
                          {ENTERPRISE_SPECS[activeSpec].statLabel}
                        </span>
                        <span className="text-sm font-mono font-bold text-foreground tabular-nums">
                          {ENTERPRISE_SPECS[activeSpec].statValue}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {ENTERPRISE_SPECS[activeSpec].summary}
                    </p>

                    {/* Architecture Code/Config Terminal Box */}
                    <div className="rounded-xl border border-border/80 bg-surface-subtle/90 overflow-hidden shadow-2xs">
                      <div className="px-3.5 py-2 border-b border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground bg-surface-subtle">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-primary" />
                          <span>Implementation Verification</span>
                        </span>
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active Spec
                        </span>
                      </div>
                      <pre className="p-3.5 text-[11px] sm:text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed select-all">
                        <code>{ENTERPRISE_SPECS[activeSpec].code}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 5. Bottom Call to Action Banner (Double Bezel) ──────────── */}
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          <div className="rounded-[2.5rem] p-1.5 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-sky-500/20 border border-primary/30 shadow-2xl">
            <div className="rounded-[calc(2.5rem-0.375rem)] bg-card/95 backdrop-blur-md p-8 sm:p-14 relative overflow-hidden">
              <div className="relative z-10 max-w-2xl mx-auto">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Deployment</span>
                </span>

                <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight">
                  Unify Your Company&apos;s Workflows Today
                </h2>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Connect your engineering, HR, administration, and sales teams in one single, high-performing environment.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={user ? "/" : "/login"}
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 pl-6 pr-2 py-3 rounded-full text-sm font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span>{user ? "Open Dashboard" : "Sign In to Suite"}</span>
                    <span className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                  <a
                    href="#bento"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border border-border/80 bg-surface-subtle/80 hover:bg-surface-elevated text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span>Explore Bento Cards</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/80 bg-surface-subtle/40 text-muted-foreground text-xs py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo variant="mark" />
            <div>
              <span className="font-bold text-foreground text-sm font-display">ZSYIO SUITE</span>
              <p className="text-[11px] text-muted-foreground">The unified enterprise operating system</p>
            </div>
          </div>

          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 font-medium"
          >
            <a
              href={appUrls.pms}
              className="hover:text-foreground transition-colors rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Flow (PMS)
            </a>
            <a
              href={appUrls.notes}
              className="hover:text-foreground transition-colors rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Canvas (Notes)
            </a>
            <a
              href={appUrls.hrms}
              className="hover:text-foreground transition-colors rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              People (HRMS)
            </a>
            <a
              href={appUrls.admin}
              className="hover:text-foreground transition-colors rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Console (Admin)
            </a>
            <a
              href={appUrls.sales}
              className="hover:text-foreground transition-colors rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Pulse (Sales)
            </a>
          </nav>

          <div className="text-[11px] font-mono text-muted-foreground/80">
            © {new Date().getFullYear()} Zsyio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
