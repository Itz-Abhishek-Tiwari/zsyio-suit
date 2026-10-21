import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth, SessionProvider } from "@zsyio/auth";
import { canAccessApp, can, type AppId } from "@zsyio/auth/permissions";
import { NavigationProgress, AccessRestricted } from "@zsyio/ui";
import { RecruitShell } from "./recruit-shell";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user;
  const allowedApps: AppId[] = (
    ["pms", "notes", "hrms", "admin", "sales", "recruit"] as const
  ).filter((app) => canAccessApp(user.role, app, user.permissions));
  if (!canAccessApp(user.role, "recruit", user.permissions))
    return (
      <AccessRestricted
        currentApp="recruit"
        role={user.role}
        userEmail={user.email ?? undefined}
        allowedApps={allowedApps}
      />
    );
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("sidebar_collapsed")?.value === "true";
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <RecruitShell
        user={{ name: user.name ?? user.email ?? "Team member", role: user.role }}
        allowedApps={allowedApps}
        initialCollapsed={initialCollapsed}
        mustChangePassword={user.mustChangePassword ?? false}
        canManage={can(user.role, "recruit:manage", user.permissions)}
      >
        {children}
      </RecruitShell>
    </SessionProvider>
  );
}
