import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { roleService } from "@/server/services/role.service";

export async function POST() {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    return roleService.resetDefaults(user);
  });
}
