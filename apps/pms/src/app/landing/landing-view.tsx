"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Lock,
  Server,
  Activity,
  Globe,
  Users,
  BarChart3,
  Calendar,
  Clock,
  ExternalLink,
  ChevronDown,
  Cpu,
  Zap,
  Search,
  X,
  Command,
  Sun,
  Moon,
  AlertCircle,
  HelpCircle,
  Radio,
  Sliders,
} from "lucide-react";
import {
  Logo,
  ThemeToggle,
  motion,
  AnimatePresence,
  transitions,
  cn,
  PulseDot,
  AnimatedNumber,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@zsyio/ui";

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
    tableRows: [
      { feature: "Apex SSO", description: "Cryptographic root session delegation" },
      { feature: "SSO Matrix", description: "Zero-Trust multi-tenant isolation" },
      { feature: "Edge Latency", description: "< 1.8ms ed25519 verification overhead" },
      { feature: "Security Model", description: "HttpOnly, Secure, SameSite=Lax root cookie" },
    ],
    code: `// packages/auth/src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@zsyio/auth-sdk";

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("__Host-zsyio-session")?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const payload = await verifySessionToken(sessionToken);
  const response = NextResponse.next();
  response.headers.set("X-Zsyio-Session-Id", payload.sessionId);
  return response;
}`,
  },
  {
    id: "domain",
    category: "Corporate Whitelist",
    title: "Domain Restriction & Tenant Isolation",
    summary:
      "Enforce organization-wide identity boundaries at DNS edge. Admin console allows defining trusted corporate domains (e.g. @yourcompany.com). Unmatched logins and invitations are rejected with cryptographic audit trails.",
    statLabel: "Domain lookup overhead",
    statValue: "0 ms (Edge cache)",
    badge: "Policy Gate",
    tableRows: [
      { feature: "DNS Boundary", description: "Corporate email wildcard domain matching" },
      { feature: "Edge Enforcement", description: "Zero-overhead in-memory regex policy lookup" },
      { feature: "Audit Logging", description: "Tamper-evident RFC-3161 audit trail" },
      { feature: "Invitation Gate", description: "Strict external collaborator isolation" },
    ],
    code: `// packages/auth/src/domain-restriction.ts
export function isDomainAllowed(email: string, allowedDomains: string[]): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.some((pattern) => {
    if (pattern.startsWith("*.")) {
      return domain.endsWith(pattern.slice(2));
    }
    return domain === pattern.toLowerCase();
  });
}`,
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
    tableRows: [
      { feature: "Role Capabilities", description: "42 fine-grained permissions per subdomain" },
      { feature: "Decoupled Access", description: "Engineers restricted from payroll/sales CRM" },
      { feature: "Tenant Scoping", description: "Organization-level inheritance hierarchy" },
      { feature: "Evaluation Time", description: "Sub-millisecond bitwise permission checks" },
    ],
    code: `// packages/auth/src/permissions.ts
export const PERMISSIONS = {
  CAN_EDIT_SPRINT: "tasks:write",
  CAN_VIEW_SALARIES: "hrms:payroll:read",
  CAN_CLOSE_DEALS: "sales:pipeline:manage",
  CAN_MANAGE_DOMAINS: "admin:governance:write",
} as const;

export const canEditSprint = hasPermission(user, PERMISSIONS.CAN_EDIT_SPRINT);`,
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
    tableRows: [
      { feature: "Container Ready", description: "Multi-stage alpine Dockerfile included" },
      { feature: "Database Layer", description: "PostgreSQL 16 with PgBouncer connection pool" },
      { feature: "Sovereign Cloud", description: "Air-gapped VPC and Kubernetes helm charts" },
      { feature: "Zero Vendor Lock", description: "Open source Prisma ORM and Next.js engine" },
    ],
    code: `// docker-compose.prod.yml
services:
  zsyio-pms:
    image: ghcr.io/zsyio/pms:latest
    environment:
      - COOKIE_DOMAIN=.yourcompany.com
      - DATABASE_URL=postgresql://postgres:secret@db:5432/zsyio
    ports:
      - "3000:3000"`,
  },
];

const EDGE_REGIONS = [
  { name: "Frankfurt (fra1)", ping: "1.2ms", status: "Optimal" },
  { name: "San Francisco (sfo1)", ping: "1.4ms", status: "Optimal" },
  { name: "Tokyo (nrt1)", ping: "1.8ms", status: "Optimal" },
  { name: "Singapore (sin1)", ping: "1.7ms", status: "Optimal" },
  { name: "London (lhr1)", ping: "0.9ms", status: "Optimal" },
];

export function LandingView({ user, appUrls }: LandingViewProps) {
  const [activeSpec, setActiveSpec] = useState<number>(0);

  // Interactive Live Timer Simulator for Flow
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(9918); // 02:45:18

  // Interactive Code Copy Simulators
  const [copiedHeroCode, setCopiedHeroCode] = useState(false);
  const [copiedSpecCode, setCopiedSpecCode] = useState(false);
  const [copiedDockerCmd, setCopiedDockerCmd] = useState(false);

  // Active Subdomain in interactive topology visual
  const [activeNode, setActiveNode] = useState<string>("pms");

  // Interactive Workbench Active Tab in the 3D Hero Preview
  const [workbenchTab, setWorkbenchTab] = useState<"pms" | "notes" | "hrms" | "sales" | "admin">("pms");

  // Command Palette Open State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  // Interactive Policy Simulator
  const [testEmail, setTestEmail] = useState("alex@yourcompany.com");
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingMultiplier, setPingMultiplier] = useState(1);

  // Keyboard shortcut listener for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard?.writeText?.(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePing = () => {
    setIsTestingPing(true);
    setPingMultiplier(Math.random() * 0.4 + 0.8);
    setTimeout(() => {
      setIsTestingPing(false);
    }, 1200);
  };

  // Policy validation logic
  const isEmailAllowed = (email: string) => {
    const domain = email.trim().split("@")[1]?.toLowerCase();
    if (!domain) return false;
    const allowed = ["yourcompany.com", "enterprise.org", "zsyio.internal"];
    return allowed.includes(domain);
  };

  const paletteItems = [
    { name: "Zsyio Flow (PMS)", desc: "Sprint backlog & Agile Kanban boards", url: appUrls.pms, icon: Workflow },
    { name: "Zsyio Canvas (Notes)", desc: "Architectural RFCs & Mermaid diagrams", url: appUrls.notes, icon: FileText },
    { name: "Zsyio People (HRMS)", desc: "Attendance regularizations & leave policies", url: appUrls.hrms, icon: Users },
    { name: "Zsyio Pulse (Sales)", desc: "Lead pipeline & deal conversion tracking", url: appUrls.sales, icon: BarChart3 },
    { name: "Zsyio Console (Admin)", desc: "DNS domain whitelisting & RBAC matrix", url: appUrls.admin, icon: Shield },
  ];

  const filteredPaletteItems = paletteItems.filter(
    (item) =>
      item.name.toLowerCase().includes(paletteQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20 selection:text-primary transition-colors duration-200 overflow-x-hidden font-sans">
      {/* ── Background Geometric Field & Floating Radiant Glow ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <motion.div
        animate={{
          scale: [0.95, 1.05, 0.95],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-primary blur-[140px] pointer-events-none z-0 rounded-full"
      />

      {/* ── Interactive Command Palette Modal (Cmd+K) ─────────────────── */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={transitions.snappy}
              className="w-full max-w-xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden"
            >
              <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  placeholder="Jump to suite app, architecture RFC, or specs..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={() => setIsCommandPaletteOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                {filteredPaletteItems.length > 0 ? (
                  filteredPaletteItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={idx}
                        href={item.url}
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-foreground block group-hover:text-primary transition-colors">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No matching modules found. Try searching &quot;Flow&quot; or &quot;Canvas&quot;.
                  </div>
                )}
              </div>

              <div className="px-3.5 py-2 border-t border-border/60 bg-surface-subtle flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Command className="w-3 h-3" />
                  <span>Navigate with keyboard</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-card border border-border/60">ESC to exit</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 1. Floating Pill Island Navigation Bar ────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={transitions.smooth}
        className="sticky top-4 z-40 px-4 sm:px-6 max-w-5xl mx-auto transition-all duration-300"
      >
        <div className="rounded-full border border-border/80 bg-background/80 dark:bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/25 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <Link
            href="/landing"
            className="flex items-center gap-2.5 group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Logo variant="full" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              <PulseDot color="bg-primary" auraColor="bg-primary/50" size="w-1.5 h-1.5" />
              Suite 2.0
            </span>
          </Link>

          {/* Center Links with Dropdown Menus */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-5 text-xs font-semibold text-muted-foreground"
          >
            {/* Platform Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hover:text-foreground transition-colors flex items-center gap-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded group cursor-pointer data-[state=open]:text-foreground"
                >
                  <span>Platform</span>
                  <ChevronDown className="w-3 h-3 opacity-60 transition-transform group-hover:translate-y-0.5 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={14}
                className="w-80 p-2 shadow-2xl rounded-2xl border border-border/80 bg-surface-elevated/95 backdrop-blur-xl"
              >
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1">
                  Suite Engines &amp; Applications
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild>
                  <a
                    href="#apps"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 mt-0.5 group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-xs">Zsyio Flow</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-primary/10 text-primary font-bold">
                          PMS
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Agile sprints, Kanban, &amp; engineering workflows
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href="#apps"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20 shrink-0 mt-0.5 group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-xs">Zsyio Canvas</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500/10 text-sky-500 font-bold">
                          Docs
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Collaborative knowledge base &amp; specs
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href="#apps"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0 mt-0.5 group-hover/item:bg-amber-500 group-hover/item:text-white transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-xs">Zsyio People</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold">
                          HRMS
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Attendance, multi-timezone timesheets &amp; leaves
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href="#apps"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-xs">Zsyio Pulse</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                          CRM
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Deal pipelines, lead attribution &amp; revenue
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href="#apps"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shrink-0 mt-0.5 group-hover/item:bg-purple-500 group-hover/item:text-white transition-colors">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-xs">Zsyio Console</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/10 text-purple-500 font-bold">
                          Admin
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Organization identity, domains &amp; RBAC governance
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Architecture Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hover:text-foreground transition-colors flex items-center gap-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded group cursor-pointer data-[state=open]:text-foreground"
                >
                  <span>Architecture</span>
                  <ChevronDown className="w-3 h-3 opacity-60 transition-transform group-hover:translate-y-0.5 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={14}
                className="w-80 p-2 shadow-2xl rounded-2xl border border-border/80 bg-surface-elevated/95 backdrop-blur-xl"
              >
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1">
                  Technical Architecture
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild>
                  <a
                    href="#architecture"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 mt-0.5 group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground text-xs block">Apex SSO Delegation</span>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Cryptographic ed25519 root session tokens verified in &lt; 2ms
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href="#specs"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20 shrink-0 mt-0.5 group-hover/item:bg-sky-500 group-hover/item:text-white transition-colors">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground text-xs block">Corporate Domain Isolation</span>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        DNS edge whitelist matching &amp; zero external data leakage
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href="#specs"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground text-xs block">Granular 42+ RBAC Matrix</span>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Subdomain capability scoping &amp; decoupled permission enforcement
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href="#specs"
                    className="flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-colors group/item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shrink-0 mt-0.5 group-hover/item:bg-purple-500 group-hover/item:text-white transition-colors">
                      <Server className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground text-xs block">Self-Hosted &amp; Kubernetes</span>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        Turborepo, Next.js 15, PostgreSQL &amp; zero vendor lock-in
                      </p>
                    </div>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href="#specs"
              className="hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Specs
            </a>
            <a
              href="#cta"
              className="hover:text-foreground transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Deploy
            </a>
          </nav>

          {/* Right Action Controls: Quick Launch Command Palette Trigger */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono text-muted-foreground hover:text-foreground bg-surface-subtle/80 hover:bg-surface-elevated border border-border/80 transition-all cursor-pointer shadow-2xs"
              title="Open Quick Switcher (⌘K)"
            >
              <Command className="w-3 h-3 text-primary" />
              <span>⌘K</span>
            </button>

            <ThemeToggle />

            {user ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span>Dashboard</span>
                  <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </motion.div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span>Launch Suite</span>
                    <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── Main Landing Content ──────────────────────────────────────── */}
      <main className="relative z-10">
        {/* ── Section 1: Hero Section (with Multi-Engine Interactive Preview) ─── */}
        <section className="pt-16 sm:pt-24 pb-14 px-4 sm:px-6 max-w-6xl mx-auto text-center">
          {/* Main Headline (Clean 2-line wrap) */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]"
          >
            The Unified Operating System for Modern Teams
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Consolidate Project Management, Knowledge Docs, CRM, and HRMS into a powerful,
            seamlessly integrated workspace for maximum efficiency.
          </motion.p>

          {/* Dual Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={user ? "/" : "/login"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-md text-sm font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <a
                href="#architecture"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-md text-sm font-semibold border border-border/90 hover:border-primary/50 bg-card/60 hover:bg-surface-elevated text-foreground transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span>Explore Architecture</span>
              </a>
            </motion.div>
          </motion.div>

          {/* ── Focal 3D Tilted Perspective Workbench Preview Card with Interactive App Switching ── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.45 }}
            className="mt-14 relative mx-auto max-w-5xl"
          >
            {/* Ambient Radial Backlight Glow with Breathing Animation */}
            <motion.div
              animate={{
                scale: [0.96, 1.04, 0.96],
                opacity: [0.18, 0.28, 0.18],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-primary blur-3xl rounded-3xl -z-10 scale-95"
            />

            <motion.div
              animate={{
                y: [0, -6, 0],
                rotateX: [4, 2.5, 4],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{
                rotateX: 0,
                y: -3,
                transition: transitions.smooth,
              }}
              className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-card/95 backdrop-blur-2xl shadow-2xl p-3 sm:p-5 text-left overflow-hidden transition-all duration-300"
              style={{
                perspective: "1200px",
                transformStyle: "preserve-3d",
              }}
            >
              {/* App Window Chrome Header with Search Palette trigger */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
                  </div>
                  <span className="ml-2 font-mono text-[11px] font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Logo variant="mark" />
                    <span>Zsyio Unified Workbench</span>
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]">
                  <button
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="px-2 py-0.5 rounded bg-surface-subtle hover:bg-surface-elevated border border-border/60 text-foreground/70 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>⌘K Quick Switcher</span>
                  </button>
                  <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                    <PulseDot color="bg-emerald-500" auraColor="bg-emerald-500/40" size="w-2 h-2" />
                    Connected: 5 Subdomains
                  </span>
                </div>
              </div>

              {/* Three-Column Interactive Unified Workbench Layout */}
              <div className="grid grid-cols-12 gap-3 sm:gap-4 min-h-[380px]">
                {/* 1. Interactive Mini Sidebar (Cols 3) */}
                <div className="col-span-12 sm:col-span-3 rounded-xl border border-border/60 bg-surface-subtle/70 p-3 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                      ENGINES (CLICK TO SWITCH)
                    </span>
                    <div className="space-y-0.5 text-xs font-medium">
                      {[
                        { key: "pms", label: "Flow (PMS)", icon: Workflow, count: "8" },
                        { key: "notes", label: "Canvas (Docs)", icon: FileText, count: "12" },
                        { key: "hrms", label: "People (HRMS)", icon: Users, count: "4" },
                        { key: "sales", label: "Pulse (Sales)", icon: BarChart3, count: "18" },
                        { key: "admin", label: "Console (Admin)", icon: Shield, count: "42" },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isTabActive = workbenchTab === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setWorkbenchTab(item.key as typeof workbenchTab)}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-md flex items-center justify-between transition-all cursor-pointer text-left",
                              isTabActive
                                ? "bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20"
                                : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5" /> {item.label}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-mono px-1 rounded",
                                isTabActive ? "bg-primary/20" : "bg-card text-muted-foreground"
                              )}
                            >
                              {item.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                      ACTIVE SPRINT
                    </span>
                    <div className="p-2 rounded-lg bg-card border border-border/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                        <span>Sprint 42</span>
                        <span className="text-emerald-500 font-mono text-[10px]">74% Done</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "74%" }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2 & 3. Dynamic Center & Right Stages Based on Active Workbench Tab (Cols 9) */}
                <div className="col-span-12 sm:col-span-9 rounded-xl border border-border/60 bg-surface-subtle/50 p-3 sm:p-4">
                  <AnimatePresence mode="wait">
                    {workbenchTab === "pms" && (
                      <motion.div
                        key="pms-view"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={transitions.snappy}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5 font-display">
                            <Workflow className="w-3.5 h-3.5 text-primary" />
                            <span>Zsyio Flow — Agile Sprints &amp; Velocity Tracker</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border/60 text-muted-foreground">
                            3 Lanes Active
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Lane 1: In Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground font-mono">
                              <span>IN PROGRESS (2)</span>
                            </div>
                            <motion.div
                              whileHover={{ y: -2 }}
                              className="p-2.5 rounded-lg bg-card border border-primary/40 shadow-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                                  RFC-042
                                </span>
                                <span className="text-[9px] text-muted-foreground font-mono">3 pts</span>
                              </div>
                              <p className="text-[11px] font-semibold text-foreground leading-snug">
                                Ed25519 apex session tunnel
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                                <span>Alex R.</span>
                                <span className="text-emerald-500 font-semibold">Passing</span>
                              </div>
                            </motion.div>

                            <motion.div
                              whileHover={{ y: -2 }}
                              className="p-2.5 rounded-lg bg-card border border-border/60 shadow-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                                  CAN-108
                                </span>
                                <span className="text-[9px] text-muted-foreground font-mono">5 pts</span>
                              </div>
                              <p className="text-[11px] font-semibold text-foreground leading-snug">
                                Mermaid SVG zoom &amp; pan
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                                <span>Sarah M.</span>
                                <span>In Review</span>
                              </div>
                            </motion.div>
                          </div>

                          {/* Lane 2: Completed */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground font-mono">
                              <span>COMPLETED (3)</span>
                            </div>
                            <motion.div
                              whileHover={{ y: -2 }}
                              className="p-2.5 rounded-lg bg-card/70 border border-border/50 shadow-xs space-y-1.5 opacity-90"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                                  HRM-029
                                </span>
                                <Check className="w-3 h-3 text-emerald-500" />
                              </div>
                              <p className="text-[11px] font-medium text-foreground leading-snug">
                                Attendance regularization
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                                <span>Elena K.</span>
                                <span className="text-emerald-500">Approved</span>
                              </div>
                            </motion.div>

                            <motion.div
                              whileHover={{ y: -2 }}
                              className="p-2.5 rounded-lg bg-card/70 border border-border/50 shadow-xs space-y-1.5 opacity-90"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                                  PLS-088
                                </span>
                                <Check className="w-3 h-3 text-emerald-500" />
                              </div>
                              <p className="text-[11px] font-medium text-foreground leading-snug">
                                $18.2k enterprise close
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                                <span>Marcus T.</span>
                                <span className="text-emerald-500">Closed</span>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {workbenchTab === "notes" && (
                      <motion.div
                        key="notes-view"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={transitions.snappy}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span>RFC-042: Monorepo Micro-Frontend Architecture Specification</span>
                          </span>
                          <span className="text-[10px] font-mono text-indigo-500 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                            Mermaid v11 Active
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/60 space-y-2 text-xs">
                          <div className="p-2 rounded bg-surface-subtle border border-border/60 font-mono text-[11px] text-foreground/90">
                            <code>graph TD: Client --&gt; ApexEdge[Next.js Edge] --&gt; Subdomains</code>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Shared TypeScript types and Zod schemas guarantee zero drift between PMS task payloads and Notes RFC documentation.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {workbenchTab === "hrms" && (
                      <motion.div
                        key="hrms-view"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={transitions.snappy}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Zsyio People — Engineering Roster &amp; Timesheets</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-500 font-bold">24 / 25 Active</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-3 rounded-xl bg-card border border-border/60">
                            <span className="block text-lg font-mono font-bold text-foreground">86%</span>
                            <span className="text-[10px] text-muted-foreground">Sprint Capacity</span>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border/60">
                            <span className="block text-lg font-mono font-bold text-emerald-500">100%</span>
                            <span className="text-[10px] text-muted-foreground">Timesheet Compliance</span>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border/60">
                            <span className="block text-lg font-mono font-bold text-primary">0</span>
                            <span className="text-[10px] text-muted-foreground">Policy Blockers</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {workbenchTab === "sales" && (
                      <motion.div
                        key="sales-view"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={transitions.snappy}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
                            <span>Zsyio Pulse — Enterprise Sales Opportunities</span>
                          </span>
                          <span className="text-[10px] font-mono text-sky-500 font-bold">$18,200 Closed Won</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                            <span className="text-[10px] text-muted-foreground font-mono">Q4 PIPELINE</span>
                            <span className="text-xl font-bold font-mono text-foreground block">$148,000</span>
                            <span className="text-[10px] text-emerald-500">+24% vs last sprint</span>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                            <span className="text-[10px] text-muted-foreground font-mono">CONVERSION RATIO</span>
                            <span className="text-xl font-bold font-mono text-sky-500 block">12.5%</span>
                            <span className="text-[10px] text-muted-foreground">Lead to Closed Won</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {workbenchTab === "admin" && (
                      <motion.div
                        key="admin-view"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={transitions.snappy}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-purple-500" />
                            <span>Zsyio Console — Central Governance &amp; RBAC</span>
                          </span>
                          <span className="text-[10px] font-mono text-purple-500 font-bold">42 Permissions Scoped</span>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/60 space-y-2 text-xs font-mono">
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Root Domain Whitelist</span>
                            <span className="text-emerald-500 font-bold">ACTIVE (.yourcompany.com)</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Ed25519 Session Token Rotation</span>
                            <span className="text-primary font-bold">Every 24h</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Section 2: One Cohesive Suite, Five Mission-Critical Engines ─ */}
        <section id="apps" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={transitions.smooth}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Enterprise Showcase
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground">
              One Cohesive Suite, Five Mission-Critical Engines
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every tool engineered to work as an interconnected operational nervous system.
              Zero data silos, zero duplicate authentication, unified RBAC governance.
            </p>
          </motion.div>

          {/* ── Bento Grid: 3 Top Cards + 2 Bottom Cards with Hover Lift ─ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Zsyio Flow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...transitions.smooth, delay: 0.1 }}
              whileHover={{ y: -4, transition: transitions.smooth }}
              className="rounded-2xl border border-primary/50 bg-card p-6 flex flex-col justify-between shadow-lg shadow-primary/5 hover:border-primary hover:shadow-primary/10 transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-display text-foreground">Zsyio Flow</h3>
                    <p className="text-xs text-muted-foreground">Application for project management</p>
                  </div>
                </div>

                {/* Flow Sprint Board Mockup */}
                <div className="mt-5 rounded-xl border border-border/70 bg-surface-subtle/80 p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                    <span className="font-bold text-foreground font-mono">Sprint Board</span>
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-card border border-border/80 text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                      title={isTimerRunning ? "Pause live sprint timer" : "Resume live sprint timer"}
                    >
                      {isTimerRunning ? (
                        <Pause className="w-2.5 h-2.5 text-primary" />
                      ) : (
                        <Play className="w-2.5 h-2.5 text-emerald-500" />
                      )}
                      <span className="tabular-nums font-bold">{formatTimer(timerSeconds)}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-card border border-primary/30 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-primary font-bold">FLW-204</span>
                        <span className="text-muted-foreground">High Priority</span>
                      </div>
                      <p className="text-[11px] font-medium text-foreground">Optimize monorepo commit graphs</p>
                    </div>

                    <div className="p-2 rounded-lg bg-card border border-border/60 text-xs space-y-1 shadow-2xs opacity-85">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground">FLW-205</span>
                        <span className="text-emerald-500">Review</span>
                      </div>
                      <p className="text-[11px] font-medium text-foreground">Audit permission capability matrix</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">+38% Sprint Velocity</span>
                <a
                  href={appUrls.pms}
                  className="text-primary font-semibold hover:underline flex items-center gap-1 group"
                >
                  <span>Launch Flow</span>
                  <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </motion.div>

            {/* Card 2: Zsyio Canvas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...transitions.smooth, delay: 0.2 }}
              whileHover={{ y: -4, transition: transitions.smooth }}
              className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between shadow-md hover:border-indigo-500/40 transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-display text-foreground">Zsyio Canvas</h3>
                    <p className="text-xs text-muted-foreground">Live architecture markdown notes &amp; Mermaid</p>
                  </div>
                </div>

                {/* Canvas Editor & Diagram Mockup */}
                <div className="mt-5 rounded-xl border border-border/70 bg-surface-subtle/80 p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                    <span className="font-bold text-foreground font-mono">RFC-042.md</span>
                    <span className="text-[10px] font-mono text-indigo-500 font-bold">Interactive Mermaid</span>
                  </div>

                  <div className="p-3 rounded-lg bg-card border border-border/60 space-y-2 text-center">
                    <div className="flex justify-center gap-2 text-[9px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-surface-subtle border border-border/60">Client Edge</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
                        Zsyio Router
                      </span>
                    </div>
                    <div className="w-full h-px bg-border/60" />
                    <div className="text-[10px] text-muted-foreground font-mono">
                      graph TD: Client --&gt; Gateway --&gt; Subdomains
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">Zero SVG Distortion</span>
                <a
                  href={appUrls.notes}
                  className="text-indigo-500 font-semibold hover:underline flex items-center gap-1 group"
                >
                  <span>Launch Canvas</span>
                  <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </motion.div>

            {/* Card 3: Zsyio People */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...transitions.smooth, delay: 0.3 }}
              whileHover={{ y: -4, transition: transitions.smooth }}
              className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between shadow-md hover:border-emerald-500/40 transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-display text-foreground">Zsyio People</h3>
                    <p className="text-xs text-muted-foreground">Comprehensive HRMS for leave &amp; attendance</p>
                  </div>
                </div>

                {/* People Attendance Mockup */}
                <div className="mt-5 rounded-xl border border-border/70 bg-surface-subtle/80 p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
                    <span className="font-bold text-foreground font-mono">Team Attendance</span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">96% On Track</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="p-2 rounded-lg bg-card border border-border/60">
                      <span className="block text-xs font-mono font-bold text-foreground">70%</span>
                      <span className="text-[9px] text-muted-foreground">Present</span>
                    </div>
                    <div className="p-2 rounded-lg bg-card border border-border/60">
                      <span className="block text-xs font-mono font-bold text-emerald-500">86%</span>
                      <span className="text-[9px] text-muted-foreground">Remote</span>
                    </div>
                    <div className="p-2 rounded-lg bg-card border border-border/60">
                      <span className="block text-xs font-mono font-bold text-primary">76%</span>
                      <span className="text-[9px] text-muted-foreground">Sprint On</span>
                    </div>
                    <div className="p-2 rounded-lg bg-card border border-border/60">
                      <span className="block text-xs font-mono font-bold text-warning">4%</span>
                      <span className="text-[9px] text-muted-foreground">On Leave</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">Automated Timesheets</span>
                <a
                  href={appUrls.hrms}
                  className="text-emerald-500 font-semibold hover:underline flex items-center gap-1 group"
                >
                  <span>Launch People</span>
                  <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </motion.div>

            {/* Card 4: Zsyio Pulse */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...transitions.smooth, delay: 0.4 }}
              whileHover={{ y: -4, transition: transitions.smooth }}
              className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between shadow-md hover:border-sky-500/40 transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-display text-foreground">Zsyio Pulse</h3>
                    <p className="text-xs text-muted-foreground">Sales deal pipeline with conversion metrics</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Funnel Visual */}
                  <div className="rounded-xl border border-border/70 bg-surface-subtle/80 p-3.5 space-y-2">
                    <span className="text-[11px] font-mono font-bold text-foreground block">Conversion Funnel</span>
                    <div className="space-y-1.5 text-[10px] font-mono">
                      <div className="h-5 bg-sky-500/30 rounded flex items-center px-2 font-bold justify-between">
                        <span>Lead Stage (142)</span>
                        <span>100%</span>
                      </div>
                      <div className="h-5 bg-sky-500/40 rounded flex items-center px-2 font-bold justify-between w-[85%]">
                        <span>Demo (98)</span>
                        <span>69%</span>
                      </div>
                      <div className="h-5 bg-sky-500/60 text-white rounded flex items-center px-2 font-bold justify-between w-[60%]">
                        <span>Proposal (52)</span>
                        <span>36%</span>
                      </div>
                      <div className="h-5 bg-emerald-500/80 text-white rounded flex items-center px-2 font-bold justify-between w-[35%]">
                        <span>Closed Won (18)</span>
                        <span>12.5%</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="rounded-xl border border-border/70 bg-surface-subtle/80 p-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-muted-foreground block">Potential Revenue</span>
                      <span className="text-2xl font-bold font-mono text-foreground tabular-nums block mt-1">
                        $18,200.00
                      </span>
                    </div>
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-bold font-mono text-emerald-500">12.5%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">Linked to Engineering Backlog</span>
                <a
                  href={appUrls.sales}
                  className="text-sky-500 font-semibold hover:underline flex items-center gap-1 group"
                >
                  <span>Launch Pulse</span>
                  <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </motion.div>

            {/* Card 5: Zsyio Console (Admin) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...transitions.smooth, delay: 0.5 }}
              whileHover={{ y: -4, transition: transitions.smooth }}
              className="lg:col-span-1 rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between shadow-md hover:border-purple-500/40 transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-display text-foreground">Zsyio Console</h3>
                    <p className="text-xs text-muted-foreground">Central RBAC governance &amp; audit logs</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border/70 bg-surface-subtle/80 p-3.5 space-y-2.5">
                  <span className="text-[11px] font-mono font-bold text-foreground block">Recent Audit Events</span>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-card border border-border/60 flex items-center justify-between">
                      <span className="text-foreground">Domain Whitelist updated</span>
                      <span className="text-muted-foreground">2m ago</span>
                    </div>
                    <div className="p-1.5 rounded bg-card border border-border/60 flex items-center justify-between">
                      <span className="text-foreground">Alex R. granted PMS Admin</span>
                      <span className="text-muted-foreground">14m ago</span>
                    </div>
                    <div className="p-1.5 rounded bg-card border border-border/60 flex items-center justify-between">
                      <span className="text-foreground">Session ed25519 rotated</span>
                      <span className="text-emerald-500 font-semibold">Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">SOC2 Compliant</span>
                <a
                  href={appUrls.admin}
                  className="text-purple-500 font-semibold hover:underline flex items-center gap-1 group"
                >
                  <span>Launch Console</span>
                  <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Section 3: Apex-Domain Cryptographic Architecture ────────── */}
        <section id="architecture" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={transitions.smooth}
            className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
          >
            {/* Soft Ambient Radial Lighting */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10">
              {/* Left Column: Title + Animated Network Topology Visual */}
              <div className="lg:w-7/12 space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 mb-3">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Zsyio Suite Architecture</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-foreground">
                    Apex-Domain Cryptographic Architecture
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    A single ed25519-signed session token issued at root domain level securely unlocks
                    all 5 micro-frontend applications with zero cross-origin database queries.
                  </p>
                </div>

                {/* Interactive Network Topology Diagram with Laser Pulse Animation */}
                <div className="rounded-2xl border border-border/80 bg-surface-subtle/80 p-5 space-y-6">
                  {/* Root Node */}
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="inline-block px-4 py-2.5 rounded-xl bg-card border-2 border-primary shadow-md relative"
                    >
                      <span className="text-xs font-mono font-bold text-foreground block">
                        Apex Root Domain (.yourcompany.com)
                      </span>
                      <span className="text-[10px] font-mono text-primary font-medium">
                        Issue ed25519-signed session token
                      </span>
                    </motion.div>
                  </div>

                  {/* Visual Pulse Data Routing Lines with Animated Laser Tracer */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="w-full h-0.5 bg-border/80 relative overflow-hidden rounded-full">
                      <motion.div
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-1/3 h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                      />
                    </div>
                    <span className="absolute bg-background px-3 py-0.5 text-[10px] font-mono text-muted-foreground border border-border/60 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <PulseDot color="bg-primary" auraColor="bg-primary/40" size="w-1.5 h-1.5" />
                      Edge Data Routing (&lt; 1.8ms)
                    </span>
                  </div>

                  {/* 5 Subdomain Nodes with Interactive Glowing Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    {[
                      { key: "pms", label: "pms.yourcompany.com", desc: "Flow PMS" },
                      { key: "notes", label: "notes.yourcompany.com", desc: "Canvas" },
                      { key: "hrms", label: "hrms.yourcompany.com", desc: "People" },
                      { key: "sales", label: "sales.yourcompany.com", desc: "Pulse" },
                      { key: "admin", label: "admin.yourcompany.com", desc: "Console" },
                    ].map((node) => {
                      const isActive = activeNode === node.key;
                      return (
                        <motion.button
                          key={node.key}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setActiveNode(node.key)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden",
                            isActive
                              ? "bg-primary/10 border-primary text-foreground shadow-sm"
                              : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:border-border"
                          )}
                        >
                          {isActive && (
                            <span className="absolute top-1.5 right-1.5">
                              <PulseDot color="bg-primary" auraColor="bg-primary/50" size="w-1.5 h-1.5" />
                            </span>
                          )}
                          <span className="block text-[10px] font-mono font-bold truncate">
                            {node.label}
                          </span>
                          <span className="block text-[9px] font-mono text-muted-foreground/80 mt-0.5">
                            {node.desc}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* 3 Benchmark Metric Badges */}
                  <div className="pt-4 border-t border-border/60 grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 rounded-xl bg-card border border-border/60">
                      <span className="block text-sm sm:text-base font-mono font-bold text-primary">
                        &lt; 1.8ms
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">Edge Latency</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border/60">
                      <span className="block text-sm sm:text-base font-mono font-bold text-emerald-500">
                        0ms
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">Cross-Origin DB</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border/60">
                      <span className="block text-sm sm:text-base font-mono font-bold text-sky-500">
                        Zero-Trust
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">Cookie Isolation</span>
                    </div>
                  </div>

                  {/* Interactive Global Edge Latency Ping Tester */}
                  <div className="pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-primary" />
                        <span>Live Global Edge Nodes</span>
                      </span>
                      <button
                        onClick={handleSimulatePing}
                        disabled={isTestingPing}
                        className="px-2.5 py-1 rounded bg-card hover:bg-surface-elevated border border-border/80 text-[10px] font-mono text-foreground transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        <Zap className={cn("w-3 h-3 text-warning", isTestingPing && "animate-spin")} />
                        <span>{isTestingPing ? "Testing..." : "Ping Edge Nodes"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {EDGE_REGIONS.map((region, idx) => {
                        const pingValue = isTestingPing
                          ? `${(parseFloat(region.ping) * pingMultiplier).toFixed(1)}ms`
                          : region.ping;
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-card border border-border/60 text-center font-mono space-y-0.5"
                          >
                            <span className="text-[9px] text-muted-foreground truncate block">{region.name}</span>
                            <span className="text-xs font-bold text-emerald-500 block">{pingValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Code Terminal Inspector */}
              <div className="lg:w-5/12">
                <div className="rounded-2xl border border-border/80 bg-surface-subtle/90 overflow-hidden shadow-xl">
                  {/* macOS Window Title Bar */}
                  <div className="px-4 py-3 border-b border-border/60 bg-surface-subtle flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-destructive/80" />
                      <span className="w-3 h-3 rounded-full bg-warning/80" />
                      <span className="w-3 h-3 rounded-full bg-success/80" />
                      <span className="ml-2 text-xs font-mono text-muted-foreground">
                        packages/auth/src/middleware.ts
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          ENTERPRISE_SPECS[0].code,
                          setCopiedHeroCode
                        )
                      }
                      className="px-2 py-1 rounded text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-card border border-border/60 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedHeroCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Terminal Code Body */}
                  <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto select-all text-foreground/90">
                    <code>{ENTERPRISE_SPECS[0].code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Section 4: Engineered for Sovereign Governance & Speed ─── */}
        <section id="specs" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={transitions.smooth}
            className="text-center mb-12"
          >
            <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
              TECHNICAL SPECIFICATIONS
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-foreground tracking-tight">
              Engineered for Sovereign Governance &amp; Speed
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              Deep dive into single sign-on orchestration, DNS edge policies, and deployment blueprints.
            </p>
          </motion.div>

          {/* Horizontal Tab Selector */}
          <div
            className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-border/60"
            role="tablist"
            aria-label="Technical Specifications Tabs"
          >
            {ENTERPRISE_SPECS.map((spec, idx) => {
              const isActive = activeSpec === idx;
              return (
                <button
                  key={spec.id}
                  role="tab"
                  id={`tab-${idx}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${idx}`}
                  onClick={() => setActiveSpec(idx)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative",
                    isActive
                      ? "bg-card text-foreground border border-primary/50 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                  )}
                >
                  {spec.title.split("&")[0]}
                </button>
              );
            })}
          </div>

          {/* Two-Column Specification Matrix with Smooth Tab Crossfade */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSpec}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Left: Specification Table */}
              <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-md">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary block">
                  Feature Guarantees
                </span>
                <div className="divide-y divide-border/60">
                  {ENTERPRISE_SPECS[activeSpec].tableRows.map((row, idx) => (
                    <div key={idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <span className="font-bold text-foreground font-mono shrink-0">
                        {row.feature}
                      </span>
                      <span className="text-muted-foreground text-right">{row.description}</span>
                    </div>
                  ))}
                </div>

                {/* Interactive Live Domain Policy Tester (When Corporate Whitelist is active or always available) */}
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-foreground flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-primary" />
                    <span>DNS Policy Gate Simulator</span>
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="user@yourcompany.com"
                      className="w-full text-xs font-mono p-2 rounded-lg bg-surface-subtle border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Edge Policy Verdict:</span>
                    {isEmailAllowed(testEmail) ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ALLOWED (Apex Session Validated)
                      </span>
                    ) : (
                      <span className="text-destructive font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> REJECTED (Domain Not Whitelisted)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Architectural Inspector & Code Snippet */}
              <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 space-y-5 shadow-lg">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                      {ENTERPRISE_SPECS[activeSpec].badge}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-surface-subtle border border-border/70 text-foreground">
                      {ENTERPRISE_SPECS[activeSpec].statValue}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">
                    {ENTERPRISE_SPECS[activeSpec].statLabel}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold font-display text-foreground mb-1.5">
                    Architectural Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {ENTERPRISE_SPECS[activeSpec].summary}
                  </p>
                </div>

                {/* Code Snippet */}
                <div className="rounded-xl border border-border/80 bg-surface-subtle/90 overflow-hidden shadow-xs">
                  <div className="px-3.5 py-2 border-b border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground bg-surface-subtle">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span>Implementation Code</span>
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          ENTERPRISE_SPECS[activeSpec].code,
                          setCopiedSpecCode
                        )
                      }
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiedSpecCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSpecCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed select-all">
                    <code>{ENTERPRISE_SPECS[activeSpec].code}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ── Section 5: High-Conversion CTA & Docker Command Bar ─────── */}
        <section id="cta" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={transitions.smooth}
            className="relative rounded-3xl border border-primary/30 bg-card p-8 sm:p-14 shadow-2xl overflow-hidden"
          >
            {/* Ambient Radial Glow Behind CTA with Breathing Animation */}
            <motion.div
              animate={{
                scale: [0.92, 1.06, 0.92],
                opacity: [0.18, 0.3, 0.18],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-primary blur-3xl rounded-3xl -z-10 scale-90"
            />

            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-foreground tracking-tight leading-tight">
                Deploy Your Sovereign Enterprise Workspace in Minutes
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Connect your engineering, HR, administration, and sales teams in one single,
                high-performing environment with complete privacy and zero vendor lock-in.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={user ? "/" : "/login"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span>Get Started with Zsyio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <a
                    href="#architecture"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md text-sm font-semibold border border-border/80 bg-surface-subtle/80 hover:bg-surface-elevated text-foreground transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span>Read Architecture RFC</span>
                  </a>
                </motion.div>
              </div>

              {/* Docker CLI Command Pill with Instant Copy */}
              <div className="pt-4 max-w-xl mx-auto">
                <div className="rounded-xl border border-border/80 bg-surface-subtle/90 px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-mono shadow-xs">
                  <span className="text-foreground/90 truncate">
                    docker compose -f docker-compose.prod.yml up -d
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        "docker compose -f docker-compose.prod.yml up -d",
                        setCopiedDockerCmd
                      )
                    }
                    className="px-2.5 py-1 rounded bg-card border border-border/80 text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedDockerCmd ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── Enterprise Multi-Column Minimalist Footer ─────────────────── */}
      <footer className="border-t border-border/80 bg-surface-subtle/50 text-muted-foreground text-xs py-14 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Brand Col */}
            <div className="md:col-span-4 space-y-3">
              <Link href="/landing" className="flex items-center gap-2.5">
                <Logo variant="full" />
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                The unified operating system for modern engineering, sales, and operations teams.
                Built on Next.js 15, Turborepo, and Prisma.
              </p>
            </div>

            {/* Products Col */}
            <div className="md:col-span-3 space-y-2.5">
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider block">
                Products
              </span>
              <ul className="space-y-1.5">
                <li>
                  <a href={appUrls.pms} className="hover:text-foreground transition-colors">
                    Zsyio Flow (Project Management)
                  </a>
                </li>
                <li>
                  <a href={appUrls.notes} className="hover:text-foreground transition-colors">
                    Zsyio Canvas (Architecture Docs)
                  </a>
                </li>
                <li>
                  <a href={appUrls.hrms} className="hover:text-foreground transition-colors">
                    Zsyio People (HRMS &amp; Attendance)
                  </a>
                </li>
                <li>
                  <a href={appUrls.sales} className="hover:text-foreground transition-colors">
                    Zsyio Pulse (Sales Pipeline)
                  </a>
                </li>
                <li>
                  <a href={appUrls.admin} className="hover:text-foreground transition-colors">
                    Zsyio Console (Governance &amp; RBAC)
                  </a>
                </li>
              </ul>
            </div>

            {/* Documentation Col */}
            <div className="md:col-span-2 space-y-2.5">
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider block">
                Documentation
              </span>
              <ul className="space-y-1.5">
                <li>
                  <a href="#architecture" className="hover:text-foreground transition-colors">
                    RFC-042 Architecture
                  </a>
                </li>
                <li>
                  <a href="#specs" className="hover:text-foreground transition-colors">
                    Technical Specifications
                  </a>
                </li>
                <li>
                  <a href="#cta" className="hover:text-foreground transition-colors">
                    Self-Hosting Guide
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    API Reference
                  </Link>
                </li>
              </ul>
            </div>

            {/* Trust, Compliance & System Health */}
            <div className="md:col-span-3 space-y-4">
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider block">
                Trust &amp; Compliance
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-card border border-border/80 text-[11px] font-mono text-foreground font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>SOC2 Type II</span>
                </span>
                <span className="px-2.5 py-1 rounded bg-card border border-border/80 text-[11px] font-mono text-foreground font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>HIPAA Compliance</span>
                </span>
              </div>

              {/* Live Status Pill with PulseDot */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold">
                <PulseDot color="bg-emerald-500" auraColor="bg-emerald-500/40" size="w-2 h-2" />
                <span>All systems operational 99.99%</span>
              </div>

              {/* Theme Toggle in Footer */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-muted-foreground">Theme:</span>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono">
            <span>© {new Date().getFullYear()} Zsyio Suite. Open-source enterprise monorepo.</span>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Privacy Policy</span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Terms of Service</span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Security Whitepaper</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
