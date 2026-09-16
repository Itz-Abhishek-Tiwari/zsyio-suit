import { redirect } from "next/navigation";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003";
  redirect(`${adminUrl}/users/${userId}`);
}
