import { prisma } from "@zsyio/database";

export const DEFAULT_TASK_COLUMNS = [
  { statusKey: "BACKLOG", label: "Backlog", icon: "BACKLOG", color: "slate", order: 0 },
  { statusKey: "TODO", label: "To Do", icon: "TODO", color: "blue", order: 1 },
  { statusKey: "IN_PROGRESS", label: "In Progress", icon: "IN_PROGRESS", color: "amber", order: 2 },
  { statusKey: "IN_REVIEW", label: "In Review", icon: "IN_REVIEW", color: "orange", order: 3 },
  { statusKey: "QA", label: "QA", icon: "QA", color: "purple", order: 4 },
  { statusKey: "BLOCKED", label: "Blocked", icon: "BLOCKED", color: "red", order: 5 },
  { statusKey: "DONE", label: "Done", icon: "DONE", color: "emerald", order: 6 },
] as const;

export const STANDARD_STATUS_KEYS = new Set<string>(
  DEFAULT_TASK_COLUMNS.map((c) => c.statusKey)
);

export const taskColumnsRepository = {
  async list() {
    let dbColumns: Array<{
      id: string;
      statusKey: string;
      label: string;
      icon: string | null;
      color: string | null;
      order: number;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    try {
      dbColumns = await prisma.customKanbanColumn.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
    } catch {
      // Table may not exist yet or connection error; fallback cleanly to defaults
      const now = new Date();
      return DEFAULT_TASK_COLUMNS.map((def) => ({
        id: `standard-${def.statusKey.toLowerCase()}`,
        statusKey: def.statusKey,
        label: def.label,
        icon: def.icon,
        color: def.color,
        order: def.order,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
      }));
    }

    const dbMap = new Map(dbColumns.map((c) => [c.statusKey, c]));

    // Start with all DB columns
    const result: Array<{
      id: string;
      statusKey: string;
      label: string;
      icon: string | null;
      color: string | null;
      order: number;
      isCustom: boolean;
      createdAt: Date;
      updatedAt: Date;
    }> = dbColumns.map((c) => ({
      ...c,
      isCustom: !STANDARD_STATUS_KEYS.has(c.statusKey),
    }));

    // Include any standard columns that are not yet persisted in DB
    const maxDbOrder = dbColumns.reduce((max, c) => Math.max(max, c.order), -1);
    let appendOrder = maxDbOrder + 1;
    const now = new Date();
    for (const def of DEFAULT_TASK_COLUMNS) {
      if (!dbMap.has(def.statusKey)) {
        result.push({
          id: `standard-${def.statusKey.toLowerCase()}`,
          statusKey: def.statusKey,
          label: def.label,
          icon: def.icon,
          color: def.color,
          order: dbColumns.length > 0 ? appendOrder++ : def.order,
          isCustom: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Sort by order ascending
    result.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return result;
  },

  async create(data: { statusKey: string; label: string; icon?: string; color?: string; order?: number }) {
    const key = data.statusKey.toUpperCase().trim();
    return prisma.customKanbanColumn.upsert({
      where: { statusKey: key },
      update: {
        label: data.label.trim(),
        icon: data.icon || "flask",
        color: data.color || "purple",
        ...(typeof data.order === "number" ? { order: data.order } : {}),
      },
      create: {
        statusKey: key,
        label: data.label.trim(),
        icon: data.icon || "flask",
        color: data.color || "purple",
        order: data.order ?? 0,
      },
    });
  },

  async reorder(statusKeys: string[]) {
    if (!statusKeys || statusKeys.length === 0) {
      return this.list();
    }

    const uniqueKeys = Array.from(new Set(statusKeys.map((k) => k.toUpperCase().trim())));

    // Perform upsert for every column in the new order
    await prisma.$transaction(
      uniqueKeys.map((key, index) => {
        const defaultDef = DEFAULT_TASK_COLUMNS.find((d) => d.statusKey === key);
        return prisma.customKanbanColumn.upsert({
          where: { statusKey: key },
          update: {
            order: index,
          },
          create: {
            statusKey: key,
            label: defaultDef?.label ?? key,
            icon: defaultDef?.icon ?? "flask",
            color: defaultDef?.color ?? "purple",
            order: index,
          },
        });
      })
    );

    return this.list();
  },

  async resetOrder() {
    const all = await this.list();
    const standardKeys = DEFAULT_TASK_COLUMNS.map((c) => c.statusKey);
    const customKeys = all
      .filter((c) => !STANDARD_STATUS_KEYS.has(c.statusKey))
      .map((c) => c.statusKey);

    const orderedKeys = [...standardKeys, ...customKeys];
    return this.reorder(orderedKeys);
  },

  async delete(id: string) {
    const column = await prisma.customKanbanColumn.findUnique({
      where: { id },
    });

    if (column && STANDARD_STATUS_KEYS.has(column.statusKey)) {
      throw new Error("Default workspace columns cannot be deleted.");
    }

    return prisma.customKanbanColumn.delete({
      where: { id },
    });
  },

  async deleteByStatusKey(statusKey: string) {
    const key = statusKey.toUpperCase().trim();
    if (STANDARD_STATUS_KEYS.has(key)) {
      throw new Error("Default workspace columns cannot be deleted.");
    }

    return prisma.customKanbanColumn.deleteMany({
      where: { statusKey: key },
    });
  },
};

