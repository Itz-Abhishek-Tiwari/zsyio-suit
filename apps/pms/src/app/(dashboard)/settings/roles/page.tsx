import { redirect } from "next/navigation";

export default function RolesSettingsPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003";
  redirect(`${adminUrl}/roles`);
}
