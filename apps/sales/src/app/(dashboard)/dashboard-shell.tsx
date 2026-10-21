"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { visibleNavItems, type NavItem } from "@/components/shared/nav-config";
import type { Role } from "@zsyio/auth/permissions";
import { cn } from "@/lib/utils";
import { PageTransition, SuiteSidebar, TooltipProvider } from "@zsyio/ui";
import {
  Compass,
  Columns3,
  UserCheck,
  Timer,
  Plus,
} from "lucide-react";
import { ChangePasswordModal } from "@zsyio/ui";

export function DashboardShell({
  role,
  permissions,
  name,
  allowedApps,
  initialCollapsed = false,
  mustChangePassword = false,
  children,
}: {
  role: Role | string;
  permissions?: string[] | null;
  name: string;
  allowedApps?: ("pms" | "notes" | "hrms" | "admin" | "sales" | "recruit")[];
  /** Pre-read from sidebar_collapsed cookie server-side to prevent CLS */
  initialCollapsed?: boolean;
  mustChangePassword?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

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
    items.find((i) => i.href !== "/" && pathname.startsWith(i.href))?.label ??
    "Overview";

  const navGroups = useMemo(() => {
    const mapItem = (item: NavItem) => {
      let icon = Compass;
      if (item.href === "/kanban") icon = Columns3;
      else if (item.href === "/leads") icon = UserCheck;
      else if (item.href === "/activities") icon = Timer;

      const isActive =
        item.href === "/"
          ? pathname === "/"
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
        title: "SALES CRM",
        items: items.map(mapItem),
      },
    ];
  }, [items, pathname]);

  return (
    <TooltipProvider delayDuration={80}>
      <div className="flex h-screen w-full overflow-hidden bg-background font-sans">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          />
        )}

        {/* Left Side: Workmate SuiteSidebar from @zsyio/ui */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 h-full shrink-0 flex flex-col transition-[width,transform] duration-150 cubic-bezier(0.2,0,0,1)",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <SuiteSidebar
            currentApp="sales"
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            onCloseMobile={() => setMobileOpen(false)}
            user={{
              name,
              role: String(role),
            }}
            actionButton={{
              label: "New Lead",
              href: "/leads/new",
              icon: Plus,
            }}
            navGroups={navGroups}
          />
        </aside>

        {/* Main Body */}
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

        {mustChangePassword && (
          <ChangePasswordModal
            open={mustChangePassword}
            onOpenChange={() => {}} // cannot be closed - forced reset
            forced
          />
        )}
      </div>
    </TooltipProvider>
  );
}

