# Zsyio Recruit

Recruit runs at http://localhost:3006. Start it with `pnpm dev:recruit`.

The first version supports job openings (open, paused, closed), applicants attached to a job, six manual hiring stages, interview dates, written feedback, and stage-change history. Interviews are recorded in Recruit; calendar invites and email delivery are not implemented. There is no automated candidate ranking or decision-making.

Recruit reuses `@zsyio/ui` navigation, page headers, stats, forms, modals, tables, avatars, login, theme and accent providers. Existing apps can reach Recruit through the shared app switcher after rebuilding.

Console permissions:
- `app:access:recruit`: read hiring records.
- `recruit:manage`: create jobs/applicants, change stages, and add interview/feedback records. This requires app access too.

Administrator defaults include these permissions; custom roles must be granted them explicitly. All Recruit API endpoints enforce both authentication and the relevant permissions. Password-change and account-theme routes reuse suite handlers.

Database models live in `packages/database/prisma/schema/recruit.prisma`. The additive migration is `20261011000000_add_recruit`; it was applied and recorded on the configured local database. Use the existing Prisma migration deployment workflow on other environments, then regenerate the client.

Candidate email is normalized to lowercase and unique per job. Closed or paused jobs reject new applications. Hiring-stage changes are recorded with the acting user. Interview timestamps are stored in UTC and displayed in the browser's local time.

Validation: schema/access unit tests, all six app type-checks, an isolated browser workflow, and a real database round-trip with temporary records removed afterward. No real candidate records are seeded.

## Public careers page

The marketing site links to `/landing/careers`. It reads OPEN jobs from the shared Recruit database and accepts name/email applications through `/api/careers/applications`. New applications appear in Recruit's Applied stage with source `Careers website`. Paused/closed jobs are hidden and reject applications; the same email cannot apply twice to the same job. The public endpoint returns no candidate records or internal job metadata. There are no resume uploads or confirmation emails in this version.

Recruit forms and filters use the shared `Select` primitives; job surfaces, action controls, and loading placeholders reuse `Card`, `Button`, and `Skeleton` from `@zsyio/ui`.

The candidate pipeline uses shared `KanbanBoard`, `KanbanColumn`, `KanbanCard`, and `KanbanColumnEmpty`. Recruit also uses `LoginPageLayout`, `StatusBadge`, the `Card` composition primitives, `DatePicker`, and view-specific `CardGridSkeleton`, `TableSkeleton`, and `KanbanBoardSkeleton`. App code supplies hiring data and actions; component styling and interaction live in `@zsyio/ui`. Clickable shared Kanban cards support Enter and Space.
