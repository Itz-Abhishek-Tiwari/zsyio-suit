import { BadRequestError } from "@zsyio/auth/permissions";

// Shared ownership shape for anything assignable like a Task: direct
// creator/assignee, the multi-assignee roster, a single assigned team, or
// membership across any of the (possibly several) teams attached to the
// entity. Used by both task.service.ts and test-case.service.ts so the two
// don't drift on what "owns this task" means.
export interface OwnableEntity {
  createdById?: string | null;
  assignedToId?: string | null;
  reviewerId?: string | null;
  reviewers?: { userId: string }[] | null;
  assignees?: { userId: string }[] | null;
  assignedTeam?: { members: { userId: string }[] } | null;
  teams?: { team: { members: { userId: string }[] } }[] | null;
}

export function isOwner(userId: string | null | undefined, entity: OwnableEntity): boolean {
  if (!userId) return false;
  return (
    entity.createdById === userId ||
    entity.assignedToId === userId ||
    entity.reviewerId === userId ||
    (entity.reviewers?.some((r) => r.userId === userId) ?? false) ||
    (entity.assignees?.some((a) => a.userId === userId) ?? false) ||
    (entity.assignedTeam?.members.some((m) => m.userId === userId) ?? false) ||
    (entity.teams?.some((t) => t.team.members.some((m) => m.userId === userId)) ?? false)
  );
}

// The session userId from NextAuth is already validated by requireUser() -
// this should basically always be present. Previously call sites that found
// it missing silently attributed the resulting activity-log entry to an
// arbitrary, unordered user (`prisma.user.findFirst()`). That's worse than
// failing loudly: reject instead so the bug surfaces immediately rather than
// mis-attributing actions to a random account.
export function assertActingUserId(userId: string | null | undefined): string {
  if (!userId) {
    throw new BadRequestError("Unable to resolve acting user.");
  }
  return userId;
}
