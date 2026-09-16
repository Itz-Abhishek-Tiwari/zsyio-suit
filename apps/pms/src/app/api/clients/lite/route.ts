import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { clientService } from "@/server/services/client.service";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    return clientService.listLite();
  });
}
