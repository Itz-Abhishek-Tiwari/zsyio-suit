import { auth } from "@zsyio/auth";
import { notFound } from "next/navigation";
import { UserProfileView } from "@/components/profile/UserProfileView";

export const metadata = {
  title: "Profile Settings - Zsyio Flow",
  description: "Manage your identity, timezone, appearance and security credentials.",
};

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user) notFound();

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* Page heading */}
      <div className="border-b border-border/60 pb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Account Settings</p>
        <h1 className="text-xl font-bold font-display text-foreground tracking-tight">Profile &amp; Preferences</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your workspace identity, timezone, appearance, and security credentials.</p>
      </div>

      {/* Two-column settings layout */}
      <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden h-[720px] flex flex-col">
        <UserProfileView />
      </div>
    </div>
  );
}

