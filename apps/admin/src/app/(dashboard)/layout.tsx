import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth, SessionProvider } from "@zsyio/auth";
import { canAccessApp, can, type AppId } from "@zsyio/auth/permissions";
import { DashboardShell } from "./dashboard-shell";
import { AccessRestricted } from "@zsyio/ui";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions;

  const allowedApps: AppId[] = (["pms", "notes", "hrms", "admin", "sales"] as const).filter((appId) =>
    canAccessApp(role, appId, permissions)
  );

  // Verify Admin Suite Clearance
  const hasAccess =
    canAccessApp(role, "admin", permissions) ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    can(role, "user:manage", permissions) ||
    can(role, "role:manage", permissions);

  if (!hasAccess) {
    return (
      <AccessRestricted
        currentApp="admin"
        role={role}
        userEmail={session.user.email ?? undefined}
        allowedApps={allowedApps}
      />
    );
  }

  const cookieStore = await cookies();
  const initialCollapsed =
    (cookieStore.get("admin_sidebar_collapsed")?.value ??
      cookieStore.get("sidebar_collapsed")?.value) === "true";

  return (
    <SessionProvider>
      <DashboardShell
        role={role}
        permissions={permissions}
        name={session.user.name ?? session.user.email ?? "Admin"}
        email={session.user.email ?? undefined}
        initialCollapsed={initialCollapsed}
      >
        {children}
      </DashboardShell>
    </SessionProvider>
  );
}
