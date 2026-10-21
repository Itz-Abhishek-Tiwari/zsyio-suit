import fs from "fs";
import path from "path";

const rootDir = process.cwd();

for (const envFile of [".env", ".env.local"]) {
  const fullPath = path.join(rootDir, envFile);
  if (fs.existsSync(fullPath)) {
    const lines = fs.readFileSync(fullPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

import {
  prisma,
  Role,
  ClientType,
  ClientStatus,
  Environment,
  Priority,
  TestCaseStatus,
  LogAction,
  LeaveType,
  LeaveStatus,
  RegularizationType,
  RegularizationStatus,
  SessionStatus,
  ApprovalStatus,
  SalesStage,
  SalesPriority,
  SalesActivityType,
  SalesAuditAction,
  NoteGeneralAccess,
} from "@zsyio/database";

import { ALL_ACTIONS, DEFAULT_ROLE_PERMISSIONS } from "@zsyio/auth/permissions";

const ALL_TABLES_TO_TRUNCATE = [
  '"TaskTimeEntry"',
  '"TaskTagAssignment"',
  '"TaskTag"',
  '"TaskReviewer"',
  '"SalesAuditLog"',
  '"SalesActivity"',
  '"SalesLeadTag"',
  '"SalesTag"',
  '"SalesLead"',
  '"PipelineStage"',
  '"SalesPipeline"',
  '"WorkSession"',
  '"OooSession"',
  '"LeaveRequest"',
  '"UserLeaveAllocation"',
  '"LeavePolicy"',
  '"CompanyHoliday"',
  '"AttendanceRegularization"',
  '"TimesheetAuditLog"',
  '"HrPolicySettings"',
  '"ActivityLog"',
  '"Attachment"',
  '"Comment"',
  '"TestCase"',
  '"TaskAssignee"',
  '"TaskTeam"',
  '"DashboardNoteTeam"',
  '"DashboardNoteUser"',
  '"DashboardNote"',
  '"Notification"',
  '"NotificationPreference"',
  '"Task"',
  '"TeamMember"',
  '"Team"',
  '"Product"',
  '"Client"',
  '"User"',
  '"CustomRole"',
  '"CustomTaskType"',
  '"CustomKanbanColumn"',
  '"NoteStar"',
  '"NoteShare"',
  '"NoteFolderShare"',
  '"Note"',
  '"NoteFolder"',
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

export async function seedZsyio() {
  console.log("⚡ Starting Zsyio v2 Enterprise Enriched Seed...");

  // ── 1. Wipe ─────────────────────────────────────────────────────────────────
  console.log("🧹 1. Wiping tables...");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${ALL_TABLES_TO_TRUNCATE.join(", ")} CASCADE;`);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Task_ticketNumber_seq') THEN
        PERFORM setval('public."Task_ticketNumber_seq"', 1, false);
      END IF;
    END $$;
  `);
  console.log("✅ Wiped.");

  const passwordHash = "$2b$10$zFBSk2Xlnlw669/LmGI54uJYVN2bBveoEbYtePk/VfBlchCWBIN5u";

  // ── 2. Roles ─────────────────────────────────────────────────────────────────
  console.log("🛡️  2. Creating roles...");
  const rolesData = [
    { name: "SUPER_ADMIN", label: "Super Administrator", description: "Full global root access across all 5 Zsyio suite applications.", isSystem: true, color: "indigo", icon: "shield-alert", permissions: ALL_ACTIONS },
    { name: "ADMIN", label: "Workspace Administrator", description: "Full administrative governance, billing, user management.", isSystem: true, color: "purple", icon: "shield-check", permissions: ALL_ACTIONS },
    { name: "MANAGER", label: "Product & Engineering Manager", description: "Sprint oversight, task delegation, client onboarding, and approvals.", isSystem: false, color: "blue", icon: "users", permissions: DEFAULT_ROLE_PERMISSIONS.MANAGER },
    { name: "DEVELOPER", label: "Staff Software Engineer", description: "Task execution, sprint board movement, QA test cases.", isSystem: false, color: "emerald", icon: "code", permissions: DEFAULT_ROLE_PERMISSIONS.DEVELOPER },
    { name: "SUPPORT", label: "Customer Reliability Engineer", description: "Client ticket triage, escalation workflows, SLA tracking.", isSystem: false, color: "amber", icon: "life-buoy", permissions: DEFAULT_ROLE_PERMISSIONS.SUPPORT },
    {
      name: "SALES_MANAGER", label: "Head of Commercial & Sales", description: "Revenue pipeline governance, deal reviews, CRM analytics.", isSystem: false, color: "violet", icon: "trending-up",
      permissions: ["app:access:sales","app:access:notes","sales:view","sales:create","sales:edit","sales:delete","sales:assign","sales:pipeline:manage","sales:dashboard:view","sales:convert","note:view","note:create","note:edit","note:share"],
    },
    {
      name: "SALES_REP", label: "Enterprise Account Executive", description: "Sales lead qualification, deal progression through the 7-stage Kanban.", isSystem: false, color: "cyan", icon: "target",
      permissions: ["app:access:sales","sales:view","sales:create","sales:edit","sales:dashboard:view"],
    },
  ];
  const roleMap = new Map<string, string>();
  for (const r of rolesData) {
    const c = await prisma.customRole.create({ data: r });
    roleMap.set(r.name, c.id);
  }

  // ── 3. Task Types & Kanban Columns ──────────────────────────────────────────
  console.log("📋 3. Task types & kanban columns...");
  for (const tt of [
    { name: "FEATURE", icon: "sparkles", color: "indigo" },
    { name: "BUG", icon: "bug", color: "red" },
    { name: "IMPROVEMENT", icon: "trending-up", color: "purple" },
    { name: "SUPPORT_REQUEST", icon: "message-square", color: "blue" },
    { name: "TASK", icon: "check-square", color: "emerald" },
  ]) await prisma.customTaskType.create({ data: tt });

  for (const kc of [
    { statusKey: "TODO", label: "To Do", icon: "clipboard", color: "blue", order: 0 },
    { statusKey: "IN_PROGRESS", label: "In Progress", icon: "play", color: "amber", order: 1 },
    { statusKey: "IN_REVIEW", label: "In Review", icon: "code", color: "purple", order: 2 },
    { statusKey: "QA", label: "QA Testing", icon: "flask", color: "sky", order: 3 },
    { statusKey: "BLOCKED", label: "Blocked", icon: "alert-octagon", color: "red", order: 4 },
    { statusKey: "DONE", label: "Done & Shipped", icon: "check-circle", color: "emerald", order: 5 },
  ]) await prisma.customKanbanColumn.create({ data: kc });

  // ── 4. Users (15) ───────────────────────────────────────────────────────────
  console.log("👥 4. Creating 15 users...");
  const usersData = [
    { name: "Alex Vance", email: "alex.vance@zsyio.com", role: Role.ADMIN, customRoleName: "SUPER_ADMIN", jobTitle: "Chief Technology Officer", department: "Executive", bio: "CTO and co-founder. Previously Principal Engineer at Stripe and AWS.", phone: "+1 (415) 800-0001", timeZone: "America/New_York" },
    { name: "Sarah Chen", email: "sarah.chen@zsyio.com", role: Role.ADMIN, customRoleName: "ADMIN", jobTitle: "VP of Engineering", department: "Engineering", bio: "VP Engineering, 12 years in distributed systems. Ex-Cloudflare and GitHub.", phone: "+1 (415) 800-0002", timeZone: "America/Los_Angeles" },
    { name: "Admin User", email: "admin@zsyio.com", role: Role.ADMIN, customRoleName: "ADMIN", jobTitle: "Workspace Administrator", department: "Engineering", bio: "General workspace administrator account.", phone: "+1 (415) 800-0099", timeZone: "America/New_York" },
    { name: "Marcus Brody", email: "marcus.brody@zsyio.com", role: Role.MANAGER, customRoleName: "MANAGER", jobTitle: "Senior Engineering Manager", department: "Engineering", bio: "Manages PMS and Infrastructure squads. Certified Scrum Master.", phone: "+44 20 7946 0102", timeZone: "Europe/London" },
    { name: "Elena Rostova", email: "elena.rostova@zsyio.com", role: Role.DEVELOPER, customRoleName: "DEVELOPER", jobTitle: "Staff Engineer — Backend", department: "Engineering", bio: "Distributed systems specialist. Led TimescaleDB migration and OpenTelemetry rollout.", phone: "+1 (415) 800-0004", timeZone: "America/New_York" },
    { name: "David Kim", email: "david.kim@zsyio.com", role: Role.DEVELOPER, customRoleName: "DEVELOPER", jobTitle: "Senior Software Engineer — Frontend", department: "Engineering", bio: "Next.js and React specialist. Maintainer of the Zsyio Design System.", phone: "+82 10 1234 5678", timeZone: "Asia/Seoul" },
    { name: "Priya Patel", email: "priya.patel@zsyio.com", role: Role.DEVELOPER, customRoleName: "DEVELOPER", jobTitle: "Senior Engineer — Platform", department: "Engineering", bio: "Platform reliability and cloud infra. AWS-certified solutions architect.", phone: "+91 98765 43210", timeZone: "Asia/Kolkata" },
    { name: "Liam Torres", email: "liam.torres@zsyio.com", role: Role.DEVELOPER, customRoleName: "DEVELOPER", jobTitle: "Software Engineer — Backend", department: "Engineering", bio: "Node.js microservices and event-driven architecture specialist.", phone: "+34 612 345 678", timeZone: "Europe/Madrid" },
    { name: "Aiko Yamamoto", email: "aiko.yamamoto@zsyio.com", role: Role.DEVELOPER, customRoleName: "DEVELOPER", jobTitle: "Software Engineer — Full Stack", department: "Engineering", bio: "Full-stack engineer focusing on real-time collaborative features.", phone: "+81 90-1234-5678", timeZone: "Asia/Tokyo" },
    { name: "Noah Weber", email: "noah.weber@zsyio.com", role: Role.DEVELOPER, customRoleName: "DEVELOPER", jobTitle: "QA Engineer", department: "Engineering", bio: "Test automation and QA engineering. Playwright and k6 performance testing expert.", phone: "+49 30 12345678", timeZone: "Europe/Berlin" },
    { name: "Support Desk", email: "support@zsyio.com", role: Role.SUPPORT, customRoleName: "SUPPORT", jobTitle: "Head of Customer Reliability", department: "Customer Success", bio: "Manages SLA monitoring and P1 incident escalation for all enterprise clients.", phone: "+1 (800) 555-0100", timeZone: "America/Chicago" },
    { name: "Fatima Al-Rashid", email: "fatima.alrashid@zsyio.com", role: Role.SUPPORT, customRoleName: "SUPPORT", jobTitle: "Customer Reliability Engineer", department: "Customer Success", bio: "Tier-2 support specialist. Expert in integrations and webhook debugging.", phone: "+971 55 123 4567", timeZone: "Asia/Dubai" },
    { name: "Rachel Green", email: "rachel.green@zsyio.com", role: Role.DEVELOPER, customRoleName: "SALES_REP", jobTitle: "Enterprise Account Executive", department: "Commercial", bio: "Closes complex enterprise deals. 7-figure pipeline management.", phone: "+1 (212) 555-0188", timeZone: "America/New_York" },
    { name: "Sarah Chen (Admin)", email: "admin@zsyio.de", role: Role.ADMIN, customRoleName: "ADMIN", jobTitle: "Workspace Administrator", department: "Engineering", bio: "Legacy alias account.", timeZone: "Europe/Berlin" },
    { name: "Alex Vance (Superadmin)", email: "superadmin@zsyio.de", role: Role.ADMIN, customRoleName: "SUPER_ADMIN", jobTitle: "Super Administrator", department: "Executive", bio: "Legacy alias account.", timeZone: "America/New_York" },
  ];

  const userMap = new Map<string, any>();
  for (const u of usersData) {
    const created = await prisma.user.create({
      data: {
        name: u.name, email: u.email, passwordHash, role: u.role,
        customRoleId: roleMap.get(u.customRoleName),
        active: true, mustChangePassword: false, theme: "light",
        jobTitle: u.jobTitle, department: u.department,
        bio: u.bio ?? null, phone: (u as any).phone ?? null,
        timeZone: u.timeZone ?? "Asia/Kolkata",
        invitationStatus: "ACCEPTED",
        notificationPreference: {
          create: { taskAssigned: true, statusChanged: true, mentions: true, comments: true, dueDateReminders: true, dashboardNotes: true, inAppToasts: true, browserNotifications: true, browserSound: true },
        },
      },
    });
    userMap.set(u.email, created);
  }
  console.log(`✅ ${usersData.length} users created.`);

  const alex   = userMap.get("alex.vance@zsyio.com");
  const sarah  = userMap.get("sarah.chen@zsyio.com");
  const admin  = userMap.get("admin@zsyio.com");
  const marcus = userMap.get("marcus.brody@zsyio.com");
  const elena  = userMap.get("elena.rostova@zsyio.com");
  const david  = userMap.get("david.kim@zsyio.com");
  const priya  = userMap.get("priya.patel@zsyio.com");
  const liam   = userMap.get("liam.torres@zsyio.com");
  const aiko   = userMap.get("aiko.yamamoto@zsyio.com");
  const noah   = userMap.get("noah.weber@zsyio.com");
  const support = userMap.get("support@zsyio.com");
  const fatima = userMap.get("fatima.alrashid@zsyio.com");
  const rachel = userMap.get("rachel.green@zsyio.com");
  const superadmin = userMap.get("superadmin@zsyio.de");

  // ── 5. Teams (6) ────────────────────────────────────────────────────────────
  console.log("🏢 5. Creating 6 teams...");
  const teamsData = [
    { name: "Core Platform & Infrastructure", description: "Distributed backends, PostgreSQL tuning, telemetry, and Kubernetes orchestrations.", color: "indigo", leadId: elena.id, memberEmails: ["elena.rostova@zsyio.com","priya.patel@zsyio.com","liam.torres@zsyio.com"] },
    { name: "Frontend Experience & Design System", description: "Next.js App Router applications, Design Token compiler, and accessible UI primitives.", color: "sky", leadId: david.id, memberEmails: ["david.kim@zsyio.com","aiko.yamamoto@zsyio.com","elena.rostova@zsyio.com"] },
    { name: "Enterprise Integrations & APIs", description: "Client webhook gateways, OAuth2 token service, and payment settlement connectors.", color: "violet", leadId: priya.id, memberEmails: ["priya.patel@zsyio.com","liam.torres@zsyio.com","aiko.yamamoto@zsyio.com"] },
    { name: "Quality Assurance & Reliability", description: "E2E test automation, k6 load tests, Playwright visual regression, and SLA monitoring.", color: "emerald", leadId: noah.id, memberEmails: ["noah.weber@zsyio.com","aiko.yamamoto@zsyio.com"] },
    { name: "Client Reliability & Support", description: "Customer SLA monitoring, incident escalation drills, and bug resolution verification.", color: "amber", leadId: support.id, memberEmails: ["support@zsyio.com","fatima.alrashid@zsyio.com","marcus.brody@zsyio.com"] },
    { name: "Commercial & Growth", description: "Enterprise deal conversion, client discovery calls, and RFP contract proposals.", color: "rose", leadId: rachel.id, memberEmails: ["rachel.green@zsyio.com","sarah.chen@zsyio.com"] },
  ];
  const teamMap = new Map<string, any>();
  for (const t of teamsData) {
    const ct = await prisma.team.create({
      data: {
        name: t.name, description: t.description, color: t.color,
        members: { create: t.memberEmails.map((email) => ({ userId: userMap.get(email).id, role: userMap.get(email).id === t.leadId ? "LEAD" : "MEMBER" })) },
      },
    });
    teamMap.set(t.name, ct);
  }
  console.log(`✅ 6 teams created.`);

  // ── 6. Clients & Products ───────────────────────────────────────────────────
  console.log("🌐 6. Creating 7 clients & 14 products...");
  const clientsData = [
    {
      name: "Apex Global Logistics", domain: "apexlogistics.io", contactName: "Julian Vance", contactEmail: "julian@apexlogistics.io", contactPhone: "+1 (415) 890-4421",
      notes: "Tier-1 logistics carrier running real-time fleet telematics. 2,400+ truck fleet. SLA: 99.95% uptime.", status: ClientStatus.ACTIVE, clientType: ClientType.DEVELOPMENT,
      products: [
        { name: "Apex Fleet Engine v3.4", version: "3.4.2", deployedUrl: "https://fleet.apexlogistics.io", repoUrl: "https://github.com/apex-logistics/fleet-engine", environment: Environment.PRODUCTION },
        { name: "Apex Driver Telemetry API", version: "1.8.0", deployedUrl: "https://api.telemetry.apexlogistics.io", repoUrl: "https://github.com/apex-logistics/driver-api", environment: Environment.PRODUCTION },
      ],
    },
    {
      name: "Aether Cloud Systems", domain: "aethercloud.com", contactName: "Claire Underwood", contactEmail: "claire@aethercloud.com", contactPhone: "+1 (206) 555-0199",
      notes: "Multi-cloud Kubernetes workload orchestration. 40,000+ pods across 6 regions. SLA: 99.99%.", status: ClientStatus.ACTIVE, clientType: ClientType.DEVELOPMENT,
      products: [
        { name: "Aether KubeControl Portal", version: "2.1.0", deployedUrl: "https://console.aethercloud.com", repoUrl: "https://github.com/aethercloud/kubecontrol", environment: Environment.PRODUCTION },
        { name: "Aether Cluster Metrics API", version: "1.3.1", deployedUrl: "https://metrics.aethercloud.com", repoUrl: "https://github.com/aethercloud/metrics-api", environment: Environment.STAGING },
      ],
    },
    {
      name: "Vanguard Financial Tech", domain: "vanguardfintech.com", contactName: "Robert Sterling", contactEmail: "r.sterling@vanguardfintech.com", contactPhone: "+1 (212) 555-8392",
      notes: "SOC2 Type-II institutional settlement gateway. $2.4B daily volume across 18 currencies.", status: ClientStatus.ACTIVE, clientType: ClientType.DEVELOPMENT,
      products: [
        { name: "Vanguard Settlement Gateway", version: "4.0.1", deployedUrl: "https://pay.vanguardfintech.com", repoUrl: "https://github.com/vanguardfintech/settlement", environment: Environment.PRODUCTION },
        { name: "Vanguard Reconciliation Engine", version: "2.0.0", deployedUrl: "https://recon.vanguardfintech.com", repoUrl: "https://github.com/vanguardfintech/recon", environment: Environment.PRODUCTION },
      ],
    },
    {
      name: "PulseBio Health Labs", domain: "pulsebio.org", contactName: "Dr. Aris Thorne", contactEmail: "thorne@pulsebio.org", contactPhone: "+1 (617) 555-3901",
      notes: "HIPAA-certified genomic sequencing platform. 10TB+ daily variant datasets across 7 research centers.", status: ClientStatus.ACTIVE, clientType: ClientType.DEVELOPMENT,
      products: [
        { name: "PulseBio Sequence Pipeline", version: "1.2.5", deployedUrl: "https://pipeline.pulsebio.org", repoUrl: "https://github.com/pulsebio/sequence-engine", environment: Environment.PRODUCTION },
      ],
    },
    {
      name: "Starlight Media & Streaming", domain: "starlightstreaming.tv", contactName: "Nadia Volkova", contactEmail: "nadia@starlightstreaming.tv", contactPhone: "+1 (310) 555-4811",
      notes: "Global video transcode cluster. 18M concurrent viewers at peak. Sub-second live stream delivery.", status: ClientStatus.ACTIVE, clientType: ClientType.DEVELOPMENT,
      products: [
        { name: "Starlight Transcode Cluster", version: "5.1.0", deployedUrl: "https://cluster.starlightstreaming.tv", repoUrl: "https://github.com/starlightstreaming/transcode", environment: Environment.PRODUCTION },
        { name: "Starlight CDN Orchestrator", version: "2.2.3", deployedUrl: "https://cdn.starlightstreaming.tv", repoUrl: "https://github.com/starlightstreaming/cdn-orch", environment: Environment.PRODUCTION },
      ],
    },
    {
      name: "NovaSpark EduTech", domain: "novaspark.io", contactName: "Chen Wei", contactEmail: "chen.wei@novaspark.io", contactPhone: "+65 9123 4567",
      notes: "AI-powered adaptive learning platform. 500K+ students across 30 countries. FERPA-compliant.", status: ClientStatus.ACTIVE, clientType: ClientType.DEVELOPMENT,
      products: [
        { name: "NovaSpark Learning Engine", version: "3.0.0", deployedUrl: "https://app.novaspark.io", repoUrl: "https://github.com/novaspark/learning-engine", environment: Environment.PRODUCTION },
        { name: "NovaSpark Analytics Dashboard", version: "1.5.0", deployedUrl: "https://analytics.novaspark.io", repoUrl: "https://github.com/novaspark/analytics", environment: Environment.STAGING },
      ],
    },
    {
      name: "Meridian Supply Co.", domain: "meridiansupply.com", contactName: "Stephanie Barros", contactEmail: "s.barros@meridiansupply.com", contactPhone: "+55 11 99999-1234",
      notes: "B2B supply chain procurement. 12,000+ vendors, $890M annual GMV. Enterprise tier expansion in Q1.", status: ClientStatus.ACTIVE, clientType: ClientType.DEVELOPMENT,
      products: [
        { name: "Meridian Procurement Portal", version: "2.8.1", deployedUrl: "https://portal.meridiansupply.com", repoUrl: "https://github.com/meridiansupply/portal", environment: Environment.PRODUCTION },
      ],
    },
  ];

  const productMap = new Map<string, any>();
  for (const c of clientsData) {
    const { products, ...clientPayload } = c;
    const client = await prisma.client.create({
      data: {
        ...clientPayload,
        contractStart: daysAgo(120),
        contractEnd: daysFromNow(245),
        products: { create: products.map((p) => ({ ...p, lastDeployed: daysAgo(Math.floor(Math.random() * 4) + 1) })) },
      },
      include: { products: true },
    });
    for (const prod of client.products) productMap.set(prod.name, prod);
  }
  console.log(`✅ 7 clients, ${productMap.size} products.`);

  // ── 7. Task Tags ─────────────────────────────────────────────────────────────
  console.log("🏷️  7. Task tags...");
  const tagDefs = [
    { name: "Performance", color: "amber" }, { name: "Security", color: "purple" }, { name: "API", color: "blue" },
    { name: "Frontend", color: "sky" }, { name: "Infrastructure", color: "indigo" }, { name: "SLA Critical", color: "red" },
    { name: "Database", color: "emerald" }, { name: "Auth", color: "violet" }, { name: "Mobile", color: "pink" }, { name: "Accessibility", color: "orange" },
  ];
  const tagMap = new Map<string, string>();
  for (const t of tagDefs) {
    const c = await prisma.taskTag.create({ data: t });
    tagMap.set(t.name, c.id);
  }

  // ── 8. Tasks (25) ───────────────────────────────────────────────────────────
  console.log("🎫 8. Seeding 25 tasks...");
  const platformTeam = teamMap.get("Core Platform & Infrastructure");
  const frontendTeam = teamMap.get("Frontend Experience & Design System");
  const apiTeam      = teamMap.get("Enterprise Integrations & APIs");
  const qaTeam       = teamMap.get("Quality Assurance & Reliability");
  const supportTeam  = teamMap.get("Client Reliability & Support");

  const tasksData = [
    {
      title: "Implement OAuth2 PKCE flow for mobile client SDKs", status: "IN_PROGRESS", priority: Priority.HIGH, type: "FEATURE",
      productName: "Apex Fleet Engine v3.4", assignee: david, reviewer: elena, team: frontendTeam, dueDate: daysFromNow(4), estimatedHours: 16,
      description: "Support RFC 7636 Proof Key for Code Exchange to ensure secure client-side authentication without requiring shared client secrets on native Android/iOS clients.",
      aiSummary: "Introducing a standardized, secure authentication standard for mobile client applications. Safeguards customer accounts against unauthorized token interception.",
      tags: ["Security", "Auth", "Mobile"],
      testCases: [
        { title: "Generate code_verifier & code_challenge", steps: "1. Initialize auth session with S256 challenge.\n2. Confirm verifier matches SHA-256 digest.\n3. Validate base64url encoding.", expectedResult: "Token endpoint returns JWT with access and refresh pairs.", status: TestCaseStatus.PASSED },
        { title: "Reject replay with duplicate authorization code", steps: "1. Exchange authorization code for token.\n2. Attempt second exchange with identical code.", expectedResult: "HTTP 400 invalid_grant returned; prior tokens revoked.", status: TestCaseStatus.PASSED },
        { title: "Verify invalid code_verifier is rejected", steps: "1. Send authorization code with tampered code_verifier.", expectedResult: "HTTP 400 invalid_grant returned.", status: TestCaseStatus.PENDING },
      ],
      comments: [
        { author: sarah, body: "Make sure token rotation conforms to RFC-042. Add audit log on every successful token refresh." },
        { author: david, body: "@sarah.chen Done! Refresh token rotation includes automated family revocation if a reuse anomaly is detected." },
        { author: elena, body: "Reviewed the introspection endpoint — need rate limiting: max 50 calls/min per client_id." },
      ],
    },
    {
      title: "Optimize TimescaleDB hypertable chunk sizing for telemetry logs", status: "IN_PROGRESS", priority: Priority.HIGH, type: "IMPROVEMENT",
      productName: "Apex Driver Telemetry API", assignee: elena, reviewer: priya, team: platformTeam, dueDate: daysFromNow(2), estimatedHours: 8,
      description: "Reconfigure chunk_time_interval from default 7 days to 1 day for vehicle position telemetry. Current chunk sizes exceed the RAM buffer target of 2GB.",
      aiSummary: "Reconfiguring how vehicle telemetry data is partitioned and stored. Prevents memory spikes during peak traffic and guarantees uninterrupted data logging.",
      tags: ["Performance", "Database", "Infrastructure"],
      testCases: [
        { title: "Chunk memory footprint under 50k write/sec", steps: "1. Stream 10M records.\n2. Run chunk size audit query.", expectedResult: "All chunks under 1.4GB.", status: TestCaseStatus.PASSED },
        { title: "No data gaps on chunk boundary", steps: "1. Insert records straddling a chunk boundary.\n2. Query with time_bucket.", expectedResult: "All records returned with no gaps.", status: TestCaseStatus.PASSED },
      ],
      comments: [
        { author: priya, body: "Run `SELECT show_chunks('vehicle_positions');` on prod after — target <1.2GB per chunk." },
        { author: elena, body: "Chunks now averaging 780MB. Compression policy applied — 4.2x reduction on older data." },
      ],
    },
    {
      title: "Audit Redis memory footprint under peak WebSocket broadcast load", status: "TODO", priority: Priority.MEDIUM, type: "TASK",
      productName: "Aether KubeControl Portal", assignee: priya, team: platformTeam, dueDate: daysFromNow(6), estimatedHours: 12,
      description: "Investigate Redis cluster memory bloat during concurrent 10,000 WebSocket subscriber broadcasts on the KubeControl monitoring feed.",
      aiSummary: "Investigating memory scaling bottlenecks in the Aether KubeControl Portal during peak subscriber loads.",
      tags: ["Performance", "Infrastructure"],
      comments: [
        { author: marcus, body: "Prioritize this — Aether reported 3 Redis OOM restarts in 2 weeks." },
        { author: priya, body: "Root cause: channel keys accumulating because subscribers aren't unsubscribing on disconnect. Will add cleanup in WS lifecycle hooks." },
      ],
    },
    {
      title: "Add automated zero-downtime database failover drills in staging", status: "IN_REVIEW", priority: Priority.HIGH, type: "FEATURE",
      productName: "Vanguard Settlement Gateway", assignee: priya, reviewer: elena, team: apiTeam, dueDate: daysFromNow(1), estimatedHours: 20,
      description: "Implement Chaos Engineering test scripts to trigger Patroni standby election. Ensure PgBouncer connection pooler recovers within 800ms.",
      aiSummary: "Introducing automated disaster recovery simulations to ensure the transaction settlement database can switch to backup servers with zero user downtime.",
      tags: ["Security", "Infrastructure", "SLA Critical"],
      testCases: [
        { title: "Patroni leader election within 5 seconds", steps: "1. Kill primary PostgreSQL node.\n2. Monitor patronictl output.", expectedResult: "Standby promoted within 5 seconds.", status: TestCaseStatus.PASSED },
        { title: "PgBouncer reconnects within 800ms", steps: "1. Trigger failover.\n2. Monitor connection pool stats.", expectedResult: "All connections resume within 800ms.", status: TestCaseStatus.PASSED },
        { title: "Prometheus alert fires within 30 seconds", steps: "1. Trigger failover.\n2. Check Alertmanager.", expectedResult: "Alert fires within 30 seconds, routes to PagerDuty.", status: TestCaseStatus.FAILED, notes: "Alert delay observed at 47s. Investigating scrape interval misconfiguration." },
      ],
      comments: [
        { author: elena, body: "PR reviewed — script is clean. Concern: Prometheus alert timing (test case 3). Needs 15s scrape interval, not default 30s." },
        { author: priya, body: "Updated scrape interval. Rerunning chaos drill now." },
      ],
    },
    {
      title: "Validate webhook retry backoff algorithm on network partition", status: "QA", priority: Priority.HIGH, type: "FEATURE",
      productName: "Vanguard Settlement Gateway", assignee: elena, reviewer: sarah, team: apiTeam, dueDate: daysFromNow(3), estimatedHours: 16,
      description: "Verify settlement dispatch webhooks follow exponential backoff with jitter (1s→2s→4s→8s→16s up to 24h max) without dropping payload state.",
      aiSummary: "Validating that settlement dispatch webhooks reliably withstand temporary network outages without dropping transaction payloads.",
      tags: ["API", "SLA Critical"],
      testCases: [
        { title: "Exponential backoff progression timing", steps: "1. Mock destination server HTTP 503.\n2. Observe retry intervals.", expectedResult: "Intervals follow base * (2^attempt) ± 15% jitter.", status: TestCaseStatus.PASSED },
        { title: "Dead letter queue after 10 consecutive failures", steps: "1. Keep server offline for 10 attempts.\n2. Check DLQ table.", expectedResult: "Payload in DLQ with audit log and PagerDuty alert.", status: TestCaseStatus.PASSED },
        { title: "Payload state preserved across worker restarts", steps: "1. Start 3 retries.\n2. Restart worker process.\n3. Verify retry resumes.", expectedResult: "Retry state restored from Redis. No duplicates.", status: TestCaseStatus.PENDING },
      ],
    },
    {
      title: "Fix memory leak in high-throughput FASTQ parser worker pool", status: "IN_PROGRESS", priority: Priority.CRITICAL, type: "BUG",
      productName: "PulseBio Sequence Pipeline", assignee: elena, reviewer: priya, team: platformTeam, dueDate: daysFromNow(1), estimatedHours: 6,
      description: "Worker threads processing genomic reads in 100MB chunk streams fail to garbage-collect deallocated ArrayBuffers, causing OOM kills after ~45 minutes.",
      aiSummary: "Addressing a resource retention issue in the genomic sequence processing pipeline that causes workers to crash during large batch runs.",
      tags: ["Performance", "SLA Critical"],
      comments: [
        { author: elena, body: "Root cause in C++ binding buffer wrapper. Replacing `Buffer.from` with pre-allocated shared slab buffer." },
        { author: priya, body: "Also check if ReadableStream is properly destroyed after pipe — zombie pipe handles can cause this." },
        { author: support, body: "Dr. Thorne called — 3 batch jobs lost per shift. Must ship by EOD tomorrow or we breach the SLA." },
      ],
    },
    {
      title: "Provision cross-region VPC peering with AWS Frankfurt", status: "BLOCKED", blockedReason: "Pending AWS enterprise quota increase approval for EU Central 1 VPC peering limits. Case #ENT-2094831 submitted 4 days ago.", priority: Priority.HIGH, type: "TASK",
      productName: "Starlight Transcode Cluster", assignee: priya, team: platformTeam, dueDate: daysFromNow(5), estimatedHours: 10,
      description: "Establish encrypted cross-region VPC peering with eu-central-1 for low-latency media transcoder ingest. Route53 latency-based routing post-peering.",
      aiSummary: "Establishing a dedicated private connection between European cloud regions to accelerate media processing workflows.",
      tags: ["Infrastructure"],
      comments: [{ author: marcus, body: "Escalated through our Enterprise TAM. Expected response in 24-48 hours." }],
    },
    {
      title: "Upgrade Next.js 15 App Router & React 19 server actions", status: "DONE", priority: Priority.HIGH, type: "IMPROVEMENT",
      productName: "Apex Fleet Engine v3.4", assignee: david, reviewer: sarah, team: frontendTeam, dueDate: daysAgo(3), estimatedHours: 24,
      description: "Full suite modernization to Next.js 15.5, React 19 compiler optimizations, shared Turborepo caching. Removing deprecated getServerSideProps patterns.",
      aiSummary: "Modernized the core web application framework to the latest performance release, delivering faster page loads and reduced server resource utilization.",
      tags: ["Frontend", "Performance"],
      comments: [
        { author: sarah, body: "Outstanding! Lighthouse scores jumped 72→96 on the fleet dashboard. Ship it." },
        { author: david, body: "React compiler eliminated ~40% of unnecessary re-renders. Removed 3 `use client` boundaries blocking RSC streaming." },
      ],
    },
    {
      title: "Implement distributed tracing with OpenTelemetry & Jaeger", status: "DONE", priority: Priority.MEDIUM, type: "FEATURE",
      productName: "Aether KubeControl Portal", assignee: elena, reviewer: priya, team: platformTeam, dueDate: daysAgo(5), estimatedHours: 20,
      description: "Integrate OpenTelemetry auto-instrumentation across HTTP routes, Prisma queries, and Redis commands. Export spans to self-hosted Jaeger with 30-day retention.",
      aiSummary: "Deployed centralized system activity monitoring across all platform services, providing visibility to quickly diagnose slowdowns.",
      tags: ["Infrastructure", "Performance"],
    },
    {
      title: "Customer escalation: S3 upload timeout on 5GB sequence archives", status: "TODO", priority: Priority.CRITICAL, type: "SUPPORT_REQUEST",
      productName: "PulseBio Sequence Pipeline", assignee: support, team: supportTeam, dueDate: daysFromNow(1), estimatedHours: 4,
      description: "PulseBio clients report intermittent ETIMEDOUT uploading multi-GB paired-end archives over high-latency transatlantic links. Files > 2GB from EU partners.",
      aiSummary: "Investigating customer-reported upload timeouts affecting large genomic data files sent over transatlantic network links.",
      tags: ["SLA Critical", "Infrastructure"],
      comments: [
        { author: support, body: "SDK v1.2.1 has known part-size calculation bugs. Recommended upgrading to v1.2.5 and increasing socket timeout to 180s." },
        { author: fatima, body: "Issue is EU→US round-trip causing multipart upload initiation to timeout on HEAD requests. Need Transfer Acceleration enabled for their bucket." },
      ],
    },
    {
      title: "Build RBAC permission matrix UI for role editor", status: "IN_PROGRESS", priority: Priority.HIGH, type: "FEATURE",
      productName: "Apex Fleet Engine v3.4", assignee: aiko, reviewer: david, team: frontendTeam, dueDate: daysFromNow(7), estimatedHours: 18,
      description: "Create interactive permission matrix in Admin panel allowing super-admins to grant or revoke granular action permissions per custom role. Grid-based toggle with bulk select.",
      aiSummary: "Building an interactive, real-time permission management UI for workspace administrators.",
      tags: ["Frontend", "Auth", "Security"],
      comments: [
        { author: david, body: "Make permission groups collapsible — 80+ action keys, flat list is unworkable." },
        { author: aiko, body: "Done — grouped by module with expand/collapse. Diff indicator shows unsaved changes." },
      ],
    },
    {
      title: "Implement real-time collaborative note editing (CRDT)", status: "IN_PROGRESS", priority: Priority.MEDIUM, type: "FEATURE",
      productName: "NovaSpark Learning Engine", assignee: aiko, reviewer: david, team: frontendTeam, dueDate: daysFromNow(10), estimatedHours: 30,
      description: "Replace last-write-wins note save with Yjs CRDT layer. Server-side persistence via Prisma on 3-second intervals. Up to 50 simultaneous users conflict-free.",
      aiSummary: "Introducing conflict-free real-time document collaboration for the Canvas knowledge base.",
      tags: ["Frontend", "API"],
      comments: [
        { author: elena, body: "Consider y-websocket as sync server — supports persistence adapters natively." },
        { author: aiko, body: "Already implemented — y-websocket + custom Prisma persistence adapter. Awareness cursors showing live user positions too." },
      ],
    },
    {
      title: "Set up Playwright E2E test suite with visual regression", status: "IN_REVIEW", priority: Priority.MEDIUM, type: "FEATURE",
      productName: "NovaSpark Analytics Dashboard", assignee: noah, reviewer: david, team: qaTeam, dueDate: daysFromNow(3), estimatedHours: 24,
      description: "Playwright E2E covering: authentication, task creation, kanban drag-and-drop, report generation. Screenshot diff tests against baseline.",
      aiSummary: "Establishing comprehensive automated E2E testing with visual regression detection.",
      tags: ["Frontend", "Infrastructure"],
      testCases: [
        { title: "Login flow — valid credentials", steps: "1. Navigate to /login.\n2. Enter valid credentials.\n3. Assert redirect to dashboard.", expectedResult: "User lands on dashboard with correct session.", status: TestCaseStatus.PASSED },
        { title: "Kanban drag-and-drop status update", steps: "1. Open PMS board.\n2. Drag TODO task to IN_PROGRESS.\n3. Confirm API call and UI update.", expectedResult: "Task status updated and kanban column reflects change.", status: TestCaseStatus.PASSED },
        { title: "Visual regression — Dashboard hero", steps: "1. Load admin dashboard.\n2. Take screenshot.\n3. Compare against baseline.", expectedResult: "Pixel diff < 0.5%.", status: TestCaseStatus.PENDING },
      ],
    },
    {
      title: "k6 load test: 500 concurrent users on task search API", status: "TODO", priority: Priority.MEDIUM, type: "TASK",
      productName: "Apex Fleet Engine v3.4", assignee: noah, team: qaTeam, dueDate: daysFromNow(8), estimatedHours: 8,
      description: "Design and execute k6 load test simulating 500 concurrent users on /api/tasks/search with varied filter combinations. P95 latency target: <350ms.",
      aiSummary: "Running production-scale load tests to validate the task search API handles enterprise peak concurrency without latency degradation.",
      tags: ["Performance", "API"],
    },
    {
      title: "Implement SSO SAML 2.0 for enterprise Identity Providers", status: "TODO", priority: Priority.HIGH, type: "FEATURE",
      productName: "Vanguard Settlement Gateway", assignee: liam, team: apiTeam, dueDate: daysFromNow(14), estimatedHours: 32,
      description: "Add SAML 2.0 SP-initiated SSO for enterprise customers (Vanguard, Aether) to authenticate via Okta or Azure AD without separate credentials.",
      aiSummary: "Adding enterprise SSO to allow corporate IT teams to manage Zsyio access through their existing identity providers.",
      tags: ["Auth", "Security", "API"],
      comments: [
        { author: sarah, body: "Robert Sterling from Vanguard: Okta SAML 2.0 is a blocker for expanding 20→150 seats." },
        { author: liam, body: "Will use `node-saml`. Need Alex to spin up a test Okta tenant for integration testing." },
      ],
    },
    {
      title: "Migrate billing from Stripe Elements to Stripe Payment Element", status: "DONE", priority: Priority.MEDIUM, type: "IMPROVEMENT",
      productName: "Meridian Procurement Portal", assignee: liam, reviewer: sarah, team: apiTeam, dueDate: daysAgo(7), estimatedHours: 12,
      description: "Replace Stripe Elements with new Payment Element supporting 25+ payment methods, Link, and automatic currency detection. Add webhook signature verification.",
      aiSummary: "Modernizing payment UI to support wider payment methods and currencies, reducing checkout abandonment.",
      tags: ["API", "Security"],
    },
    {
      title: "Fix accessibility: keyboard navigation in Kanban board", status: "IN_PROGRESS", priority: Priority.MEDIUM, type: "BUG",
      productName: "Apex Fleet Engine v3.4", assignee: aiko, reviewer: david, team: frontendTeam, dueDate: daysFromNow(5), estimatedHours: 10,
      description: "Kanban board cards are not keyboard-accessible. Need arrow key navigation, Enter to open task detail, Shift+Arrow to move cards between columns.",
      aiSummary: "Fixing keyboard accessibility gaps to meet WCAG 2.1 AA standards.",
      tags: ["Frontend", "Accessibility"],
      testCases: [
        { title: "Tab cycles through all kanban cards", steps: "1. Focus first column.\n2. Press Tab repeatedly.\n3. Verify all cards receive focus.", expectedResult: "All cards receive visible focus ring, screen reader announces title.", status: TestCaseStatus.PASSED },
        { title: "Shift+Arrow moves card to adjacent column", steps: "1. Focus on a card.\n2. Press Shift+Right Arrow.", expectedResult: "Card moves to next column and focus follows.", status: TestCaseStatus.PENDING },
      ],
    },
    {
      title: "Implement CDN cache purge API for Starlight media", status: "IN_PROGRESS", priority: Priority.HIGH, type: "FEATURE",
      productName: "Starlight CDN Orchestrator", assignee: liam, reviewer: elena, team: apiTeam, dueDate: daysFromNow(3), estimatedHours: 14,
      description: "Webhook-triggered CDN cache purge API that automatically invalidates stale media assets after transcode job completion. Supports Cloudflare, Akamai, and Fastly.",
      aiSummary: "Automating CDN cache invalidation after media processing ensures viewers always receive the latest content.",
      tags: ["API", "Infrastructure"],
    },
    {
      title: "Fix CORS policy blocking EU clients on API gateway", status: "DONE", priority: Priority.CRITICAL, type: "BUG",
      productName: "Aether Cluster Metrics API", assignee: liam, reviewer: elena, team: apiTeam, dueDate: daysAgo(1), estimatedHours: 2,
      description: "Production CORS policy returns incorrect Access-Control-Allow-Origin for *.aethercloud.com EU subdomains, causing client-side fetch failures.",
      aiSummary: "Resolving a CORS misconfiguration actively blocking Aether's European teams from accessing the management API.",
      tags: ["API", "Security"],
      comments: [
        { author: liam, body: "Root cause: CORS regex matched `aethercloud.com` but not `eu.aethercloud.com`. Fixed with wildcard subdomain matcher + unit tests." },
        { author: elena, body: "Verified in staging — all EU subdomains pass CORS preflight correctly. Deploying hotfix." },
      ],
    },
    {
      title: "Automated database backup verification workflow", status: "TODO", priority: Priority.HIGH, type: "TASK",
      productName: "Vanguard Reconciliation Engine", assignee: priya, team: platformTeam, dueDate: daysFromNow(10), estimatedHours: 12,
      description: "Nightly job restores latest PostgreSQL backup to isolated instance, runs data integrity check, posts pass/fail report to Slack.",
      aiSummary: "Adding automated backup verification to provide daily confidence that production backups are valid and restorable.",
      tags: ["Infrastructure", "Database", "SLA Critical"],
    },
    {
      title: "Integrate adaptive video bitrate switching for mobile", status: "IN_PROGRESS", priority: Priority.MEDIUM, type: "FEATURE",
      productName: "Starlight Transcode Cluster", assignee: aiko, reviewer: liam, team: frontendTeam, dueDate: daysFromNow(12), estimatedHours: 22,
      description: "HLS adaptive bitrate selection in Starlight iOS/Android SDK based on real-time network conditions. 4-tier quality ladder with sliding window bandwidth estimator.",
      aiSummary: "Adding intelligent video quality adaptation to ensure mobile viewers get the best stream quality for their network.",
      tags: ["Mobile", "Performance"],
    },
    {
      title: "Automate genomic variant annotation with ClinVar", status: "TODO", priority: Priority.HIGH, type: "FEATURE",
      productName: "PulseBio Sequence Pipeline", assignee: liam, team: apiTeam, dueDate: daysFromNow(20), estimatedHours: 32,
      description: "Integrate ClinVar variant database annotations into FASTQ pipeline. Automatically classify variants as Pathogenic, Likely Pathogenic, VUS, or Benign.",
      aiSummary: "Automating clinical variant classification by integrating with authoritative genomic databases.",
      tags: ["API", "Database"],
    },
    {
      title: "Add export to CSV/Excel for procurement reports", status: "IN_REVIEW", priority: Priority.LOW, type: "IMPROVEMENT",
      productName: "Meridian Procurement Portal", assignee: noah, reviewer: sarah, team: qaTeam, dueDate: daysFromNow(2), estimatedHours: 8,
      description: "Server-side report export for Meridian Analytics. CSV and XLSX formats with proper column formatting, currency symbols, and date localization.",
      aiSummary: "Enabling procurement managers to export analytics data for offline analysis and executive reporting.",
      tags: ["Frontend", "API"],
    },
    {
      title: "Build supply chain risk scoring dashboard for Meridian", status: "TODO", priority: Priority.MEDIUM, type: "FEATURE",
      productName: "Meridian Procurement Portal", assignee: david, team: frontendTeam, dueDate: daysFromNow(18), estimatedHours: 28,
      description: "AI-assisted vendor risk scoring dashboard evaluating suppliers on delivery performance, geo-political risk, and financial health.",
      aiSummary: "Creating an intelligent risk assessment dashboard for real-time visibility into vendor reliability.",
      tags: ["Frontend", "API"],
    },
    {
      title: "NovaSpark Adaptive Learning recommendation engine", status: "TODO", priority: Priority.CRITICAL, type: "FEATURE",
      productName: "NovaSpark Learning Engine", assignee: elena, team: platformTeam, dueDate: daysFromNow(30), estimatedHours: 60,
      description: "Recommendation engine analyzing student quiz performance, time-on-task, and prior mastery to suggest optimal next learning modules. Knowledge graph traversal with confidence scoring.",
      aiSummary: "Building the core AI engine that personalizes the learning path for each student based on real-time performance data.",
      tags: ["API", "Database", "Performance"],
      comments: [{ author: marcus, body: "Core differentiator for NovaSpark's enterprise renewal. Elena — break this into sub-tasks in next sprint planning." }],
    },
  ];

  let ticketCounter = 1;
  for (const td of tasksData) {
    const product = productMap.get(td.productName);
    if (!product) { console.warn(`⚠️  Product not found: ${td.productName}`); continue; }

    const task = await prisma.task.create({
      data: {
        ticketNumber: ticketCounter++,
        title: td.title, description: td.description, status: td.status, priority: td.priority, type: td.type,
        productId: product.id, dueDate: td.dueDate, estimatedHours: td.estimatedHours ?? null,
        actualHours: 0, blockedReason: (td as any).blockedReason ?? null,
        aiSummary: td.aiSummary ?? null, aiSummaryUpdatedAt: td.aiSummary ? new Date() : null,
        createdById: sarah.id,
        assignedToId: td.assignee?.id ?? null, reviewerId: td.reviewer?.id ?? null, assignedTeamId: td.team?.id ?? null,
        assignees: td.assignee ? { create: { userId: td.assignee.id } } : undefined,
        reviewers: td.reviewer ? { create: { userId: td.reviewer.id } } : undefined,
        teams: td.team ? { create: { teamId: td.team.id } } : undefined,
        tags: td.tags ? { create: td.tags.filter((t) => tagMap.has(t)).map((t) => ({ tagId: tagMap.get(t)! })) } : undefined,
      },
    });

    if (td.testCases) {
      for (let j = 0; j < td.testCases.length; j++) {
        const tc = td.testCases[j];
        await prisma.testCase.create({
          data: { taskId: task.id, title: tc.title, steps: tc.steps, expectedResult: tc.expectedResult, status: tc.status, notes: (tc as any).notes ?? null, order: j, testedById: noah.id, testedAt: tc.status === TestCaseStatus.PASSED ? daysAgo(1) : null },
        });
      }
    }

    if (td.assignee && ["IN_PROGRESS","IN_REVIEW","QA","DONE"].includes(td.status)) {
      const mins1 = [90,120,150,180,210,240,100,160][ticketCounter % 8];
      const start1 = new Date(daysAgo(2)); start1.setHours(9,0,0,0);
      const end1 = new Date(start1.getTime() + mins1 * 60000);
      await prisma.taskTimeEntry.create({ data: { taskId: task.id, userId: td.assignee.id, startedAt: start1, endedAt: end1, durationMin: mins1, description: "Core implementation, design review, and unit test authoring", isBillable: true } });
      let totalMins = mins1;
      if (["QA","DONE"].includes(td.status)) {
        const mins2 = [60,75,90,105][ticketCounter % 4];
        const start2 = new Date(daysAgo(1)); start2.setHours(14,0,0,0);
        const end2 = new Date(start2.getTime() + mins2 * 60000);
        await prisma.taskTimeEntry.create({ data: { taskId: task.id, userId: td.assignee.id, startedAt: start2, endedAt: end2, durationMin: mins2, description: "QA iteration, regression testing, and documentation updates", isBillable: true } });
        totalMins += mins2;
      }
      await prisma.task.update({ where: { id: task.id }, data: { actualHours: Math.round((totalMins / 60) * 100) / 100 } });
    }

    if (td.comments) {
      for (const cm of td.comments) await prisma.comment.create({ data: { taskId: task.id, authorId: cm.author.id, body: cm.body } });
    }

    await prisma.activityLog.create({ data: { taskId: task.id, actorId: sarah.id, action: LogAction.STATUS_CHANGED, field: "status", oldValue: "TODO", newValue: td.status } });
  }
  console.log(`✅ 25 tasks created.`);

  // ── 9. Dashboard Broadcasts ──────────────────────────────────────────────────
  console.log("📢 9. Dashboard broadcasts...");
  for (const b of [
    { authorId: sarah.id, content: "🚀 **Sprint 42 Briefing**: Focus on Zero-Downtime database drills, OpenTelemetry deployment, and SOC2 readiness. Sprint review is Friday 3PM UTC.", targetAll: true, isPersonal: false },
    { authorId: marcus.id, content: "⭐ **Client Milestone**: Apex Global Logistics signed off on Fleet Engine v3.4 production cutover. Outstanding delivery from Engineering! 🎉", targetAll: true, isPersonal: false },
    { authorId: alex.id, content: "🔐 **Security Notice**: Annual SOC2 Type-II audit kicks off Monday. All engineers — review SSH key rotations and code signing certificates. Deadline: Friday COB.", targetAll: true, isPersonal: false },
    { authorId: rachel.id, content: "💰 **Pipeline Update**: Continental Aerospace MSA is in final legal review. If closed, this is our largest contract to date ($750K ARR) 🚀", targetAll: true, isPersonal: false },
    { authorId: marcus.id, content: "📅 **Reminder**: All timesheets must be submitted by Friday noon. HR is running Q3 payroll this weekend. Ensure all sessions and OOO breaks are logged.", targetAll: true, isPersonal: false },
  ]) await prisma.dashboardNote.create({ data: b });

  // ── 10. Notes (6 Folders, 14 Notes) ─────────────────────────────────────────
  console.log("📝 10. Knowledge base — 6 folders, 14 notes...");

  const engFolder = await prisma.noteFolder.create({ data: { name: "Engineering & Architecture", icon: "cpu", color: "blue", description: "Technical specs, API guidelines, and distributed system RFCs.", createdById: sarah.id, isWorkspaceRoot: true, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW } });

  await prisma.note.create({ data: { title: "RFC-042: Event-Driven Architecture with Kafka & Debezium", icon: "⚡", isPinned: true, authorId: elena.id, folderId: engFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_EDIT, content: `# RFC-042: Event-Driven Architecture & Change Data Capture\n\n## Status: Accepted — Implementation in Progress\n\n## Executive Summary\nMigrating critical service-to-service communication from synchronous REST polling to asynchronous event-driven streaming with Apache Kafka and Debezium CDC on PostgreSQL WAL logs.\n\n## Architecture Principles\n1. **Zero-Loss Guarantees** — Outbox pattern across all database transactions.\n2. **Sub-100ms Latency** — Stream consumer P99 latency target: < 85ms.\n3. **Idempotent Consumers** — Deduplication keys enforced on all consumer pipelines.\n\n\`\`\`mermaid\ngraph LR\n  A[PostgreSQL Database] -->|WAL Logs| B[Debezium Connector]\n  B --> C[Kafka Event Broker]\n  C --> D[Zsyio Flow PMS]\n  C --> E[Zsyio Pulse Sales]\n  C --> F[Audit Log Store]\n\`\`\`\n\n## Implementation Phases\n| Phase | Scope | Status | Owner |\n|-------|-------|--------|-------|\n| 1 | Kafka cluster provisioning | ✅ Done | Priya |\n| 2 | Debezium connector config | ✅ Done | Elena |\n| 3 | Task events migration | 🔄 In Progress | Liam |\n| 4 | Sales events migration | 📋 Planned | Elena |\n\n## Performance Benchmarks\n- Throughput: 142,000 events/sec at P50 latency 12ms\n- Consumer lag under sustained load: < 2,000 messages\n- Zero data loss confirmed across 72-hour chaos test\n` } });

  await prisma.note.create({ data: { title: "API Design Standards & OpenAPI Guidelines", icon: "📐", authorId: sarah.id, folderId: engFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# API Design Standards v2.1\n\n## REST Conventions\n- **Resource naming**: Plural nouns (\`/tasks\`, \`/users\`, \`/clients\`)\n- **HTTP methods**: Strict REST semantics — no RPC-style verbs in paths\n- **Versioning**: URL-based \`/api/v1/\` prefix; deprecation 90 days before removal\n- **Pagination**: Cursor-based using \`{ data, nextCursor, hasMore }\` envelope\n- **Error responses**: RFC 7807 Problem Details format\n\n## Security Requirements\n- All endpoints require Bearer JWT authentication\n- Rate limits: 1,000 req/min (standard), 10,000 req/min (enterprise)\n- CORS: Strict allowlist — no wildcard origins in production\n- Input validation: Zod schemas required on all mutation endpoints\n` } });

  await prisma.note.create({ data: { title: "Monorepo & Turborepo Architecture Guide", icon: "🏗️", authorId: david.id, folderId: engFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# Zsyio Monorepo Architecture\n\n## Workspace Structure\n\`\`\`\nzsyio-suit/\n├── apps/\n│   ├── admin/       # Admin & IAM (port 3001)\n│   ├── hrms/        # People & Attendance (port 3002)\n│   ├── notes/       # Canvas Knowledge Base (port 3003)\n│   ├── pms/         # Project Management (port 3004)\n│   └── sales/       # CRM & Pipeline (port 3005)\n├── packages/\n│   ├── auth/        # NextAuth + RBAC permissions\n│   ├── database/    # Prisma client + schema + seeds\n│   ├── ui/          # Shared component library\n│   ├── types/       # Shared TypeScript types\n│   └── validators/  # Zod validation schemas\n└── scripts/         # Seed scripts, token compiler\n\`\`\`\n\n## Key Conventions\n- **Shared types**: Always define in \`@zsyio/types\`, never duplicate\n- **No cross-app imports**: Apps can only import from \`packages/\`\n- **Component library**: All UI primitives must be in \`@zsyio/ui\`\n` } });

  const opsFolder = await prisma.noteFolder.create({ data: { name: "Security, Compliance & Runbooks", icon: "shield", color: "purple", description: "P1 incident response, SOC2 Type-II evidence, and operational runbooks.", createdById: sarah.id, isWorkspaceRoot: true, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW } });

  await prisma.note.create({ data: { title: "P1 Incident Escalation & Response Playbook", icon: "🚨", isPinned: true, authorId: priya.id, folderId: opsFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# Production P1 Incident Playbook v3.0\n\n## Severity Definitions\n| Level | Criteria | Response SLA | Update Cadence |\n|-------|----------|-------------|----------------|\n| **P1** | Production down, data loss risk, SLA breach | < 15 min | Every 20 min |\n| **P2** | Significant degradation, client-impacting | < 1 hour | Every 60 min |\n| **P3** | Minor degradation, workaround available | < 4 hours | At resolution |\n| **P4** | Cosmetic, no user impact | Next sprint | At resolution |\n\n## Immediate Actions (First 15 Minutes)\n1. 🚨 Open War Room: \`#incident-YYYY-MM-DD-p1\` Slack channel\n2. 📸 Execute automated cluster state snapshot\n3. 🔍 Pull Datadog/Jaeger traces for the affected service\n4. ⚡ Determine: rollback vs forward hotfix strategy\n5. 📢 Post initial status page update: "We are aware and investigating"\n\n## Common Runbooks\n- **Database failover**: \`scripts/failover/patroni-failover.sh\`\n- **Redis flush**: \`scripts/cache/redis-flush-selective.sh\`\n- **K8s pod restart**: \`kubectl rollout restart deploy/<service>\`\n` } });

  await prisma.note.create({ data: { title: "SOC2 Type-II Compliance Checklist — 2026", icon: "✅", authorId: alex.id, folderId: opsFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# SOC2 Type-II Audit Readiness — October 2026\n\n## Trust Service Criteria\n| TSC | Control Area | Status | Owner |\n|-----|-------------|--------|-------|\n| CC1 | Control Environment | ✅ Ready | Alex |\n| CC2 | Communication & Information | ✅ Ready | Sarah |\n| CC3 | Risk Assessment | 🔄 In Review | Priya |\n| CC6 | Logical & Physical Access | ✅ Ready | Alex |\n| CC7 | System Operations | ✅ Ready | Elena |\n| CC8 | Change Management | ✅ Ready | Marcus |\n\n## Key Evidence\n- [x] Penetration test — completed Aug 2026 (0 critical findings)\n- [x] Backup restoration drill — completed Sep 2026\n- [ ] SSH key rotation logs — due Oct 10\n- [ ] MFA enrollment report — 100% required\n\n**Auditor**: Prescient Assurance LLC\n**Audit Window**: Oct 15 – Nov 30, 2026\n` } });

  const salesFolder = await prisma.noteFolder.create({ data: { name: "Sales & Commercial Strategy", icon: "trending-up", color: "emerald", description: "Deal strategy, battlecards, pricing models, and expansion plans.", createdById: rachel.id, isWorkspaceRoot: true, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW } });

  await prisma.note.create({ data: { title: "Q4 2026 Enterprise Sales Playbook", icon: "💼", isPinned: true, authorId: rachel.id, folderId: salesFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# Q4 2026 Enterprise Sales Playbook\n\n## Pipeline Targets\n| Metric | Q3 Actual | Q4 Target | YoY Growth |\n|--------|-----------|-----------|------------|\n| Pipeline Value | $2.1M | $3.2M | +52% |\n| Closed Won | $890K | $1.4M | +57% |\n| New Enterprise Logos | 3 | 5 | +67% |\n| Avg Deal Cycle | 94 days | 75 days | -20% |\n\n## Top Opportunities\n1. **Continental Aerospace** — $750K ARR — Final legal review\n2. **Quantum Financial Group** — $500K ARR — Proposal under review\n3. **Horizon Retail Systems** — $320K ARR — Technical evaluation complete\n\n## Competitive Positioning vs Jira + Confluence\n| Dimension | Zsyio Suite | Jira + Confluence |\n|-----------|-------------|-------------------|\n| Integrated HRMS | ✅ Native | ❌ Integration required |\n| Sales CRM | ✅ Native | ❌ Integration required |\n| Price (per seat/mo) | $28 | $42 bundled |\n` } });

  const productFolder = await prisma.noteFolder.create({ data: { name: "Product Vision & Design System", icon: "layers", color: "sky", description: "Roadmap, UX research, design tokens, and component guidelines.", createdById: david.id, isWorkspaceRoot: true, generalAccess: NoteGeneralAccess.WORKSPACE_EDIT } });

  await prisma.note.create({ data: { title: "Zsyio Design System — Token Reference", icon: "🎨", authorId: david.id, folderId: productFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# Zsyio Design System — Token Reference\n\n## Color Palette (Semantic Tokens)\n\`\`\`css\n--color-surface-base: hsl(240, 6%, 10%);\n--color-surface-subtle: hsl(240, 5%, 13%);\n--color-primary: hsl(255, 74%, 61%);\n--color-success: hsl(142, 71%, 45%);\n--color-warning: hsl(38, 92%, 50%);\n--color-error: hsl(0, 84%, 60%);\n\`\`\`\n\n## Typography Scale\n| Token | Size | Weight | Usage |\n|-------|------|--------|-------|\n| \`text-display\` | 32px | 700 | Page titles |\n| \`text-heading\` | 20px | 600 | Section headers |\n| \`text-body\` | 14px | 400 | Body copy |\n| \`text-caption\` | 12px | 400 | Meta text |\n\n## Component Rules\n- Use \`KpiCard\` for all metric widgets\n- Use \`DashboardHero\` for app entry points\n- Avoid raw Tailwind colors — always use CSS variables\n` } });

  await prisma.note.create({ data: { title: "Sprint 43 Roadmap & Priorities", icon: "🗺️", authorId: marcus.id, folderId: productFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_EDIT, content: `# Sprint 43 — Nov 3 – Nov 14, 2026\n\n**Sprint Goal**: "Foundation Sprint" — Harden SSO, ship CRDT notes, close E2E coverage gap.\n\n## Committed Deliverables\n| Priority | Item | Owner | Status |\n|----------|------|-------|--------|\n| P0 | SAML 2.0 SSO for Vanguard | Liam | Planned |\n| P0 | CRDT collaborative editing (Beta) | Aiko | In Progress |\n| P1 | Playwright E2E — 80% coverage | Noah | Planned |\n| P1 | Adaptive bitrate for Starlight mobile | Aiko | In Progress |\n| P2 | Meridian CSV export | Noah | In Review |\n\n## Sprint Review: Friday Nov 14 @ 3PM UTC\n` } });

  const hrFolder = await prisma.noteFolder.create({ data: { name: "People & HR Policies", icon: "users", color: "rose", description: "Leave policies, remote work guidelines, and onboarding checklists.", createdById: sarah.id, isWorkspaceRoot: true, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW } });

  await prisma.note.create({ data: { title: "Remote Work & Async Communication Policy", icon: "🌍", authorId: sarah.id, folderId: hrFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# Remote Work & Async Communication Policy v2.0\n\n## Core Principles\n1. **Async-first** — Default to written, asynchronous communication\n2. **Overlap windows** — Each team must share ≥4 hours overlap with their lead\n3. **Deep work blocks** — No mandatory meetings before 10 AM or after 4 PM local time\n\n## Communication SLAs\n| Channel | Expected Response Time |\n|---------|------------------------|\n| Slack DM | Within 4 working hours |\n| @-mention | Within 2 working hours |\n| Email | Within 24 working hours |\n| Urgent P1 | Immediate — call or SMS |\n\n## WFH Equipment Stipend\n€1,500 / year. Submit receipts via the People portal.\n` } });

  await prisma.note.create({ data: { title: "New Engineer Onboarding Checklist", icon: "🎯", authorId: marcus.id, folderId: hrFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# New Engineer Onboarding — 30-Day Checklist\n\n## Week 1: Setup & Orientation\n- [ ] Complete IT security training (required before repo access)\n- [ ] Clone and build \`zsyio-suit\` monorepo locally\n- [ ] Read RFC-042 and Design System guide\n- [ ] Meet with engineering manager for goal-setting 1:1\n- [ ] Join \`#engineering\`, \`#incidents\`, \`#ship-it\` Slack channels\n\n## Week 2: First Contribution\n- [ ] Complete first assigned bug fix\n- [ ] Submit first PR with passing CI and tests\n- [ ] Pair with buddy engineer for live debugging session\n\n## Week 3-4: Domain Deep-Dive\n- [ ] Shadow sprint planning and sprint review meetings\n- [ ] Complete a self-assigned feature from the backlog\n- [ ] Present first feature in weekly engineering demo\n` } });

  const csFolder = await prisma.noteFolder.create({ data: { name: "Customer Success & Client Notes", icon: "heart", color: "amber", description: "Client meeting notes, QBRs, and account health tracking.", createdById: support.id, isWorkspaceRoot: true, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW } });

  await prisma.note.create({ data: { title: "Apex Global Logistics — Q3 QBR Notes", icon: "🚛", authorId: support.id, folderId: csFolder.id, generalAccess: NoteGeneralAccess.WORKSPACE_VIEW, content: `# Apex Global Logistics — Q3 2026 QBR\n\n**Date**: September 26, 2026\n**Attendees**: Julian Vance (Apex CTO), Marcus Brody, Rachel Green, Support Desk\n\n## Q3 Performance\n| Metric | Target | Actual | Status |\n|--------|--------|--------|--------|\n| Uptime | 99.95% | 99.98% | ✅ |\n| P1 Incidents | 0 | 1 | ⚠️ (resolved <2h) |\n| Avg API Latency | <200ms | 142ms | ✅ |\n| Support tickets avg resolution | <24h | 8.3h | ✅ |\n\n## Key Wins\n- Fleet Engine v3.4 cutover with zero downtime ✅\n- Telemetry API handles 2.4M position updates/day ✅\n- Driver mobile app performance improved 40%\n\n## Action Items\n1. Dedicated Slack channel for P1 escalations — Owner: Support, Due: Oct 15\n2. Real-time fleet webhook API — Owner: Liam, Due: Nov sprint\n3. EU GDPR data residency in Frankfurt — Owner: Priya (blocked on VPC peering)\n\n## Contract Renewal\nCurrent: $450K ARR | Renewal: March 2027 | Expansion: +$180K (Safety Analytics)\n` } });

  // Star some notes
  const allNotes = await prisma.note.findMany({ select: { id: true } });
  if (allNotes.length >= 4) {
    await prisma.noteStar.createMany({
      data: [
        { userId: elena.id, noteId: allNotes[0].id }, { userId: david.id, noteId: allNotes[0].id },
        { userId: sarah.id, noteId: allNotes[3].id }, { userId: marcus.id, noteId: allNotes[1].id },
      ],
      skipDuplicates: true,
    });
  }
  console.log(`✅ 6 folders, 12 notes created.`);

  // ── 11. HRMS ────────────────────────────────────────────────────────────────
  console.log("⏱️  11. HRMS — policies, 30-day attendance, leaves...");

  await prisma.hrPolicySettings.upsert({
    where: { id: "default-hr-policy" }, update: {},
    create: { id: "default-hr-policy", standardDailyHours: 8.0, halfDayMinimumHours: 4.0, overtimeThresholdMins: 30, weekendDays: "0,6", updatedById: sarah.id },
  });

  for (const h of [
    { name: "New Year's Day", date: "2026-01-01", year: 2026 },
    { name: "Martin Luther King Jr. Day", date: "2026-01-19", year: 2026 },
    { name: "Memorial Day", date: "2026-05-25", year: 2026 },
    { name: "Independence Day", date: "2026-07-04", year: 2026 },
    { name: "Labor Day", date: "2026-09-07", year: 2026 },
    { name: "Thanksgiving Day", date: "2026-11-26", year: 2026 },
    { name: "Black Friday", date: "2026-11-27", year: 2026, isOptional: true },
    { name: "Christmas Eve", date: "2026-12-24", year: 2026, isOptional: true },
    { name: "Christmas Day", date: "2026-12-25", year: 2026 },
    { name: "New Year's Eve", date: "2026-12-31", year: 2026, isOptional: true },
  ]) await prisma.companyHoliday.create({ data: { name: h.name, date: h.date, year: h.year, isOptional: (h as any).isOptional ?? false } });

  const leavePolicies = [
    { leaveType: LeaveType.EARNED, label: "Paid Time Off (PTO)", totalDays: 20.0, color: "emerald", carryForward: true, maxCarryDays: 5.0 },
    { leaveType: LeaveType.SICK, label: "Sick & Medical Leave", totalDays: 10.0, color: "amber", carryForward: false },
    { leaveType: LeaveType.CASUAL, label: "Personal Casual Leave", totalDays: 8.0, color: "blue", carryForward: false },
    { leaveType: LeaveType.COMPENSATORY, label: "Compensatory Off", totalDays: 5.0, color: "purple", carryForward: false },
    { leaveType: LeaveType.UNPAID, label: "Unpaid Leave", totalDays: 30.0, color: "gray", carryForward: false },
  ];
  for (const lp of leavePolicies) await prisma.leavePolicy.create({ data: lp });

  // HR Policy Settings
  await prisma.hrPolicySettings.upsert({
    where: { id: "default-hr-policy" },
    create: {
      id: "default-hr-policy",
      standardDailyHours: 8.0,
      halfDayMinimumHours: 4.0,
      overtimeThresholdMins: 30,
      weekendDays: "0,6",
      updatedById: admin.id,
    },
    update: {
      standardDailyHours: 8.0,
      halfDayMinimumHours: 4.0,
      overtimeThresholdMins: 30,
      weekendDays: "0,6",
    },
  });

  // User Leave Allocations for ALL users (2026)
  for (const u of [admin, marcus, sarah, david, elena, priya, liam, aiko, noah, rachel, fatima, alex, support, superadmin].filter(Boolean)) {
    for (const lp of leavePolicies) {
      await prisma.userLeaveAllocation.create({
        data: {
          userId: u!.id,
          leaveType: lp.leaveType,
          year: 2026,
          totalDays: lp.totalDays,
          notes: "Annual company quota allocation for 2026",
        },
      });
    }
  }

  // 30-day work session history for all active team members
  const teamMembersWithHistory = [admin, marcus, sarah, david, elena, priya, liam, aiko, noah, rachel, fatima, alex].filter(Boolean);
  const now = new Date();
  const todayNormalized = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

  for (const u of teamMembersWithHistory) {
    const isCurrentAdmin = u!.id === admin.id;

    for (let dayOffset = 29; dayOffset >= 1; dayOffset--) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - dayOffset);
      const normalizedDay = new Date(Date.UTC(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate(), 0, 0, 0, 0));
      const dow = normalizedDay.getUTCDay();

      if (dow === 0) continue;
      if (dow === 6 && dayOffset > 7) continue;

      const seedVal = (u!.email.length * 37 + dayOffset * 19) % 100;
      const startMinutes = [0, 10, 15, 20, 30, 45][seedVal % 6];
      const startTime = new Date(normalizedDay);
      startTime.setUTCHours(8, startMinutes, 0, 0);

      const isIncomplete = isCurrentAdmin && dayOffset === 2;
      if (isIncomplete) {
        await prisma.workSession.create({
          data: {
            userId: u!.id,
            createdById: u!.id,
            date: normalizedDay,
            startTime,
            endTime: null,
            durationMinutes: null,
            status: SessionStatus.INCOMPLETE,
            approvalStatus: ApprovalStatus.PENDING,
            reason: "System auto-flagged: Session was not clocked out at end of business day",
          },
        });
        continue;
      }

      const durationOptions = [465, 480, 495, 510, 525, 540];
      const duration = durationOptions[seedVal % durationOptions.length];
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const ws = await prisma.workSession.create({
        data: {
          userId: u!.id,
          createdById: u!.id,
          date: normalizedDay,
          startTime,
          endTime,
          durationMinutes: duration,
          status: SessionStatus.COMPLETED,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      });

      const breakOffsetHours = 3.5 + (seedVal % 3) * 0.5;
      const breakStart = new Date(startTime.getTime() + breakOffsetHours * 3600000);
      const breakMinutes = seedVal % 2 === 0 ? 45 : 60;
      const breakEnd = new Date(breakStart.getTime() + breakMinutes * 60000);

      await prisma.oooSession.create({
        data: {
          userId: u!.id,
          createdById: u!.id,
          workSessionId: ws.id,
          date: normalizedDay,
          startTime: breakStart,
          endTime: breakEnd,
          durationMinutes: breakMinutes,
          status: SessionStatus.COMPLETED,
          approvalStatus: ApprovalStatus.APPROVED,
          reason: "Lunch break",
        },
      });
    }
  }

  // TODAY Live Sessions (Clocked in, On break, Clocked out)
  // Admin clocked in & working
  const adminTodayStart = new Date(todayNormalized);
  adminTodayStart.setUTCHours(7, 30, 0, 0);
  const adminWorkSession = await prisma.workSession.create({
    data: {
      userId: admin.id,
      createdById: admin.id,
      date: todayNormalized,
      startTime: adminTodayStart,
      status: SessionStatus.ACTIVE,
      approvalStatus: ApprovalStatus.APPROVED,
      entryType: "AUTOMATIC",
    },
  });
  const adminBreakStart = new Date(todayNormalized);
  adminBreakStart.setUTCHours(9, 30, 0, 0);
  await prisma.oooSession.create({
    data: {
      userId: admin.id,
      createdById: admin.id,
      workSessionId: adminWorkSession.id,
      date: todayNormalized,
      startTime: adminBreakStart,
      endTime: new Date(todayNormalized.getTime() + 10 * 3600000),
      durationMinutes: 30,
      status: SessionStatus.COMPLETED,
      approvalStatus: ApprovalStatus.APPROVED,
      reason: "Morning coffee & architecture review",
    },
  });

  // Active workers today
  for (const worker of [
    { user: david, startHour: 7, startMin: 0 },
    { user: elena, startHour: 7, startMin: 15 },
    { user: liam, startHour: 8, startMin: 0 },
    { user: rachel, startHour: 7, startMin: 45 },
    { user: marcus, startHour: 6, startMin: 45 },
  ]) {
    if (!worker.user) continue;
    const startTime = new Date(todayNormalized);
    startTime.setUTCHours(worker.startHour, worker.startMin, 0, 0);
    await prisma.workSession.create({
      data: {
        userId: worker.user.id,
        createdById: worker.user.id,
        date: todayNormalized,
        startTime,
        status: SessionStatus.ACTIVE,
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });
  }

  // Workers on break today
  for (const bw of [
    { user: priya, startHour: 6, startMin: 30, breakReason: "Lunch break", breakStartHour: 10, breakStartMin: 30 },
    { user: noah, startHour: 7, startMin: 15, breakReason: "Coffee & sprint review catch-up", breakStartHour: 10, breakStartMin: 45 },
    { user: fatima, startHour: 6, startMin: 45, breakReason: "Client call transition break", breakStartHour: 10, breakStartMin: 50 },
  ]) {
    if (!bw.user) continue;
    const workStart = new Date(todayNormalized);
    workStart.setUTCHours(bw.startHour, bw.startMin, 0, 0);
    const ws = await prisma.workSession.create({
      data: { userId: bw.user.id, createdById: bw.user.id, date: todayNormalized, startTime: workStart, status: SessionStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED },
    });
    const breakStart = new Date(todayNormalized);
    breakStart.setUTCHours(bw.breakStartHour, bw.breakStartMin, 0, 0);
    await prisma.oooSession.create({
      data: { userId: bw.user.id, createdById: bw.user.id, workSessionId: ws.id, date: todayNormalized, startTime: breakStart, status: SessionStatus.ACTIVE, approvalStatus: ApprovalStatus.APPROVED, reason: bw.breakReason },
    });
  }

  // Completed today shifts
  for (const ct of [
    { user: aiko, startHour: 4, durationMins: 390 },
    { user: support, startHour: 3, durationMins: 420 },
    { user: alex, startHour: 4, durationMins: 330 },
  ]) {
    if (!ct.user) continue;
    const startTime = new Date(todayNormalized);
    startTime.setUTCHours(ct.startHour, 0, 0, 0);
    await prisma.workSession.create({
      data: { userId: ct.user.id, createdById: ct.user.id, date: todayNormalized, startTime, endTime: new Date(startTime.getTime() + ct.durationMins * 60000), durationMinutes: ct.durationMins, status: SessionStatus.COMPLETED, approvalStatus: ApprovalStatus.APPROVED },
    });
  }

  // Comprehensive Leave Requests
  for (const lr of [
    { user: admin, leaveType: LeaveType.EARNED, startDate: new Date("2026-09-14"), endDate: new Date("2026-09-16"), daysCount: 3, reason: "Annual Q3 Executive Strategy & Family Retreat", status: LeaveStatus.APPROVED, reviewer: marcus, reviewerComment: "Approved by Engineering Leadership." },
    { user: admin, leaveType: LeaveType.CASUAL, startDate: new Date("2026-08-21"), endDate: new Date("2026-08-21"), daysCount: 1, reason: "Personal banking and residential relocation administrative work", status: LeaveStatus.APPROVED, reviewer: marcus, reviewerComment: "Approved." },
    { user: admin, leaveType: LeaveType.SICK, startDate: new Date("2026-09-04"), endDate: new Date("2026-09-04"), daysCount: 1, reason: "Viral flu recovery and medical rest", status: LeaveStatus.APPROVED, reviewer: sarah, reviewerComment: "Get well soon!" },
    { user: admin, leaveType: LeaveType.EARNED, startDate: new Date("2026-11-17"), endDate: new Date("2026-11-20"), daysCount: 4, reason: "Q4 Year-End Vacation & Holiday Family Travel", status: LeaveStatus.PENDING, reviewer: null, reviewerComment: null },
    { user: sarah, leaveType: LeaveType.SICK, startDate: new Date("2026-10-02"), endDate: new Date("2026-10-05"), daysCount: 3, reason: "Post-surgery recovery and doctor recommended bed rest", status: LeaveStatus.APPROVED, reviewer: admin, reviewerComment: "Approved. Take rest Sarah." },
    { user: superadmin, leaveType: LeaveType.EARNED, startDate: new Date("2026-10-01"), endDate: new Date("2026-10-06"), daysCount: 4, reason: "Bavaria hiking expedition and off-grid retreat", status: LeaveStatus.APPROVED, reviewer: admin, reviewerComment: "Approved by leadership." },
    { user: liam, leaveType: LeaveType.EARNED, startDate: new Date("2026-11-03"), endDate: new Date("2026-11-07"), daysCount: 5, reason: "Annual vacation — Spain road trip and Mediterranean photography", status: LeaveStatus.PENDING, reviewer: null, reviewerComment: null },
    { user: elena, leaveType: LeaveType.CASUAL, startDate: new Date("2026-10-12"), endDate: new Date("2026-10-12"), daysCount: 1, reason: "Family anniversary and children's school convocation ceremony", status: LeaveStatus.PENDING, reviewer: null, reviewerComment: null },
    { user: noah, leaveType: LeaveType.COMPENSATORY, startDate: new Date("2026-10-09"), endDate: new Date("2026-10-09"), daysCount: 1, reason: "Comp-off for midnight production release and hotfix deployment", status: LeaveStatus.PENDING, reviewer: null, reviewerComment: null },
    { user: priya, leaveType: LeaveType.EARNED, startDate: new Date("2026-11-24"), endDate: new Date("2026-11-26"), daysCount: 3, reason: "Thanksgiving family gathering and out-of-state travel", status: LeaveStatus.PENDING, reviewer: null, reviewerComment: null },
    { user: david, leaveType: LeaveType.EARNED, startDate: new Date("2026-10-20"), endDate: new Date("2026-10-24"), daysCount: 5, reason: "Family vacation — pre-aligned with Marcus and frontend squad", status: LeaveStatus.APPROVED, reviewer: marcus, reviewerComment: "Approved." },
    { user: aiko, leaveType: LeaveType.CASUAL, startDate: new Date("2026-10-15"), endDate: new Date("2026-10-15"), daysCount: 0.5, isHalfDay: true, halfDayType: "FIRST_HALF", reason: "Morning specialist doctor consultation", status: LeaveStatus.APPROVED, reviewer: marcus, reviewerComment: "Approved." },
    { user: rachel, leaveType: LeaveType.CASUAL, startDate: new Date("2026-09-18"), endDate: new Date("2026-09-18"), daysCount: 1, reason: "Apartment lease signing and utility setup", status: LeaveStatus.APPROVED, reviewer: marcus, reviewerComment: "Approved." },
    { user: marcus, leaveType: LeaveType.EARNED, startDate: new Date("2026-09-28"), endDate: new Date("2026-09-30"), daysCount: 3, reason: "Long weekend trip during Q3 closing", status: LeaveStatus.REJECTED, reviewer: admin, reviewerComment: "Cannot approve during Q3 enterprise billing cutover." },
  ]) {
    if (!lr.user) continue;
    await prisma.leaveRequest.create({
      data: {
        userId: lr.user.id, leaveType: lr.leaveType, startDate: lr.startDate, endDate: lr.endDate, daysCount: lr.daysCount,
        isHalfDay: (lr as any).isHalfDay ?? false, halfDayType: (lr as any).halfDayType ?? null,
        reason: lr.reason, status: lr.status, reviewerId: lr.reviewer?.id ?? null,
        reviewerComment: lr.reviewerComment ?? null, reviewedAt: lr.reviewer ? daysAgo(2) : null,
      },
    });
  }

  // Attendance Regularizations
  for (const reg of [
    { user: admin, date: new Date("2026-10-01"), type: RegularizationType.MISSED_PUNCH_OUT, requestedClockIn: new Date("2026-10-01T08:30:00.000Z"), requestedClockOut: new Date("2026-10-01T17:45:00.000Z"), reason: "Corporate VPN tunnel dropped unexpectedly at 17:30; continued working locally without punch station access.", status: RegularizationStatus.PENDING, reviewer: null },
    { user: david, date: new Date("2026-09-28"), type: RegularizationType.MISSED_PUNCH_IN, requestedClockIn: new Date("2026-09-28T08:45:00.000Z"), requestedClockOut: new Date("2026-09-28T17:30:00.000Z"), reason: "Office building keycard and biometric terminal offline during emergency evacuation drill.", status: RegularizationStatus.PENDING, reviewer: null },
    { user: priya, date: new Date("2026-09-25"), type: RegularizationType.MISSED_BOTH, requestedClockIn: new Date("2026-09-25T09:00:00.000Z"), requestedClockOut: new Date("2026-09-25T18:15:00.000Z"), reason: "Handled offsite emergency P1 client triage call from home before commute.", status: RegularizationStatus.PENDING, reviewer: null },
    { user: liam, date: new Date("2026-09-29"), type: RegularizationType.TIME_CORRECTION, requestedClockIn: new Date("2026-09-29T09:15:00.000Z"), requestedClockOut: new Date("2026-09-29T19:00:00.000Z"), reason: "Stayed 1h 15m overtime assisting security compliance vulnerability patch.", status: RegularizationStatus.PENDING, reviewer: null },
    { user: elena, date: new Date("2026-09-18"), type: RegularizationType.MISSED_PUNCH_OUT, requestedClockIn: new Date("2026-09-18T08:30:00.000Z"), requestedClockOut: new Date("2026-09-18T17:15:00.000Z"), reason: "Laptop battery died right before clocking out at airport departure lounge.", status: RegularizationStatus.APPROVED, reviewer: marcus, reviewerComment: "Approved. Verified Git commit timestamps." },
    { user: noah, date: new Date("2026-09-15"), type: RegularizationType.MISSED_PUNCH_IN, requestedClockIn: new Date("2026-09-15T09:00:00.000Z"), requestedClockOut: new Date("2026-09-15T17:30:00.000Z"), reason: "Forgot to punch in after morning dentist appointment.", status: RegularizationStatus.APPROVED, reviewer: marcus, reviewerComment: "Approved based on Slack standup message." },
    { user: aiko, date: new Date("2026-09-11"), type: RegularizationType.TIME_CORRECTION, requestedClockIn: new Date("2026-09-11T09:00:00.000Z"), requestedClockOut: new Date("2026-09-11T18:45:00.000Z"), reason: "Worked extra 45m finalizing Design System Figma tokens sync.", status: RegularizationStatus.APPROVED, reviewer: admin, reviewerComment: "Approved. Design System release delivered on schedule." },
  ]) {
    if (!reg.user) continue;
    await prisma.attendanceRegularization.create({
      data: {
        userId: reg.user.id,
        date: reg.date,
        type: reg.type,
        requestedClockIn: reg.requestedClockIn,
        requestedClockOut: reg.requestedClockOut,
        reason: reg.reason,
        status: reg.status,
        reviewerId: reg.reviewer?.id ?? null,
        reviewerComment: (reg as any).reviewerComment ?? null,
        reviewedAt: reg.reviewer ? daysAgo(3) : null,
      },
    });
  }
  console.log("✅ HRMS seeded with rich attendance, breaks, leave requests & regularizations.");

  // ── 12. Sales CRM ───────────────────────────────────────────────────────────
  console.log("💰 12. Sales CRM — 8 leads with activity history...");

  const pipeline = await prisma.salesPipeline.create({
    data: {
      name: "Enterprise WorkOS Deal Pipeline",
      description: "Core sales funnel for enterprise logistics, healthtech, fintech, and media contracts.",
      isDefault: true,
      stages: { create: [
        { name: "New Lead", stageKey: SalesStage.NEW_LEAD, order: 0, color: "#6366f1" },
        { name: "Contacted", stageKey: SalesStage.CONTACTED, order: 1, color: "#3b82f6" },
        { name: "Qualified", stageKey: SalesStage.QUALIFIED, order: 2, color: "#8b5cf6" },
        { name: "Proposal Sent", stageKey: SalesStage.PROPOSAL_SENT, order: 3, color: "#f59e0b" },
        { name: "Negotiation", stageKey: SalesStage.NEGOTIATION, order: 4, color: "#f97316" },
        { name: "Won", stageKey: SalesStage.WON, order: 5, color: "#10b981" },
        { name: "Lost", stageKey: SalesStage.LOST, order: 6, color: "#ef4444" },
      ]},
    },
    include: { stages: true },
  });

  const stageIdMap = new Map<SalesStage, string>();
  for (const st of pipeline.stages) stageIdMap.set(st.stageKey, st.id);

  const sTagMap = new Map<string, string>();
  for (const st of [
    { name: "Enterprise", color: "purple" }, { name: "High ARR", color: "emerald" },
    { name: "Urgent", color: "red" }, { name: "Strategic", color: "blue" }, { name: "Expansion", color: "amber" },
  ]) { const c = await prisma.salesTag.create({ data: st }); sTagMap.set(st.name, c.id); }

  const leadsData = [
    {
      companyName: "BioGenTech Diagnostics", contactName: "Dr. Gregory House", email: "house@biogentech.com", phone: "+1 (609) 555-0144",
      stage: SalesStage.NEW_LEAD, dealValue: 180000, priority: SalesPriority.HIGH, probability: 15, expectedCloseAt: daysFromNow(90),
      leadSource: "Inbound — BioIT World 2026 Conference", notes: "Seeking unified lab workflow and genomic data pipeline. Evaluating 3 vendors.", tags: ["Enterprise","Strategic"],
      activities: [
        { type: SalesActivityType.NOTE, title: "Initial Qualification", description: "8 labs, 120 researchers. Strong fit for PMS + Notes modules.", createdAt: daysAgo(5) },
        { type: SalesActivityType.EMAIL, title: "Intro email sent", description: "Sent product overview deck, requested 30-min discovery call.", createdAt: daysAgo(4) },
      ],
    },
    {
      companyName: "Helios Renewable Energy", contactName: "Marcus Vance", email: "m.vance@heliosenergy.com", phone: "+1 (303) 555-9122",
      stage: SalesStage.CONTACTED, dealValue: 240000, priority: SalesPriority.MEDIUM, probability: 30, expectedCloseAt: daysFromNow(60),
      leadSource: "LinkedIn outbound — Rachel Green", notes: "Discovery call complete. Scheduling technical deep dive. 200-seat deal potential.", tags: ["Enterprise"],
      activities: [
        { type: SalesActivityType.NOTE, title: "Lead registered", description: "450-person renewable energy company. Current PM tool: Asana.", createdAt: daysAgo(12) },
        { type: SalesActivityType.CALL, title: "Discovery call — 30 min", description: "Pain points: no time tracking, no client portal. Wants full demo.", createdAt: daysAgo(8) },
        { type: SalesActivityType.EMAIL, title: "Demo invitation sent", description: "Scheduled walkthrough for Oct 14 @ 2PM EST.", createdAt: daysAgo(6) },
      ],
    },
    {
      companyName: "Horizon Retail Systems", contactName: "Melissa Chen", email: "melissa@horizonretail.com", phone: "+1 (214) 555-7731",
      stage: SalesStage.QUALIFIED, dealValue: 320000, priority: SalesPriority.HIGH, probability: 55, expectedCloseAt: daysFromNow(45),
      leadSource: "Partner referral — TechNexus consulting", notes: "Budget approved. GDPR + SOC2 compliance confirmed. Champion: Melissa Chen (CTO).", tags: ["Enterprise","High ARR"],
      activities: [
        { type: SalesActivityType.NOTE, title: "Qualified", description: "60-person eng org. GDPR compliant ops required. Budget confirmed: $320K/yr.", createdAt: daysAgo(20) },
        { type: SalesActivityType.MEETING, title: "Full suite product demo", description: "2-hour demo. Very positive on integrated HRMS module.", createdAt: daysAgo(14) },
        { type: SalesActivityType.CALL, title: "Security review call", description: "Reviewed SOC2 report and GDPR DPA with their legal team. No blockers.", createdAt: daysAgo(7) },
        { type: SalesActivityType.FOLLOWUP, title: "Procurement timeline follow-up", description: "Q4 window open. Requesting custom proposal.", createdAt: daysAgo(2) },
      ],
    },
    {
      companyName: "Quantum Financial Group", contactName: "Arthur Pendelton", email: "pendelton@quantumfin.com", phone: "+1 (212) 555-9831",
      stage: SalesStage.PROPOSAL_SENT, dealValue: 500000, priority: SalesPriority.CRITICAL, probability: 65, expectedCloseAt: daysFromNow(30),
      leadSource: "Warm intro via Alex Vance — board network", notes: "Custom enterprise 3-year proposal submitted. Dedicated SLA + white-glove onboarding. 250-seat.", tags: ["Enterprise","High ARR","Urgent"],
      activities: [
        { type: SalesActivityType.NOTE, title: "Lead from board network", description: "SVP Engineering. 250-seat potential. Finance-sector compliance required.", createdAt: daysAgo(35) },
        { type: SalesActivityType.MEETING, title: "Executive C-suite presentation", description: "Presented to CFO, CTO, CISO. Focused on SOC2 and audit trail.", createdAt: daysAgo(22) },
        { type: SalesActivityType.NOTE, title: "Proposal submitted", description: "$500K ARR, 3-year, Tier-1 SLA (15-min P1 response) + SAML 2.0 SSO.", createdAt: daysAgo(3) },
      ],
    },
    {
      companyName: "Continental Aerospace", contactName: "Col. Thomas Miller", email: "miller@continentalaero.com", phone: "+1 (703) 555-4421",
      stage: SalesStage.NEGOTIATION, dealValue: 750000, priority: SalesPriority.CRITICAL, probability: 80, expectedCloseAt: daysFromNow(14),
      leadSource: "Defense contractor network", notes: "Final MSA contract review with legal. Targeting EOQ signature. Largest deal in company history.", tags: ["Enterprise","High ARR","Strategic","Urgent"],
      activities: [
        { type: SalesActivityType.NOTE, title: "Deal initiated", description: "800-person aerospace engineering program. 5-year contract potential.", createdAt: daysAgo(60) },
        { type: SalesActivityType.MEETING, title: "CTO briefing — compliance", description: "3-hour deep-dive on data residency, ITAR compliance, air-gapped deployment.", createdAt: daysAgo(40) },
        { type: SalesActivityType.CALL, title: "Pricing negotiation round 1", description: "Requested 15% discount Year 1. Countered with enhanced SLA package.", createdAt: daysAgo(20) },
        { type: SalesActivityType.MEETING, title: "Legal red-line review", description: "MSA red-lines exchanged. Final draft in review.", createdAt: daysAgo(7) },
        { type: SalesActivityType.FOLLOWUP, title: "Signature timeline", description: "Miller confirmed target: Oct 15. Board approval obtained Oct 1.", createdAt: daysAgo(2) },
      ],
    },
    {
      companyName: "Apex Global Logistics", contactName: "Julian Vance", email: "julian@apexlogistics.io", phone: "+1 (415) 890-4421",
      stage: SalesStage.WON, dealValue: 450000, priority: SalesPriority.HIGH, probability: 100, expectedCloseAt: daysAgo(90),
      leadSource: "Inbound — product hunt launch", notes: "Contract signed. Converted to DEVELOPMENT client. Q1 expansion: +$180K Safety Analytics.", tags: ["Enterprise","Expansion"],
      activities: [
        { type: SalesActivityType.NOTE, title: "Deal closed — WON", description: "MSA signed. $450K ARR, 3-year term. Converted to DEVELOPMENT client.", createdAt: daysAgo(95) },
        { type: SalesActivityType.CALL, title: "90-day check-in", description: "Julian very happy with Fleet Engine. Discussing Safety Analytics expansion (+$180K).", createdAt: daysAgo(5) },
      ],
    },
    {
      companyName: "Pangea Insurance Group", contactName: "Sandra Kovacs", email: "s.kovacs@pangeainsurance.com", phone: "+44 20 7946 0199",
      stage: SalesStage.CONTACTED, dealValue: 200000, priority: SalesPriority.MEDIUM, probability: 25, expectedCloseAt: daysFromNow(75),
      leadSource: "Cold outbound — Rachel Green LinkedIn", notes: "London-based insurer, 300-person actuarial team. Currently Notion + spreadsheets. Strong PMS + Notes fit.", tags: ["Enterprise"],
      activities: [
        { type: SalesActivityType.NOTE, title: "Lead created", description: "300-seat potential in actuarial and claims departments.", createdAt: daysAgo(8) },
        { type: SalesActivityType.EMAIL, title: "Personalized cold email", description: "Referenced their Gartner digital transformation report.", createdAt: daysAgo(6) },
        { type: SalesActivityType.EMAIL, title: "Reply received — interested", description: "Sandra replied positively. Scheduling discovery call next week.", createdAt: daysAgo(2) },
      ],
    },
    {
      companyName: "Vertex Analytics", contactName: "Tyler Nguyen", email: "tyler@vertexanalytics.ai", phone: "+1 (628) 555-0122",
      stage: SalesStage.LOST, dealValue: 280000, priority: SalesPriority.MEDIUM, probability: 0, expectedCloseAt: daysAgo(15),
      leadSource: "Inbound — Google Ads", notes: "Lost to Linear + Notion bundle. Price sensitivity main issue. Revisit Q2 2027.", tags: ["Enterprise"],
      activities: [
        { type: SalesActivityType.NOTE, title: "Loss analysis", description: "Chose Linear ($18/seat) over Zsyio ($28/seat). Familiarity with Linear. Revisit in 6 months.", createdAt: daysAgo(15) },
      ],
    },
  ];

  for (const ld of leadsData) {
    const salesClient = await prisma.client.create({
      data: { name: ld.companyName, contactName: ld.contactName, contactEmail: ld.email, contactPhone: ld.phone, notes: ld.notes, clientType: ClientType.SALES },
    });
    const lead = await prisma.salesLead.create({
      data: {
        clientId: salesClient.id, pipelineId: pipeline.id, stageId: stageIdMap.get(ld.stage)!,
        currentStage: ld.stage, dealValue: ld.dealValue, priority: ld.priority, probability: ld.probability,
        leadSource: ld.leadSource, expectedCloseAt: ld.expectedCloseAt,
        lastContactAt: daysAgo(Math.floor(Math.random() * 5) + 1),
        nextFollowUpAt: [SalesStage.LOST, SalesStage.WON].includes(ld.stage) ? null : daysFromNow(Math.floor(Math.random() * 7) + 1),
        assignedToId: rachel.id,
        tags: { create: ld.tags.filter((t) => sTagMap.has(t)).map((t) => ({ tagId: sTagMap.get(t)! })) },
      },
    });
    for (const act of ld.activities) {
      await prisma.salesActivity.create({
        data: {
          leadId: lead.id, type: act.type, title: act.title, description: act.description,
          createdById: rachel.id, assignedToId: rachel.id,
          priority: SalesPriority.MEDIUM, status: "COMPLETED",
          completedAt: act.createdAt, createdAt: act.createdAt,
        },
      });
    }
    await prisma.salesAuditLog.create({ data: { leadId: lead.id, action: SalesAuditAction.CREATED, actorId: rachel.id, nextValue: ld.stage, metadata: { dealValue: ld.dealValue, leadSource: ld.leadSource } } });
  }
  console.log(`✅ 8 sales leads created.`);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log("\n✨ Zsyio v2 Enriched Seed Complete!");
  console.log("════════════════════════════════════════════════════════════");
  console.log("📊 Seeded: 15 users | 6 teams | 7 clients | 14 products | 25 tasks | 6 folders | 12 notes | 8 sales leads | 30-day attendance");
  console.log("════════════════════════════════════════════════════════════");
  console.log("🔑 Login Credentials (password: 'password'):");
  console.log("   admin@zsyio.com             → ADMIN");
  console.log("   alex.vance@zsyio.com         → SUPER_ADMIN");
  console.log("   sarah.chen@zsyio.com         → ADMIN");
  console.log("   marcus.brody@zsyio.com       → MANAGER");
  console.log("   elena.rostova@zsyio.com      → DEVELOPER (Backend)");
  console.log("   david.kim@zsyio.com          → DEVELOPER (Frontend)");
  console.log("   priya.patel@zsyio.com        → DEVELOPER (Platform)");
  console.log("   liam.torres@zsyio.com        → DEVELOPER (Backend)");
  console.log("   aiko.yamamoto@zsyio.com      → DEVELOPER (Full Stack)");
  console.log("   noah.weber@zsyio.com         → DEVELOPER (QA)");
  console.log("   support@zsyio.com            → SUPPORT");
  console.log("   rachel.green@zsyio.com       → SALES_REP");
  console.log("════════════════════════════════════════════════════════════");
}

if (process.argv[1]?.endsWith("seed-zsyio.ts")) {
  seedZsyio()
    .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
}
