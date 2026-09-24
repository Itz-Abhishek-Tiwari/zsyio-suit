import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth, SessionProvider } from "@zsyio/auth";
import { canAccessApp, type AppId } from "@zsyio/auth/permissions";
import { NavigationProgress, AccessRestricted } from "@zsyio/ui";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const permissions = session.user.permissions;

  const allowedApps: AppId[] = (["pms", "notes", "hrms", "admin", "sales"] as const).filter((appId) =>
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
    <SessionProvider>
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
    </SessionProvider>
  );
}
