import { prisma } from "@zsyio/database";
import type { CreateClientInput, UpdateClientInput } from "@zsyio/validators";

export type ClientListFilters = {
  status?: string;
  clientType?: string;
  q?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  includeDeleted?: boolean;
};

const ALLOWED_CLIENT_SORT_FIELDS = new Set([
  "name",
  "domain",
  "status",
  "clientType",
  "contractStart",
  "contractEnd",
  "createdAt",
  "updatedAt",
]);

export const clientRepository = {
  // Minimal lookup for dropdowns (task filters, task creation) that don't
  // need the full client:view permission or the full record shape.
  async listLite(limit = 200) {
    return prisma.client.findMany({
      where: { deletedAt: null, clientType: "DEVELOPMENT" },
      select: { id: true, name: true, status: true, clientType: true },
      orderBy: { name: "asc" },
      take: limit,
    });
  },

  async list({ status, clientType, q, page, pageSize, sortBy, sortDir, includeDeleted }: ClientListFilters) {
    const where = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      clientType: (clientType as never) || "DEVELOPMENT",
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { domain: { contains: q, mode: "insensitive" as const } },
              { contactEmail: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const effectiveSortBy = sortBy && ALLOWED_CLIENT_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: { products: { where: { deletedAt: null } } },
        orderBy: { [effectiveSortBy]: sortDir ?? "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.client.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async findById(id: string, includeDeleted = false) {
    return prisma.client.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: { products: { where: { deletedAt: null } } },
      relationLoadStrategy: "join",
    });
  },

  async create(data: CreateClientInput) {
    return prisma.client.create({ data });
  },

  async update(id: string, data: UpdateClientInput) {
    return prisma.client.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    const now = new Date();
    return prisma.$transaction(
      async (tx) => {
        await tx.client.update({ where: { id }, data: { deletedAt: now } });
        const products = await tx.product.findMany({ where: { clientId: id }, select: { id: true } });
        const productIds = products.map((p) => p.id);
        await tx.product.updateMany({ where: { clientId: id }, data: { deletedAt: now } });
        if (productIds.length) {
          await tx.task.updateMany({ where: { productId: { in: productIds } }, data: { deletedAt: now } });
        }
      },
      { maxWait: 5000, timeout: 15000 }
    );
  },
};
