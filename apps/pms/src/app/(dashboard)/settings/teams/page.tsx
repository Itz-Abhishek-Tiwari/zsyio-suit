import { redirect } from "next/navigation";
import { getAppUrl } from "@zsyio/ui";

export default function TeamsPage() {
  redirect(getAppUrl("admin", "/teams"));
}
