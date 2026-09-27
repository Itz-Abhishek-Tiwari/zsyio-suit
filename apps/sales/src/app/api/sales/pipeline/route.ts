import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { salesPipelineService } from "@/server/services/sales-pipeline.service";

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return salesPipelineService.getDefault(user);
  });
}
