import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth, SessionProvider } from "@zsyio/auth";
import { canAccessApp, type AppId } from "@zsyio/auth/permissions";
import { NavigationProgress, AccessRestricted, ForcedPasswordChange } from "@zsyio/ui";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const permissions = session.user.permissions;

  const allowedApps: AppId[] = (["pms", "notes", "hrms", "admin", "sales", "recruit"] as const).filter((appId) =>
    canAccessApp(role, appId, permissions)
  );

  if (!canAccessApp(role, "hrms", permissions)) {
    return (
      <AccessRestricted
        currentApp="hrms"
        role={role}
        userEmail={session.user.email ?? undefined}
        allowedApps={allowedApps}
      />
    );
  }

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebar_collapsed")?.value === "true";

  return (
    <SessionProvider session={session}>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <DashboardShell
        role={role}
        permissions={permissions}
        name={session.user.name ?? session.user.email ?? ""}
        initialCollapsed={initialCollapsed}
      >
        {children}
      </DashboardShell>
      {session.user.mustChangePassword ? (
        <ForcedPasswordChange userEmail={session.user.email ?? undefined} />
      ) : null}
    </SessionProvider>
  );
}
