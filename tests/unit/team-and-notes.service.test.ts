import { describe, it, expect, vi, beforeEach } from "vitest";
import { teamService } from "@/server/services/team.service";
import { teamRepository } from "@/server/repositories/team.repository";
import { dashboardNoteService } from "@/server/services/dashboard-note.service";
import { dashboardNoteRepository } from "@/server/repositories/dashboard-note.repository";
import { ForbiddenError } from "@zsyio/auth/permissions";

vi.mock("@/server/repositories/team.repository", () => ({
  teamRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  teamsRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/server/repositories/dashboard-note.repository", () => ({
  dashboardNoteRepository: {
    listForUser: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  dashboardNotesRepository: {
    listForUser: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/server/services/notification.service", () => ({
  notificationService: {
    notifyNoteCreated: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("teamService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin/user:manage to create teams", async () => {
    const adminUser = { id: "u-1", role: "ADMIN" };
    vi.mocked(teamRepository.create).mockResolvedValueOnce({
      id: "team-1",
      name: "Frontend",
      description: null,
      color: "purple",
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
      _count: { assignedTasks: 0 },
    });

    const result = await teamService.create(adminUser, {
      name: "Frontend",
      color: "purple",
      memberUserIds: [],
    });

    expect(result.id).toBe("team-1");
    expect(teamRepository.create).toHaveBeenCalledWith({
      name: "Frontend",
      color: "purple",
      memberUserIds: [],
    });
  });

  it("prevents non-privileged users from creating teams", async () => {
    const devUser = { id: "u-2", role: "DEVELOPER" };
    await expect(
      teamService.create(devUser, {
        name: "Hacking Team",
        color: "purple",
        memberUserIds: [],
      })
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("dashboardNoteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows creating a personal note for any user", async () => {
    const devUser = { id: "u-2", role: "DEVELOPER", name: "Dev User" };
    vi.mocked(dashboardNoteRepository.create).mockResolvedValueOnce({
      id: "note-1",
      authorId: "u-2",
      content: "Personal memo",
      isPersonal: true,
      targetAll: false,
      clientId: null,
      taskId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await dashboardNoteService.create(devUser, {
      content: "Personal memo",
      isPersonal: true,
      targetAll: false,
      targetTeamIds: [],
      targetUserIds: [],
    });

    expect(result.id).toBe("note-1");
  });

  it("prevents developer from publishing global workspace announcement", async () => {
    const devUser = { id: "u-2", role: "DEVELOPER", name: "Dev User" };

    await expect(
      dashboardNoteService.create(devUser, {
        content: "Global announcement",
        isPersonal: false,
        targetAll: true,
        targetTeamIds: [],
        targetUserIds: [],
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("allows author to delete their own note", async () => {
    const devUser = { id: "u-2", role: "DEVELOPER" };
    vi.mocked(dashboardNoteRepository.findById).mockResolvedValueOnce({
      id: "note-1",
      authorId: "u-2",
    } as never);
    vi.mocked(dashboardNoteRepository.delete).mockResolvedValueOnce({ id: "note-1" } as never);

    await expect(dashboardNoteService.delete(devUser, "note-1")).resolves.toBeDefined();
    expect(dashboardNoteRepository.delete).toHaveBeenCalledWith("note-1");
  });

  it("prevents other users from deleting notes they do not own", async () => {
    const otherUser = { id: "u-3", role: "DEVELOPER" };
    vi.mocked(dashboardNoteRepository.findById).mockResolvedValueOnce({
      id: "note-1",
      authorId: "u-2",
    } as never);

    await expect(dashboardNoteService.delete(otherUser, "note-1")).rejects.toThrow(ForbiddenError);
  });
});
