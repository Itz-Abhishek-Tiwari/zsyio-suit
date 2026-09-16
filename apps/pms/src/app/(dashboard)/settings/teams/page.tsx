import { redirect } from "next/navigation";

export default function TeamsPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003";
  redirect(`${adminUrl}/teams`);
}
