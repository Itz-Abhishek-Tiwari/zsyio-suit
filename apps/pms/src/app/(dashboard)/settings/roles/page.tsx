import { redirect } from "next/navigation";
import { getAppUrl } from "@zsyio/ui";

export default function RolesSettingsPage() {
  redirect(getAppUrl("admin", "/roles"));
}
