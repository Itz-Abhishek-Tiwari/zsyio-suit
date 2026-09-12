import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { roleService } from "@/server/services/role.service";

export async function POST() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return roleService.resetDefaults(user);
  });
}
