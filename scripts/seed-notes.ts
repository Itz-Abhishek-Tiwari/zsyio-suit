import { PrismaClient, NoteGeneralAccess } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedNotes() {
  console.log("🌱 Populating rich demo folders and notes...");

  await prisma.noteStar.deleteMany({});
  await prisma.noteShare.deleteMany({});
  await prisma.noteFolderShare.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.noteFolder.deleteMany({});

  // Find admin/manager user to be the creator/author
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const developer = await prisma.user.findFirst({
    where: { role: "DEVELOPER" },
  });

  if (!admin) {
    console.error("No admin user found. Cannot seed notes.");
    return;
  }

  const authorId = admin.id;

  // 1. Engineering Workspace Folder
  const engFolder = await prisma.noteFolder.create({
    data: {
      name: "Engineering & Architecture",
      icon: "cpu",
      color: "blue",
      description: "Technical specifications, API guidelines, and infrastructure RFCs",
      createdById: authorId,
      isWorkspaceRoot: true,
      generalAccess: NoteGeneralAccess.WORKSPACE_VIEW,
    },
  });

  // 1.1 Engineering Subfolder
  const backendFolder = await prisma.noteFolder.create({
    data: {
      name: "Backend & Database",
      icon: "server",
      color: "cyan",
      description: "Database schemas, query optimizations, and connection pooling RFCs",
      parentId: engFolder.id,
      createdById: authorId,
      generalAccess: NoteGeneralAccess.WORKSPACE_VIEW,
    },
  });

  // Note 1: Database Architecture RFC
  const note1 = await prisma.note.create({
    data: {
      title: "PostgreSQL & Supabase Connection Pooling RFC",
      icon: "database",
      coverImage: "linear-gradient(135deg, rgb(14, 165, 233) 0%, rgb(59, 130, 246) 100%)",
      folderId: backendFolder.id,
      authorId: authorId,
      generalAccess: NoteGeneralAccess.INHERIT,
      isPinned: true,
      content: `# RFC: PostgreSQL & Supabase Connection Architecture

**Status:** Approved  
**Author:** @${admin.name || "Engineering Team"}  
**Target:** Production Vercel & Supabase ap-northeast-1  

---

## 1. Executive Summary
This document establishes connection pooling best practices between serverless Vercel Edge/Node functions and our managed Supabase PostgreSQL instance.

---

## 2. Connection Strategy

| Environment | Port | Protocol / Mode | Parameter String |
| :--- | :--- | :--- | :--- |
| **Vercel Serverless (Runtime)** | \`6543\` | Transaction Pooler (Supavisor) | \`?pgbouncer=true&connection_limit=10&pool_timeout=20\` |
| **Prisma Migrations (CI/CD)** | \`5432\` | Session / Direct Mode | \`DIRECT_URL\` |

### Key Guarantees:
- **Zero Connection Leaks:** Global Prisma singleton prevents recreation on hot lambdas.
- **Prepared Statement Isolation:** \`pgbouncer=true\` ensures safe transaction multiplexing.
- **Sub-5ms Query Latency:** Both Vercel (\`hnd1\`) and Supabase (\`ap-northeast-1\`) colocated in Tokyo.

---

## 3. Query Best Practices & Indexing
1. Always use \`Promise.all()\` for independent parallel queries to avoid waterfall delays.
2. Select only needed fields in list views (omit heavy \`content\` columns until full document view).
3. Ensure composite indexes on all frequently filtered foreign keys (\`authorId\`, \`folderId\`, \`isArchived\`).
`,
    },
  });

  // Note 2: API Standards Guide
  await prisma.note.create({
    data: {
      title: "REST & Server Action API Standards",
      icon: "code",
      coverImage: "linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(168, 85, 247) 100%)",
      folderId: engFolder.id,
      authorId: authorId,
      generalAccess: NoteGeneralAccess.INHERIT,
      content: `# Zsyio Flow — API Standards & Response Conventions

**Version:** 2.0  
**Scope:** All \`/api/*\` route handlers and Server Actions  

---

## 1. Unified JSON Envelope Format

All API responses must follow the standard response envelope:

\`\`\`json
{
  "success": true,
  "data": {
    "id": "cm123456789",
    "status": "COMPLETED"
  },
  "timestamp": "2026-08-24T18:00:00.000Z"
}
\`\`\`

---

## 2. Standard Error Handling

When an error occurs, return standard error structures with appropriate HTTP codes:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to modify this document."
  }
}
\`\`\`

---

## 3. Checklist for New Endpoints
- [ ] Role and custom permission asserted with \`assertCan(user.role, action)\`
- [ ] Payload validated via Zod schemas
- [ ] Audit activity recorded in \`ActivityLog\` table
`,
    },
  });

  // 2. Product & Design Workspace Folder
  const prodFolder = await prisma.noteFolder.create({
    data: {
      name: "Product & Roadmaps",
      icon: "layers",
      color: "emerald",
      description: "Product roadmaps, feature specifications, and release requirements",
      createdById: authorId,
      isWorkspaceRoot: true,
      generalAccess: NoteGeneralAccess.WORKSPACE_VIEW,
    },
  });

  // Note 3: Product Roadmap
  const note3 = await prisma.note.create({
    data: {
      title: "Zsyio Flow — 2026 Product Roadmap & Milestones",
      icon: "compass",
      coverImage: "linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(5, 150, 105) 100%)",
      folderId: prodFolder.id,
      authorId: authorId,
      generalAccess: NoteGeneralAccess.INHERIT,
      isPinned: true,
      content: `# 🚀 Zsyio Flow — 2026 Roadmap

**Quarterly Focus:** Scalability, Team Knowledge Base & Real-time Collaboration  

---

## 📅 Roadmap Milestones

### Q1 — Foundations & Core Workflow
- [x] Multi-brand architecture & tenant separation
- [x] Role-Based Access Control (RBAC) & Custom Role Builder
- [x] Task lifecycle management with subtasks and watchers

### Q2 — Knowledge Base & Collaboration
- [x] Notion-style workspace & nested document hierarchy
- [x] Granular role and person-based document sharing
- [x] AI-powered task summarization and automated test generation

### Q3 — Integrations & Mobile Companion
- [ ] Real-time multi-cursor collaboration via WebSockets
- [ ] Native iOS and Android notifications
- [ ] Granular SLA tracking and automated client escalation triggers

---

## 🎯 Key Performance Indicators (KPIs)
* **Average Page Load Time:** < 400ms across dashboard routes
* **Task Completion Velocity:** +25% sprint cycle efficiency
* **Document Adoption:** 90%+ active weekly usage by team members
`,
    },
  });

  // Note 4: PRD
  await prisma.note.create({
    data: {
      title: "PRD: Granular Workspace Sharing & Document Permissions",
      icon: "file-text",
      coverImage: "linear-gradient(135deg, rgb(236, 72, 153) 0%, rgb(244, 63, 94) 100%)",
      folderId: prodFolder.id,
      authorId: authorId,
      generalAccess: NoteGeneralAccess.INHERIT,
      content: `# Product Requirements Document (PRD): Granular Sharing

| Status | Owner | Priority | Target Release |
| :--- | :--- | :--- | :--- |
| **Shipped** | Product Management | High | v2.2.0 |

---

## 1. Problem Statement
Teams need a unified place to share design specifications, technical documentation, and sprint notes without leaking confidential company data across unrelated departments.

---

## 2. Core Functional Requirements
1. **Inherited Permissions:** Subfolders and nested notes inherit parent folder access by default.
2. **Override Capability:** Individual notes can be set to \`PRIVATE\` or explicitly shared with specific users or teams.
3. **Starring & Bookmarking:** Fast sidebar access for frequently consulted documents.
`,
    },
  });

  // 3. Security & Operations Folder
  const opsFolder = await prisma.noteFolder.create({
    data: {
      name: "Security & Operations",
      icon: "shield",
      color: "purple",
      description: "Incident response runbooks, deployment guides, and security protocols",
      createdById: authorId,
      isWorkspaceRoot: true,
      generalAccess: NoteGeneralAccess.WORKSPACE_VIEW,
    },
  });

  // Note 5: Deployment Runbook
  await prisma.note.create({
    data: {
      title: "Production Deployment & Zero-Downtime Runbook",
      icon: "shield-check",
      coverImage: "linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(217, 119, 6) 100%)",
      folderId: opsFolder.id,
      authorId: authorId,
      generalAccess: NoteGeneralAccess.INHERIT,
      content: `# Production Deployment & Zero-Downtime Runbook

**Trigger:** Merging to \`main\` branch  
**Hosting:** Vercel Pro  
**Database:** Supabase Managed PostgreSQL  

---

## Pre-Flight Checklist
1. [ ] Run \`npx prisma validate\` to check schema integrity
2. [ ] Execute \`npx tsc --noEmit\` for complete type safety
3. [ ] Verify environment variables are present on Vercel Dashboard

## Rollback Procedure
If unexpected errors occur post-deploy:
1. Navigate to Vercel Deployments tab
2. Locate the previous healthy deployment hash
3. Click **Instant Rollback** (< 1 second traffic shift)
`,
    },
  });

  // 4. Standalone Personal / Standup Note
  const standupNote = await prisma.note.create({
    data: {
      title: "Weekly Sprint Standup & Action Items",
      icon: "calendar",
      coverImage: "linear-gradient(135deg, rgb(139, 92, 246) 0%, rgb(217, 70, 239) 100%)",
      authorId: authorId,
      generalAccess: NoteGeneralAccess.WORKSPACE_VIEW,
      isPinned: true,
      content: `# Weekly Sprint Standup & Action Items

**Date:** ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}  
**Lead:** @${admin.name || "Admin"}  

---

## 🎯 Current Sprint Goals
- [x] Complete database connection pool tuning
- [x] Populate comprehensive knowledge base notes & architecture specs
- [ ] Perform end-to-end regression testing on task assignment notifications

---

## 📝 Blockers & Discussion
* **Resolved:** Configured Supabase pooler on port 6543 with \`connection_limit=10\` and \`pool_timeout=20\`.
* **Action:** Team to review newly added technical specs in the Engineering folder.
`,
    },
  });

  // Star the pinned notes for the admin
  await prisma.noteStar.createMany({
    data: [
      { userId: authorId, noteId: note1.id },
      { userId: authorId, noteId: note3.id },
      { userId: authorId, noteId: standupNote.id },
    ],
    skipDuplicates: true,
  });

  // If developer exists, also star for developer
  if (developer) {
    await prisma.noteStar.create({
      data: { userId: developer.id, noteId: note1.id },
    });
  }

  console.log("✅ Successfully seeded 3 workspace folders, 1 subfolder, and 6 rich notes with stars!");
}

async function main() {
  try {
    await seedNotes();
  } catch (err) {
    console.error("Error seeding notes:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
