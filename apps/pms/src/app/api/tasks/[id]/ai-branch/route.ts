import { NextRequest } from "next/server";
import { errorResponse, requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { taskService } from "@/server/services/task.service";
import { generateGeminiBranchSlug } from "@/lib/ai/gemini-branch-helper";
import { generateGitBranchSuggestion } from "@/lib/git-branch-helper";
import { prisma } from "@zsyio/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const task = await taskService.getById(user, id);
    if (!task) return errorResponse("NOT_FOUND", "Task not found.", 404);

    const body = await request.json().catch(() => ({}));
    const force = Boolean(body?.force);

    if (task.gitBranchSlug && !force) {
      const suggestion = generateGitBranchSuggestion({
        id: task.id,
        ticketNumber: task.ticketNumber,
        title: task.title,
        type: task.type,
        slugOverride: task.gitBranchSlug,
      });

      return {
        slug: task.gitBranchSlug,
        ...suggestion,
        cached: true,
        source: "cache",
      };
    }

    const result = await generateGeminiBranchSlug({
      title: task.title,
      type: task.type,
    });

    if (result.slug && result.slug !== task.gitBranchSlug) {
      await prisma.task.update({
        where: { id: task.id },
        data: { gitBranchSlug: result.slug },
      });
    }

    const suggestion = generateGitBranchSuggestion({
      id: task.id,
      ticketNumber: task.ticketNumber,
      title: task.title,
      type: task.type,
      slugOverride: result.slug,
    });

    return {
      slug: result.slug,
      ...suggestion,
      cached: false,
      source: result.source,
      model: result.model,
      usage: result.usage,
    };
  });
}
