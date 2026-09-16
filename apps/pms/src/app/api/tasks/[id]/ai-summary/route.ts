import { NextRequest } from "next/server";
import { errorResponse, requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { taskService } from "@/server/services/task.service";
import { createSummaryStream } from "@/lib/ai/gemini-summary-helper";
import { prisma } from "@zsyio/database";

/**
 * POST /api/tasks/:id/ai-summary
 *
 * Exclusively streams real-time token-by-token SSE events to the client
 * while automatically persisting the final summary upon stream completion.
 *
 * Wrapped in withApiHandler so domain errors thrown by taskService.getById
 * (e.g. ForbiddenError when the caller isn't allowed to view the task) map
 * to the correct status code instead of falling through to a generic 500 -
 * withApiHandler also passes a raw streaming Response straight through.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const task = await taskService.getById(user, id);
    if (!task) return errorResponse("NOT_FOUND", "Task not found.", 404);

    if (!task.description || !task.description.trim()) {
      return errorResponse("BAD_REQUEST", "Cannot generate an AI summary for a task without a description.", 400);
    }

    // Resolve product + client for rich context
    const productWithClient = task.product
      ? {
          name: task.product.name,
          client: (task.product as { client?: { name: string } }).client ?? null,
        }
      : await prisma.product.findUnique({
          where: { id: task.productId },
          select: { name: true, client: { select: { name: true } } },
        });

    const stream = await createSummaryStream(
      {
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        clientName: productWithClient?.client?.name,
        productName: productWithClient?.name,
      },
      async (fullSummary) => {
        // Persist to database when the stream finishes
        await prisma.task.update({
          where: { id },
          data: { aiSummary: fullSummary, aiSummaryUpdatedAt: new Date() },
        });
      }
    );

    if (!stream) {
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to start AI summary stream. Check your Gemini API key.", 500);
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  });
}
