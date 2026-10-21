"use client";
import { createContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BriefcaseBusiness, Users, CalendarDays } from "lucide-react";
import {
  SuiteHeader,
  SuiteSidebar,
  TooltipProvider,
  ChangePasswordModal,
  PageTransition,
  cn,
} from "@zsyio/ui";
import type { AppId } from "@zsyio/auth/permissions";
export const ManageContext = createContext(false);
const navItems = [
  { href: "/", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/interviews", label: "Interviews", icon: CalendarDays },
];
export function RecruitShell({
  children,
  user,
  allowedApps,
  canManage,
  mustChangePassword,
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  user: { name: string; role: string };
  allowedApps: AppId[];
  canManage: boolean;
  mustChangePassword: boolean;
  /** Pre-read from the sidebar_collapsed cookie server-side to prevent CLS */
  initialCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobile, setMobile] = useState(false);
  const path = usePathname();
  useEffect(() => {
    setMobile(false);
  }, [path]);
  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };
  const items = navItems.map((item) => ({
    ...item,
    isActive: item.href === "/" ? path === "/" : path.startsWith(item.href),
  }));
  return (
    <ManageContext.Provider value={canManage}>
      <TooltipProvider delayDuration={80}>
        <div className="flex h-dvh w-full overflow-hidden bg-background font-sans">
          {mobile && (
            <button
              aria-label="Close navigation"
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
              onClick={() => setMobile(false)}
            />
          )}
          <aside
            className={cn(
              "fixed lg:static inset-y-0 left-0 z-50 h-full shrink-0 flex flex-col transition-[width,transform] duration-150",
              mobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            )}
          >
            <SuiteSidebar
              currentApp="recruit"
              user={user}
              isCollapsed={collapsed}
              onToggleCollapse={toggleCollapse}
              onCloseMobile={() => setMobile(false)}
              navGroups={[{ title: "Hiring", items }]}
            />
          </aside>
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
            <SuiteHeader
              currentApp="recruit"
              currentTitle={items.find((item) => item.isActive)?.label ?? "Recruit"}
              user={user}
              allowedApps={allowedApps}
              onMenuClick={() => setMobile(!mobile)}
              mobileOpen={mobile}
              onSignOut={() => signOut({ callbackUrl: "/login" })}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <PageTransition key={path}>{children}</PageTransition>
            </main>
          </div>
        </div>
        {mustChangePassword && (
          <ChangePasswordModal open onOpenChange={() => {}} forced />
        )}
      </TooltipProvider>
    </ManageContext.Provider>
  );
}
