import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { directoryService } from "@/server/services/directory.service";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    return directoryService.getDirectory();
  });
}
