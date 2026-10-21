"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { SuiteSidebar, TooltipProvider } from "@zsyio/ui";
import { cn } from "@zsyio/ui";
import type { Role } from "@zsyio/auth/permissions";
import { visibleAdminNavItems } from "@/components/shared/nav-config";
import { Sliders, UserCheck, KeyRound, Building2 } from "lucide-react";

interface DashboardShellProps {
  role: Role | string;
  permissions?: string[] | null;
  name: string;
  email?: string;
  initialCollapsed?: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  permissions,
  name,
  email,
  initialCollapsed = false,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    // Write both cookies to ensure compatibility
    document.cookie = `sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `admin_sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const navItems = useMemo(() => {
    return visibleAdminNavItems(role, permissions).map((item) => {
      let icon = Sliders;
      if (item.href === "/users") icon = UserCheck;
      else if (item.href === "/roles") icon = KeyRound;
      else if (item.href === "/teams") icon = Building2;
      return {
        id: item.href,
        label: item.label,
        href: item.href,
        icon,
        exact: item.href === "/",
      };
    });
  }, [role, permissions]);

  return (
    <TooltipProvider delayDuration={80}>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          />
        )}

        {/* Unified Workmate Collapsible Sidebar from @zsyio/ui */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 h-full shrink-0 flex flex-col transition-[width,transform] duration-150 cubic-bezier(0.2,0,0,1)",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <SuiteSidebar
            currentApp="admin"
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            onCloseMobile={() => setMobileOpen(false)}
            user={{
              name,
              role: String(role),
              email,
            }}
            actionButton={{
              label: "Invite New User",
              href: "/users",
            }}
            navGroups={[
              {
                title: "ACCESS CONTROL",
                items: navItems,
              },
            ]}
          />
        </aside>

        {/* Center Main Stage */}
        <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
          <Header
            role={String(role)}
            permissions={permissions}
            name={name}
            email={email}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 focus:outline-none custom-scrollbar">
            <div className="w-full">
              {children}
            </div>
          </main>

        </div>
      </div>
    </TooltipProvider>
  );
}
