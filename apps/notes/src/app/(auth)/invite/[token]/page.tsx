import { redirect } from "next/navigation";
import { getAppUrl } from "@zsyio/ui";

export default async function NotesInviteRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(getAppUrl("pms", `/invite/${encodeURIComponent(token)}`));
}
