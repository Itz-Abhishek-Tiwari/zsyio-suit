export interface NoteTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  coverImage?: string;
  category: "Engineering" | "Product" | "Operations" | "Clinical" | "Design";
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "clinical-protocol",
    title: "Clinical Operating Procedure & Protocol",
    description: "Standardized medical procedures, safety checks, contraindications, and compliance.",
    icon: "activity",
    coverImage: "linear-gradient(135deg, rgb(13, 148, 136) 0%, rgb(14, 165, 233) 50%, rgb(99, 102, 241) 100%)",
    category: "Clinical",
    content: `# Standard Clinical Operating Protocol (SOP)

> [!IMPORTANT]
> Ensure all patient identifiers conform to HIPAA / GDPR anonymization policies before logging clinical records.

| Protocol Code | Department | Effective Date | Review Cycle |
| :--- | :--- | :--- | :--- |
| **MED-SOP-401** | General Practice & Triage | Current Quarter | Annual |

---

## 1. Clinical Purpose & Scope
Define the medical necessity, patient cohort eligibility, and clinical objectives for this procedure.

---

## 2. Pre-Procedure Safety Checklist
- [ ] Verify patient identity with two independent identifiers
- [ ] Confirm absence of known allergy or acute contraindications
- [ ] Check baseline vitals (BP, SpO2, Heart Rate, Core Temp)
- [ ] Prepare sterile instruments and calibrate diagnostic hardware

---

## 3. Step-by-Step Procedure
1. **Patient Preparation:** Position patient ergonomically and explain steps clearly.
2. **Initial Assessment:** Conduct targeted physical examination.
3. **Intervention:** Execute clinical procedure according to medical governance guidelines.
4. **Post-Procedure Monitoring:** Observe patient for minimum 15 minutes post-intervention.

---

## 4. Emergency Escalation & Contraindications
> [!WARNING]
> In event of acute anaphylaxis, severe hypotension, or respiratory distress, initiate rapid response protocol immediately.

---

## 5. Post-Care & Documentation
- [ ] Record dosage, batch numbers, and timestamps in EHR
- [ ] Provide printed patient aftercare guidance sheet
- [ ] Schedule follow-up consultation in 7-14 days
`,
  },
  {
    id: "prd",
    title: "Product Requirements Document (PRD)",
    description: "Define product scope, problem statement, user stories, and acceptance criteria.",
    icon: "layers",
    coverImage: "linear-gradient(135deg, rgb(14, 165, 233) 0%, rgb(59, 130, 246) 100%)",
    category: "Product",
    content: `# Product Requirements Document (PRD)

| Status | Target Release | Owner | Priority |
| :--- | :--- | :--- | :--- |
| **Draft** | v2.4.0 | Product Team | High |

---

## 1. Problem Statement & Motivation
Describe what user pain point or business opportunity this feature addresses. Why build this now?

---

## 2. Target Persona & User Stories
- **As a** Healthcare Administrator / Clinician
- **I want to** organize departmental notes into dedicated workspaces with role-based access
- **So that** sensitive medical documentation remains secure while accessible to authorised teams.

---

## 3. Scope & Non-Goals
### In Scope
- Granular role-based and person-based permission controls
- Notion-style collapsible folders and document hierarchy
- Real-time auto-saving and rich formatting

### Non-Goals
- Real-time multi-cursor operational transform (Phase 2)

---

## 4. Acceptance Criteria
- [ ] User can create nested subfolders up to arbitrary depth
- [ ] Permission check blocks unauthorized read or edit attempts
- [ ] Instant link copy works with one-click feedback
`,
  },
  {
    id: "tech-spec",
    title: "Technical Architecture Spec (RFC)",
    description: "Document system architecture, data models, API endpoints, and tradeoffs.",
    icon: "cpu",
    coverImage: "linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(5, 150, 105) 100%)",
    category: "Engineering",
    content: `# RFC: Technical Architecture Specification

**Author:** Engineering Team  
**Status:** In Review  
**Target Implementation:** Sprint 42  

---

## 1. Overview
Brief summary of the engineering changes, component design, and performance goals.

---

## 2. Proposed Architecture & System Topology
\`\`\`mermaid
graph LR
  Client[Web Client] --> Gateway[API Gateway / Ingress]
  Gateway --> Auth[NextAuth Service]
  Gateway --> Core[Core Engine API]
  Core --> Cache[(Redis Cache)]
  Core --> DB[(PostgreSQL Cluster)]
\`\`\`

### Data Models
\`\`\`typescript
interface WorkspaceConfig {
  id: string;
  name: string;
  permissions: {
    userId?: string;
    role?: string;
    accessLevel: "VIEW" | "EDIT" | "FULL";
  }[];
}
\`\`\`

---

## 3. Security & Access Control
- All endpoints must authenticate via NextAuth session.
- Database queries use multi-tenant filtering or explicit permission join checks.
- Audit logs capture every privilege escalation or share update.

---

## 4. Risks & Mitigations
- **Database Query Latency:** Mitigate with composite index on \`[authorId, isArchived, createdAt]\`.
`,
  },
  {
    id: "adr",
    title: "Architecture Decision Record (ADR)",
    description: "Record important architectural decisions, context, and consequences.",
    icon: "file-code",
    coverImage: "linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 100%)",
    category: "Engineering",
    content: `# ADR: Architectural Decision Record

**Status:** Accepted  
**Deciders:** Lead Architect, Core Engineering  
**Date:** ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}  

---

## Context & Problem Statement
Explain the context, technical challenges, and forces influencing the architectural decision.

---

## Decision Outcome
Chosen option: **Shared Monorepo UI & Editor Package Architecture**

\`\`\`mermaid
graph TD
  Apps[5 Next.js Apps: PMS, Notes, Sales, HRMS, Admin] --> SharedUI[@zsyio/ui Design System]
  Apps --> SharedEditor[@zsyio/editor Canvas & Mermaid]
  Apps --> CoreDB[@zsyio/database Prisma ORM]
  CoreDB --> Postgres[(PostgreSQL Database)]
\`\`\`

### Positive Consequences
- Unified design system across all Zsyio applications
- Zero code duplication between PMS and Notes workspaces
- Consistent keyboard shortcuts, theme tokens, and typography

### Negative Consequences / Tradeoffs
- Cross-package builds require workspace dependency coordination
`,
  },
  {
    id: "meeting-notes",
    title: "Meeting Notes & Action Items",
    description: "Structure meetings with goals, attendees, notes, and checklist items.",
    icon: "calendar",
    coverImage: "linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(168, 85, 247) 100%)",
    category: "Operations",
    content: `# Meeting Notes

**Date:** ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}  
**Facilitator:** @Me  
**Participants:** Team Members  

---

## Objectives & Agenda
1. Review sprint deliverables and clinical system deployment milestones
2. Unblock pending cross-team dependencies
3. Align on next quarterly OKRs

---

## Discussion & Key Insights
- **Architecture updates:** Discussed scaling strategy and Redis cache invalidation.
- **Client feedback:** Positive reception on new dashboard analytics widgets.
- **Timeline:** Scheduled feature freeze for Friday.

---

## Action Items & Next Steps
- [ ] Finalize API payload specifications
- [ ] Share pull request for peer review
- [ ] Schedule follow-up sync with stakeholders
`,
  },
  {
    id: "sprint-retro",
    title: "Sprint Retrospective",
    description: "Capture what went well, what could be improved, and actionable commitments.",
    icon: "sparkles",
    coverImage: "linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(239, 68, 68) 100%)",
    category: "Engineering",
    content: `# Sprint Retrospective

**Sprint:** Sprint #38  
**Date:** ${new Date().toLocaleDateString()}  

---

## What Went Well
- Delivered ticket management performance boost ahead of schedule.
- Zero production critical bugs reported during rollout.
- Great cross-functional collaboration between QA and Dev.

---

## What Could Be Improved
- Test coverage for edge-case permission rules needs expansion.
- PR reviews took longer due to oversized diff sizes.

---

## Action Commitments
- [ ] Keep PR diffs under 400 lines where possible
- [ ] Add automated lint pre-commit checks
`,
  },
  {
    id: "weekly-1on1",
    title: "Weekly 1-on-1 Sync",
    description: "Collaborative manager/engineer sync notes, feedback, and career goals.",
    icon: "users",
    coverImage: "linear-gradient(135deg, rgb(139, 92, 246) 0%, rgb(236, 72, 153) 100%)",
    category: "Operations",
    content: `# 1-on-1 Sync

**Participants:** Manager & Colleague  
**Date:** ${new Date().toLocaleDateString()}  

---

## Check-in & Pulse
- Workload & energy level (1-10):
- Highlights from past week:

---

## Progress on Goals
- Key milestones achieved:
- Challenges or roadblocks:

---

## Notes & Feedback
- Notes from this session:

---

## Next Commitments
- [ ] Action item 1
- [ ] Action item 2
`,
  },
  {
    id: "runbook",
    title: "Engineering Runbook & Operations",
    description: "Step-by-step operational guide for deployments, rollbacks, and database maintenance.",
    icon: "shield",
    coverImage: "linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 50%, rgb(51, 65, 85) 100%)",
    category: "Engineering",
    content: `# Operations Runbook: Service Deployment & Recovery

> [!CAUTION]
> Production schema migrations must have an active snapshot backup before executing.

---

## 1. Routine Deployment Procedure
1. Verify CI test suite and linter pass on \`main\`.
2. Run database migration staging check:
   \`\`\`bash
   pnpm --filter @zsyio/database prisma migrate deploy
   \`\`\`
3. Deploy frontend & API edge bundle.

---

## 2. Emergency Rollback Strategy
If error rate exceeds >0.5% over 3 minutes:
1. Trigger Vercel instant deployment rollback to last healthy build ID.
2. If database schema was altered, run rollback migration script:
   \`\`\`bash
   pnpm run db:rollback
   \`\`\`
`,
  },
];
