import { redirect } from "next/navigation";
import { getAppUrl } from "@zsyio/ui";

export default function UsersPage() {
  redirect(getAppUrl("admin", "/users"));
}
