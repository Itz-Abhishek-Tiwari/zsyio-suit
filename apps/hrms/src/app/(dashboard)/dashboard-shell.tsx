"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@zsyio/auth/permissions";
import { cn } from "@zsyio/ui";
import {
  SuiteSidebar,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  PageTransition,
} from "@zsyio/ui";
import { Header } from "@/components/layout/Header";
import {
  Timer,
  Play,
  Coffee,
  CalendarOff,
  CalendarHeart,
  UsersRound,
  Building2,
  Compass,
} from "lucide-react";
import { visibleNavItems, type NavItem } from "@/components/shared/nav-config";
import { useGetTimesheetStatusQuery, useClockInMutation } from "@/store/api/timesheetApi";
import { toast } from "sonner";

interface DashboardShellProps {
  role: Role | string;
  permissions?: string[] | null;
  name: string;
  initialCollapsed?: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  permissions,
  name,
  initialCollapsed = false,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const { data: statusData } = useGetTimesheetStatusQuery();
  const [clockIn, { isLoading: isClockingIn }] = useClockInMutation();

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    document.cookie = `sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const { mainItems, managementItems } = useMemo(
    () => visibleNavItems(role, permissions),
    [role, permissions]
  );

  const currentLabel =
    pathname === "/"
      ? "Dashboard"
      : pathname.startsWith("/timeline")
      ? "Timesheets & Logs"
      : pathname.startsWith("/leaves")
      ? "Leaves & Time Off"
      : pathname.startsWith("/holidays")
      ? "Company Holidays"
      : pathname.startsWith("/directory")
      ? "Team Directory"
      : pathname.startsWith("/admin")
      ? "Team Attendance"
      : "HRMS";

  const handleQuickClockIn = async () => {
    try {
      await clockIn().unwrap();
      toast.success("Clocked In successfully!");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Failed to clock in.");
    }
  };

  const navGroups = useMemo(() => {
    const mapItem = (item: NavItem) => {
      let icon = Compass;
      if (item.href === "/timeline") icon = Timer;
      else if (item.href === "/leaves") icon = CalendarOff;
      else if (item.href === "/holidays") icon = CalendarHeart;
      else if (item.href === "/directory") icon = UsersRound;
      else if (item.href === "/admin") icon = Building2;
      return {
        id: item.href,
        label: item.label,
        href: item.href,
        icon,
        exact: item.href === "/",
      };
    };

    return [
      {
        title: "WORKSPACE",
        items: mainItems.map(mapItem),
      },
      ...(managementItems.length > 0
        ? [
            {
              title: "MANAGEMENT",
              items: managementItems.map(mapItem),
            },
          ]
        : []),
    ];
  }, [mainItems, managementItems]);

  const quickClockWidget = (
    statusData?.state === "CLOCKED_OUT" ? (
      isCollapsed ? (
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button
              onClick={handleQuickClockIn}
              disabled={isClockingIn}
              aria-label="Clock In"
              className="h-10 w-10 mx-auto rounded-lg bg-success hover:bg-success text-white font-semibold text-xs flex items-center justify-center shadow-md  transition-all duration-150 cubic-bezier(0.2,0,0,1) cursor-pointer outline-none overflow-hidden"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs py-1.5 px-3">
            Clock In
          </TooltipContent>
        </Tooltip>
      ) : (
        <button
          onClick={handleQuickClockIn}
          disabled={isClockingIn}
          className="h-10 w-full py-2.5 px-3.5 gap-2 rounded-lg bg-success hover:bg-success text-white font-semibold text-xs flex items-center justify-center shadow-md  transition-all duration-150 cubic-bezier(0.2,0,0,1) cursor-pointer outline-none overflow-hidden whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span className="truncate max-w-[120px] opacity-100 transition-all duration-150">
            Clock In
          </span>
        </button>
      )
    ) : statusData?.state === "WORKING" ? (
      isCollapsed ? (
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <Link href="/" className="w-full flex justify-center">
              <div className="h-10 w-10 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs flex items-center justify-center shadow-md  transition-all duration-150 cubic-bezier(0.2,0,0,1) cursor-pointer outline-none overflow-hidden">
                <Timer className="w-4 h-4" />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs py-1.5 px-3">
            Working (View Timesheet)
          </TooltipContent>
        </Tooltip>
      ) : (
        <Link href="/" className="w-full flex justify-center">
          <div className="h-10 w-full py-2.5 px-3.5 gap-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs flex items-center justify-center shadow-md  transition-all duration-150 cubic-bezier(0.2,0,0,1) cursor-pointer outline-none overflow-hidden whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
            <span className="truncate max-w-[120px] opacity-100 transition-all duration-150">
              Working
            </span>
          </div>
        </Link>
      )
    ) : (
      isCollapsed ? (
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <Link href="/" className="w-full flex justify-center">
              <div className="h-10 w-10 rounded-lg bg-warning hover:bg-warning text-white font-semibold text-xs flex items-center justify-center shadow-md  transition-all duration-150 cubic-bezier(0.2,0,0,1) cursor-pointer outline-none overflow-hidden">
                <Coffee className="w-4 h-4" />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs py-1.5 px-3">
            On Break
          </TooltipContent>
        </Tooltip>
      ) : (
        <Link href="/" className="w-full flex justify-center">
          <div className="h-10 w-full py-2.5 px-3.5 gap-2 rounded-lg bg-warning hover:bg-warning text-white font-semibold text-xs flex items-center justify-center shadow-md  transition-all duration-150 cubic-bezier(0.2,0,0,1) cursor-pointer outline-none overflow-hidden whitespace-nowrap">
            <Coffee className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px] opacity-100 transition-all duration-150">
              On Break
            </span>
          </div>
        </Link>
      )
    )
  );

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

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 h-full shrink-0 flex flex-col transition-[width,transform] duration-150 cubic-bezier(0.2,0,0,1)",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <SuiteSidebar
            currentApp="hrms"
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            onCloseMobile={() => setMobileOpen(false)}
            user={{
              name,
              role: String(role),
            }}
            actionSlot={quickClockWidget}
            navGroups={navGroups}
          />
        </aside>

        {/* Right Main Body */}
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
      </div>
    </TooltipProvider>
  );
}
