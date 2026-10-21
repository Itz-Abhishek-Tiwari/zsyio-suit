import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth, SessionProvider } from "@zsyio/auth";
import { canAccessApp, type AppId } from "@zsyio/auth/permissions";
import { NavigationProgress, UnsavedChangesProvider, AccessRestricted } from "@zsyio/ui";
import { NotesShell } from "./notes-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const permissions = session.user.permissions;

  const allowedApps: AppId[] = (["pms", "notes", "hrms", "admin", "sales", "recruit"] as const).filter((appId) =>
    canAccessApp(role, appId, permissions)
  );

  if (!canAccessApp(role, "notes", permissions)) {
    return (
      <AccessRestricted
        currentApp="notes"
        role={role}
        userEmail={session.user.email ?? undefined}
        allowedApps={allowedApps}
      />
    );
  }

  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <UnsavedChangesProvider>
        <NotesShell
          role={role}
          permissions={permissions}
          name={session.user.name ?? session.user.email ?? ""}
          mustChangePassword={session.user.mustChangePassword ?? false}
        >
          {children}
        </NotesShell>
      </UnsavedChangesProvider>
    </SessionProvider>
  );
}
