import { NextRequest, NextResponse } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { assertCan } from "@zsyio/auth/permissions";
import { taskColumnsRepository } from "@/server/repositories/task-columns.repository";
import { z } from "zod";

const createColumnSchema = z.object({
  statusKey: z.string().min(1, "Column identifier is required"),
  label: z.string().min(1, "Column label is required"),
  icon: z.string().optional().default("flask"),
  color: z.string().optional().default("purple"),
  order: z.number().optional().default(0),
});

const reorderColumnsSchema = z.object({
  columnOrders: z.array(z.string()).optional(),
  statusKeys: z.array(z.string()).optional(),
}).refine(data => (data.columnOrders && data.columnOrders.length > 0) || (data.statusKeys && data.statusKeys.length > 0), {
  message: "Either columnOrders or statusKeys must be provided as a non-empty array",
});

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    const columns = await taskColumnsRepository.list();
    return NextResponse.json(columns);
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "task:column:manage", user.permissions);

    const body = await request.json();
    const validated = createColumnSchema.parse(body);

    const created = await taskColumnsRepository.create(validated);
    return NextResponse.json(created, { status: 201 });
  });
}

export async function PUT(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "task:column:manage", user.permissions);

    const body = await request.json();
    const validated = reorderColumnsSchema.parse(body);
    const keys = validated.columnOrders || validated.statusKeys || [];

    const updatedColumns = await taskColumnsRepository.reorder(keys);
    return NextResponse.json(updatedColumns);
  });
}
