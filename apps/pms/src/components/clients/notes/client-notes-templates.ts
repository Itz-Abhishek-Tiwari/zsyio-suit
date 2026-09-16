export interface ClientDocTemplate {
  id: string;
  label: string;
  description: string;
  content: string;
}

export const CLIENT_DOC_TEMPLATES: ClientDocTemplate[] = [
  {
    id: "onboarding-specs",
    label: "Onboarding & Specs",
    description: "Standard client requirements, infrastructure, and SLA details",
    content: `## Client Overview & Requirements

### 1. Key Stakeholders & Contacts
- **Primary Technical Lead:** 
- **Escalation Contact:** 
- **Account Manager:** 

### 2. Infrastructure & Environment
- **Production Base URL:** 
- **Staging / QA URL:** 
- **Deployment Cadence:** 

### 3. Service Level Agreements (SLAs)
- **Critical / Blocker Issues:** < 2 hours response
- **High Priority Issues:** < 8 hours response
- **Standard Maintenance:** Weekly deployment window (Tuesdays 22:00 UTC)

---
*Created via Zsyio Client Knowledge Hub.*`,
  },
  {
    id: "architecture-tech-stack",
    label: "Architecture & Tech Stack",
    description: "Technical specifications, repositories, and third-party integrations",
    content: `## Architecture & Tech Specifications

### 1. Tech Stack Overview
- **Frontend:** 
- **Backend / API:** 
- **Database & Storage:** 
- **Authentication & Security:** 

### 2. Repositories & CI/CD Pipelines
- **Main App Repository:** 
- **API Services:** 
- **CI/CD Platform:** GitHub Actions / GitLab CI

### 3. Key Integrations & Third Parties
- **Payment Gateway:** 
- **Notification Services:** 
- **Analytics & Tracking:** 

---
*Documented in Zsyio Flow Client Hub.*`,
  },
  {
    id: "incident-post-mortem",
    label: "Incident Post-Mortem",
    description: "Root cause analysis, resolution timeline, and preventative action logs",
    content: `## Incident Post-Mortem Log

**Date / Time of Incident:** 
**Impacted Products / Subsystems:** 
**Severity Level:** Critical / Major / Minor

### Timeline of Events
- **HH:MM** - Incident detected / Reported by monitoring
- **HH:MM** - Root cause identified
- **HH:MM** - Hotfix deployed / Mitigation in place
- **HH:MM** - Incident resolved and verified

### Root Cause Analysis (5 Whys)
1. Why did the failure occur? 
2. Why was it not caught in staging? 

### Preventative Action Items
- [ ] Add regression automated test case
- [ ] Update monitoring thresholds
- [ ] Review documentation with team

---
*Documented in Zsyio Flow Client Hub.*`,
  },
  {
    id: "meeting-status-notes",
    label: "Meeting & Status Notes",
    description: "Sync meeting agenda, discussion highlights, and assigned action items",
    content: `## Sync & Status Meeting Notes

**Date:** 
**Attendees:** 

### Discussion Highlights
- Key discussion item 1...
- Key discussion item 2...

### Action Items & Next Steps
- [ ] Action item 1 (Owner: @name)
- [ ] Action item 2 (Owner: @name)
- [ ] Follow-up scheduled for...

---
*Zsyio Collaborative Notes.*`,
  },
  {
    id: "design-feedback-summary",
    label: "Design Feedback Summary",
    description: "Central place for design feedback and design related decisions",
    content: `# Design Feedback Summary

**Date:** 
**Attendees:** 

## Design Review Meeting

### 1. UI/UX Feedback
- **General Impressions:**

- **Specific Page Feedback:**
  - **Dashboard:** 
  - **Settings:**
  - **User Profile:**
  - **Other:**

- **Design System Improvements:**
  - **Color Palette:**
  - **Typography:**
  - **Components:**

### 2. Key Design Decisions
- **Major Changes:**
  - **Why this change?** 
  - **Impact:** 
  - **Status:** (Approved / Pending / Deferred)

- **Design Patterns:**
  - **Chosen Pattern:** (e.g., Modal vs. Slide-out, Tabs vs. Accordion)
  - **Rationale:**

### 3. Action Items
- [ ] **Task:** 
  - **Owner:** @name
  - **Deadline:** 
  - **Notes:** 

- [ ] **Task:** 
  - **Owner:** @name
  - **Deadline:** 
  - **Notes:** 

### 4. Follow-up
- **Next Review Date:** 
- **Topics to Cover:**

---
*Zsyio Flow - Design Feedback Log*`,
  },
];
