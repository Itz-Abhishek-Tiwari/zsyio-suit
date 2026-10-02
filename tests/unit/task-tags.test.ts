import { describe, it, expect } from "vitest";
import {
  createTaskTagSchema,
  createTaskSchema,
  updateTaskSchema,
} from "@zsyio/validators";

describe("Task Tags Schema Validation", () => {
  it("validates valid task tag creation payload", () => {
    const valid = createTaskTagSchema.safeParse({
      name: "Frontend Bug",
      color: "rose",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.name).toBe("Frontend Bug");
      expect(valid.data.color).toBe("rose");
    }
  });

  it("trims and accepts tag without explicit color", () => {
    const valid = createTaskTagSchema.safeParse({
      name: "   API Integration   ",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects empty tag name", () => {
    const invalid = createTaskTagSchema.safeParse({
      name: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates createTaskSchema with multiple tags", () => {
    const parsed = createTaskSchema.safeParse({
      productId: "prod-1",
      title: "Fix authentication flow",
      type: "BUG",
      tags: ["Auth", "Security", "High-Priority"],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.tags).toEqual(["Auth", "Security", "High-Priority"]);
    }
  });

  it("validates updateTaskSchema with updated tags", () => {
    const parsed = updateTaskSchema.safeParse({
      tags: ["Sprint-42", "Refactor"],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.tags).toEqual(["Sprint-42", "Refactor"]);
    }
  });
});

describe("Task Tag Filter & Assignment Logic", () => {
  type MockTag = { id: string; name: string; color?: string | null };
  type MockTask = {
    id: string;
    title: string;
    tags: { tagId: string; tag: MockTag }[];
  };

  const sampleTasks: MockTask[] = [
    {
      id: "t1",
      title: "Refactor auth middleware",
      tags: [
        { tagId: "tag-auth", tag: { id: "tag-auth", name: "Auth", color: "purple" } },
        { tagId: "tag-backend", tag: { id: "tag-backend", name: "Backend", color: "blue" } },
      ],
    },
    {
      id: "t2",
      title: "UI design fixes",
      tags: [
        { tagId: "tag-ui", tag: { id: "tag-ui", name: "UI/UX", color: "pink" } },
      ],
    },
    {
      id: "t3",
      title: "General cleanup",
      tags: [],
    },
  ];

  function filterTasksByTag(tasks: MockTask[], tagQuery?: string) {
    if (!tagQuery) return tasks;
    const query = tagQuery.toLowerCase();
    return tasks.filter((t) =>
      t.tags.some(
        (assignment) =>
          assignment.tagId === tagQuery ||
          assignment.tag.name.toLowerCase() === query
      )
    );
  }

  it("filters tasks by tag name case-insensitively", () => {
    const filtered = filterTasksByTag(sampleTasks, "auth");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("t1");
  });

  it("filters tasks by tag id", () => {
    const filtered = filterTasksByTag(sampleTasks, "tag-ui");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("t2");
  });

  it("returns all tasks when filter is undefined", () => {
    const filtered = filterTasksByTag(sampleTasks, undefined);
    expect(filtered).toHaveLength(3);
  });

  it("returns empty array if no tasks match the tag", () => {
    const filtered = filterTasksByTag(sampleTasks, "DevOps");
    expect(filtered).toHaveLength(0);
  });
});
