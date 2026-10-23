import { redirect } from "next/navigation";
import { getAppUrl } from "@zsyio/ui";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  redirect(getAppUrl("admin", `/users/${encodeURIComponent(userId)}`));
}
