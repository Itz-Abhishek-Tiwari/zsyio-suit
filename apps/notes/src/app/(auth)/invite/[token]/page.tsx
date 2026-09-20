import { redirect } from "next/navigation";

export default async function NotesInviteRedirectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const pmsUrl = (process.env.NEXT_PUBLIC_PMS_URL || "").replace(/\/+$/, "");
  redirect(`${pmsUrl}/invite/${encodeURIComponent(token)}`);
}
