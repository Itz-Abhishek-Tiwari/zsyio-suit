# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Primary: Engineering Leads, Product Managers, Software Engineers, and QA Teams orchestrating development sprints, task hierarchies, and technical architecture specifications.
- Secondary: Sales Representatives, Account Executives, HR Operations Officers, and Organization Administrators managing business pipelines and team capacities.
- Context: Modern product organizations seeking a unified workspace to eliminate SaaS fragmentation across projects, knowledge base notes, CRM pipelines, and HR workflows.

## Product Purpose
Zsyio Suite is an integrated enterprise operational workspace consolidating Project Management (Zsyio Flow PMS), Knowledge & Architectural Documentation (Zsyio Canvas Notes), Sales CRM (Zsyio Pulse), HRMS & Attendance (Zsyio People), and Central Governance (Zsyio Core Admin) into a high-performance monorepo platform.

## Positioning
A cohesive, single-pane-of-glass workspace platform engineered on Next.js 15, React 19, and Prisma. Unlike disjointed SaaS stacks (Jira + Notion + Salesforce + BambooHR), Zsyio links engineering tasks directly to architectural RFCs, sales deals, and team availability with unified RBAC, shared design tokens, and synchronized theme modes.

## Operating Context
- Environments: Desktop browsers (primary workbench) and mobile responsive viewports.
- Workflows: Sprint backlog planning, Kanban execution, interactive markdown with live Mermaid architecture diagrams, sales opportunity qualification, leave and regularization requests, and organization audits.
- Design System: Shared design tokens (`@zsyio/ui`), zero raw hex colors enforcement (`check-no-raw-colors.mjs`), synchronized dark/light modes, and modern micro-interactions.

## Capabilities and Constraints
- Turborepo monorepo with 5 dedicated applications (`apps/pms`, `apps/notes`, `apps/sales`, `apps/hrms`, `apps/admin`).
- Shared design system (`packages/ui`) with strict token contracts (`tokens.css`, `primitives.json`).
- Shared rich document editor (`packages/editor`) supporting Tiptap, GFM markdown, callouts, and dynamic Mermaid SVG architecture diagram rendering.
- PostgreSQL database backed by Prisma ORM (`packages/database`).
- Strict zero-drift UI consistency, accessible contrast ratios, and fast page load times.

## Brand Commitments
- Name: Zsyio Suite (Zsyio Flow PMS, Zsyio Canvas Notes, Zsyio Pulse Sales, Zsyio People HRMS, Zsyio Core Admin).
- Aesthetic: High-density professional productivity UI with refined gradient accents, glassmorphic headers/sidebars, crisp typography, and intentional spatial hierarchy.
- Tone: Focused, empowering, clear, and architecturally rigorous.

## Evidence on Hand
- Seeded enterprise demo dataset in `scripts/seed-zsyio.ts` with real technical RFCs (such as RFC-042 event-driven architecture), sprint tasks, and leave policies.
- Bento Grid landing showcase page at `/landing`.
- 290 passing unit tests verifying permissions, timesheets, domain restrictions, and editor utilities.

## Product Principles
1. **Single Source of Truth**: Unified design tokens and centralized data models; never duplicate core UI primitives across apps.
2. **High Information Density with Visual Polish**: Scannable, tactile dashboards engineered for daily power users with zero clutter.
3. **Zero AI Slop**: Strict 4px/8px spacing rhythm, purposeful motion, semantic hierarchy, and deterministic token usage.
4. **Resilient Document & Architecture Craft**: Rich documents and diagrams render interactively with zoom, source toggle, and SVG export capabilities.

## Accessibility & Inclusion
- Full keyboard navigation and accessible focus rings across all interactive elements.
- Accessible color contrast exceeding WCAG 2.1 AA across light and dark themes.
- Semantic HTML5 structure with ARIA attributes and screen-reader safe callouts.
