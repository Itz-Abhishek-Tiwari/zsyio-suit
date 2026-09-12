import { prisma } from "@zsyio/database";
import { setDynamicAllowedDomains, DEFAULT_ALLOWED_DOMAINS } from "@zsyio/auth/domain-restriction";
import type { CreateDomainInput, UpdateDomainInput } from "@zsyio/validators";

export const domainRepository = {
  async list() {
    let domains = await prisma.allowedDomain.findMany({
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    if (domains.length === 0) {
      await prisma.allowedDomain.createMany({
        data: [
          { domain: "zsyio.com", isPrimary: true, isActive: true },
          { domain: "mediloon.de", isPrimary: false, isActive: true },
        ],
        skipDuplicates: true,
      });

      domains = await prisma.allowedDomain.findMany({
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      });
    }

    const activeDomains = domains.filter((d) => d.isActive).map((d) => d.domain);
    setDynamicAllowedDomains(activeDomains.length > 0 ? activeDomains : DEFAULT_ALLOWED_DOMAINS);

    return domains;
  },

  async getActiveDomains() {
    const domains = await this.list();
    const active = domains.filter((d) => d.isActive).map((d) => d.domain);
    return active.length > 0 ? active : DEFAULT_ALLOWED_DOMAINS;
  },

  async create(data: CreateDomainInput) {
    const normalizedDomain = data.domain.trim().toLowerCase().replace(/^@/, "");

    const existing = await prisma.allowedDomain.findUnique({
      where: { domain: normalizedDomain },
    });
    if (existing) {
      throw new Error(`Domain "${normalizedDomain}" is already configured.`);
    }

    return prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.allowedDomain.updateMany({
          data: { isPrimary: false },
        });
      }

      const created = await tx.allowedDomain.create({
        data: {
          domain: normalizedDomain,
          isPrimary: Boolean(data.isPrimary),
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        },
      });

      const allActive = await tx.allowedDomain.findMany({
        where: { isActive: true },
        select: { domain: true },
      });
      setDynamicAllowedDomains(allActive.map((d) => d.domain));

      return created;
    });
  },

  async update(id: string, data: UpdateDomainInput) {
    const existing = await prisma.allowedDomain.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Domain not found.");
    }

    return prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.allowedDomain.updateMany({
          where: { id: { not: id } },
          data: { isPrimary: false },
        });
      }

      const updated = await tx.allowedDomain.update({
        where: { id },
        data: {
          domain: data.domain ? data.domain.trim().toLowerCase().replace(/^@/, "") : undefined,
          isPrimary: data.isPrimary !== undefined ? Boolean(data.isPrimary) : undefined,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        },
      });

      const allActive = await tx.allowedDomain.findMany({
        where: { isActive: true },
        select: { domain: true },
      });
      setDynamicAllowedDomains(allActive.map((d) => d.domain));

      return updated;
    });
  },

  async setPrimary(id: string) {
    const existing = await prisma.allowedDomain.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Domain not found.");
    }

    return prisma.$transaction(async (tx) => {
      await tx.allowedDomain.updateMany({
        data: { isPrimary: false },
      });

      const updated = await tx.allowedDomain.update({
        where: { id },
        data: { isPrimary: true, isActive: true },
      });

      const allActive = await tx.allowedDomain.findMany({
        where: { isActive: true },
        select: { domain: true },
      });
      setDynamicAllowedDomains(allActive.map((d) => d.domain));

      return updated;
    });
  },

  async delete(id: string) {
    const existing = await prisma.allowedDomain.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Domain not found.");
    }

    const count = await prisma.allowedDomain.count({ where: { isActive: true } });
    if (count <= 1 && existing.isActive) {
      throw new Error("Cannot delete the only remaining active corporate domain. Add another domain first.");
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const res = await tx.allowedDomain.delete({ where: { id } });

      if (existing.isPrimary) {
        const next = await tx.allowedDomain.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        });
        if (next) {
          await tx.allowedDomain.update({
            where: { id: next.id },
            data: { isPrimary: true },
          });
        }
      }

      const allActive = await tx.allowedDomain.findMany({
        where: { isActive: true },
        select: { domain: true },
      });
      setDynamicAllowedDomains(allActive.map((d) => d.domain));

      return res;
    });

    return deleted;
  },
};
