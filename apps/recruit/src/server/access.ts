import { requireUser } from "@zsyio/auth/api-helpers";
import { assertCan } from "@zsyio/auth/permissions";
export async function requireRecruitUser(write = false) {
  const user = await requireUser();
  assertCan(user.role, "app:access:recruit", user.permissions);
  if (write) assertCan(user.role, "recruit:manage", user.permissions);
  return user;
}
