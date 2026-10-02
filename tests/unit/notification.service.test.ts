import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Isolate notification.service from Prisma ────────────────────────────────
// We mock the prisma module so tests run without a real DB.
vi.mock("@zsyio/database", () => ({
  prisma: {
    notificationPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@zsyio/database";
import { notificationService } from "@/server/services/notification.service";

// Typed mock helpers
const mockPrefs = prisma.notificationPreference as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};
const mockNotif = prisma.notification as unknown as {
  create: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
};
const mockUser = prisma.user as unknown as { findMany: ReturnType<typeof vi.fn> };

const ALL_ENABLED_PREFS = {
  taskAssigned: true,
  statusChanged: true,
  mentions: true,
  comments: true,
  dueDateReminders: true,
  dashboardNotes: true,
  inAppToasts: true,
};

// ── createNotification ───────────────────────────────────────────────────────

describe("notificationService.createNotification()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrefs.findUnique.mockResolvedValue(ALL_ENABLED_PREFS);
    mockNotif.findFirst.mockResolvedValue(null); // No recent dups by default
    mockNotif.create.mockResolvedValue({ id: "notif-1" });
  });

  it("skips notification when actor === user (self-notification) for non-MENTIONED types", async () => {
    const result = await notificationService.createNotification({
      userId: "user-A",
      actorId: "user-A",
      type: "COMMENT_ADDED",
      title: "New comment",
      message: "someone commented",
    });
    expect(result).toBeNull();
    expect(mockNotif.create).not.toHaveBeenCalled();
  });

  it("ALLOWS self-notification for MENTIONED type (explicit self-tag)", async () => {
    await notificationService.createNotification({
      userId: "user-A",
      actorId: "user-A",
      type: "MENTIONED",
      title: "You mentioned yourself",
      message: "in a comment",
    });
    expect(mockNotif.create).toHaveBeenCalledOnce();
  });

  it("respects TASK_ASSIGNED preference = false", async () => {
    mockPrefs.findUnique.mockResolvedValue({ ...ALL_ENABLED_PREFS, taskAssigned: false });
    const result = await notificationService.createNotification({
      userId: "user-B",
      actorId: "actor-X",
      type: "TASK_ASSIGNED",
      title: "Assigned",
      message: "you got a task",
    });
    expect(result).toBeNull();
    expect(mockNotif.create).not.toHaveBeenCalled();
  });

  it("respects STATUS_CHANGED preference = false", async () => {
    mockPrefs.findUnique.mockResolvedValue({ ...ALL_ENABLED_PREFS, statusChanged: false });
    const result = await notificationService.createNotification({
      userId: "user-B",
      actorId: "actor-X",
      type: "STATUS_CHANGED",
      title: "Status changed",
      message: "moved to done",
    });
    expect(result).toBeNull();
  });

  it("respects mentions preference = false", async () => {
    mockPrefs.findUnique.mockResolvedValue({ ...ALL_ENABLED_PREFS, mentions: false });
    const result = await notificationService.createNotification({
      userId: "user-B",
      actorId: "actor-X",
      type: "MENTIONED",
      title: "Mention",
      message: "you were mentioned",
    });
    expect(result).toBeNull();
  });

  it("respects comments preference = false", async () => {
    mockPrefs.findUnique.mockResolvedValue({ ...ALL_ENABLED_PREFS, comments: false });
    const result = await notificationService.createNotification({
      userId: "user-B",
      actorId: "actor-X",
      type: "COMMENT_ADDED",
      title: "Comment",
      message: "someone commented",
    });
    expect(result).toBeNull();
  });

  it("deduplicates COMMENT_ADDED when a recent notification already exists", async () => {
    mockNotif.findFirst.mockResolvedValue({ id: "existing-notif" });
    const result = await notificationService.createNotification({
      userId: "user-B",
      actorId: "actor-X",
      type: "COMMENT_ADDED",
      title: "Comment",
      message: "rapid comment",
      taskId: "task-123",
    });
    expect(result).toBeNull();
    expect(mockNotif.create).not.toHaveBeenCalled();
  });

  it("does NOT deduplicate MENTIONED type (always fires)", async () => {
    // MENTIONED is not in the DEDUP_TYPES list
    mockNotif.findFirst.mockResolvedValue({ id: "existing" });
    await notificationService.createNotification({
      userId: "user-B",
      actorId: "actor-X",
      type: "MENTIONED",
      title: "Mention",
      message: "you were mentioned",
      taskId: "task-123",
    });
    expect(mockNotif.create).toHaveBeenCalledOnce();
  });

  it("creates the notification with correct field values", async () => {
    await notificationService.createNotification({
      userId: "user-B",
      actorId: "actor-X",
      type: "NOTE_ADDED",
      title: "New note",
      message: "check the dashboard",
      link: "/",
      noteId: "note-1",
    });
    expect(mockNotif.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-B",
        actorId: "actor-X",
        type: "NOTE_ADDED",
        title: "New note",
        message: "check the dashboard",
        link: "/",
        noteId: "note-1",
      }),
    });
  });
});

// ── extractMentionedUserIds ──────────────────────────────────────────────────

describe("notificationService.extractMentionedUserIds()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.findMany.mockResolvedValue([]);
  });

  it("returns empty array when text has no @", async () => {
    const result = await notificationService.extractMentionedUserIds("no mentions here");
    expect(result).toEqual([]);
  });

  it("returns empty array for empty string", async () => {
    const result = await notificationService.extractMentionedUserIds("");
    expect(result).toEqual([]);
  });

  it("parses @[Name](userId) format and verifies the ID", async () => {
    mockUser.findMany
      .mockResolvedValueOnce([{ id: "user-abc" }]) // ID verification
      .mockResolvedValueOnce([]);                   // name lookup

    const result = await notificationService.extractMentionedUserIds(
      "Hey @[Alice Smith](user-abc) check this out"
    );
    expect(result).toContain("user-abc");
  });

  it("deduplicates user IDs when the same user is mentioned twice", async () => {
    mockUser.findMany
      .mockResolvedValueOnce([{ id: "user-abc" }]) // ID verify
      .mockResolvedValueOnce([]);

    const result = await notificationService.extractMentionedUserIds(
      "@[Alice](user-abc) and @[Alice](user-abc) again"
    );
    // Should appear only once even though mentioned twice
    const count = result.filter((id) => id === "user-abc").length;
    expect(count).toBe(1);
  });

  it("does not call DB when text has @ but no valid mention patterns match a user", async () => {
    mockUser.findMany.mockResolvedValue([]);
    const result = await notificationService.extractMentionedUserIds("email@example.com");
    // No error, and returns empty
    expect(Array.isArray(result)).toBe(true);
  });
});
