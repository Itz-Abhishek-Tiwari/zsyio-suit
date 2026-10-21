"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { visibleNavItems, type NavItem } from "@/components/shared/nav-config";
import type { Role } from "@zsyio/auth/permissions";
import { cn } from "@/lib/utils";
import { PageTransition, SuiteSidebar, TooltipProvider } from "@zsyio/ui";
import { ChangePasswordModal } from "@zsyio/ui";
import { BrowserNotificationManager } from "@/components/notifications/BrowserNotificationManager";
import { GlobalActiveTimerWidget } from "@/components/tasks/GlobalActiveTimerWidget";
import {
  Compass,
  Building2,
  Columns3,
  SquareCheckBig,
  LineChart,
  Plus,
} from "lucide-react";

export function DashboardShell({
  role,
  permissions,
  name,
  userEmail,
  initialCollapsed = true,
  mustChangePassword = false,
  children,
}: {
  role: Role | string;
  permissions?: string[] | null;
  name: string;
  userEmail?: string;
  /** Pre-read from the sidebar_collapsed cookie server-side to prevent CLS */
  initialCollapsed?: boolean;
  /** When true, block the shell behind a forced password-change modal */
  mustChangePassword?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  // Persist collapse state in a cookie (instead of localStorage) so the server
  // layout can read it on the next request and render the correct initial size,
  // eliminating the layout-shift flash on page load.
  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    document.cookie = `sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const items = visibleNavItems(role, permissions);

  const currentLabel =
    items.find((i) => i.href === pathname)?.label ??
    items.find((i) => i.href === "/clients/kanban" && pathname.startsWith("/clients/kanban"))?.label ??
    items.find((i) => i.href !== "/" && i.href !== "/clients" && pathname.startsWith(i.href))?.label ??
    items.find((i) => i.href === "/clients" && pathname.startsWith("/clients"))?.label ??
    "Overview";

  const navGroups = useMemo(() => {
    const mapItem = (item: NavItem) => {
      let icon = Compass;
      if (item.href === "/clients") icon = Building2;
      else if (item.href === "/clients/kanban") icon = Columns3;
      else if (item.href === "/tasks") icon = SquareCheckBig;
      else if (item.href === "/reports") icon = LineChart;

      const isActive =
        item.href === "/"
          ? pathname === "/"
          : item.href === "/clients"
          ? pathname === "/clients" || (pathname.startsWith("/clients/") && !pathname.startsWith("/clients/kanban"))
          : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

      return {
        id: item.href,
        label: item.label,
        href: item.href,
        icon,
        isActive,
      };
    };

    return [
      {
        title: "WORKSPACE",
        items: items.map(mapItem),
      },
    ];
  }, [items, pathname]);

  return (
    <TooltipProvider delayDuration={80}>
      <div className="flex h-screen w-full overflow-hidden bg-background font-sans">
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          />
        )}

        {/* Unified Workmate SuiteSidebar from @zsyio/ui */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 h-full shrink-0 flex flex-col transition-[width,transform] duration-150 cubic-bezier(0.2,0,0,1)",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <SuiteSidebar
            currentApp="pms"
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            onCloseMobile={() => setMobileOpen(false)}
            user={{
              name,
              role: String(role),
            }}
            actionButton={{
              label: "New Task",
              href: "/tasks/new",
              icon: Plus,
            }}
            navGroups={navGroups}
          />
        </aside>

      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        <Header
          role={role}
          permissions={permissions}
          name={name}
          currentLabel={currentLabel}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
      </div>

      <BrowserNotificationManager />
      <GlobalActiveTimerWidget />

      {mustChangePassword && (
        <ChangePasswordModal
          open={mustChangePassword}
          onOpenChange={() => {}} // cannot be closed - forced reset
          forced
          userEmail={userEmail}
        />
      )}
    </div>
    </TooltipProvider>
  );
}
