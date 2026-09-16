import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { createTaskTagSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    const tags = await prisma.taskTag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            tasks: {
              where: {
                task: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    });
    return tags;
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    await requireUser();
    const body = createTaskTagSchema.parse(await request.json());
    const name = body.name.trim();

    const tag = await prisma.taskTag.upsert({
      where: { name },
      update: {
        ...(body.color ? { color: body.color } : {}),
      },
      create: {
        name,
        color: body.color || "blue",
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return tag;
  });
}
