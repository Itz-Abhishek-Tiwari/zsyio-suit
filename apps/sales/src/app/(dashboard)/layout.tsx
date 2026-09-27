import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth, SessionProvider } from "@zsyio/auth";
import { canAccessApp, type AppId } from "@zsyio/auth/permissions";
import { NavigationProgress, UnsavedChangesProvider, AccessRestricted } from "@zsyio/ui";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const permissions = session.user.permissions;

  const allowedApps: AppId[] = (["pms", "notes", "hrms", "admin", "sales"] as const).filter((appId) =>
    canAccessApp(role, appId, permissions)
  );

  if (!canAccessApp(role, "sales", permissions)) {
    return (
      <AccessRestricted
        currentApp="sales"
        role={role}
        userEmail={session.user.email ?? undefined}
        allowedApps={allowedApps}
      />
    );
  }

  // Read collapse preference server-side to prevent CLS
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebar_collapsed")?.value !== "false";

  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <UnsavedChangesProvider>
        <DashboardShell
          role={role}
          permissions={permissions}
          name={session.user.name ?? session.user.email ?? ""}
          allowedApps={allowedApps}
          initialCollapsed={initialCollapsed}
          mustChangePassword={session.user.mustChangePassword ?? false}
        >
          {children}
        </DashboardShell>
      </UnsavedChangesProvider>
    </SessionProvider>
  );
}
