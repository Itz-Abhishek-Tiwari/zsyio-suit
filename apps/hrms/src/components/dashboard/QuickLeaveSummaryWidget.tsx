"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button, Skeleton } from "@zsyio/ui";
import { CalendarOff, ArrowRight, PlusCircle } from "lucide-react";
import { useGetLeaveOverviewQuery } from "@/store/api/timesheetApi";
import { ApplyLeaveModal } from "../leaves/ApplyLeaveModal";
import type { LeaveBalance, LeaveOverviewResponse } from "@zsyio/types";

interface QuickLeaveSummaryWidgetProps {
  initialData?: LeaveOverviewResponse | null;
  loading?: boolean;
}

export function QuickLeaveSummaryWidget({
  initialData,
  loading: propLoading,
}: QuickLeaveSummaryWidgetProps = {}) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = (session?.user as any)?.permissions || [];
  const canReviewLeaves =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userPermissions.includes("timesheet:manage");

  const { data: fetchedData, isLoading: queryLoading } = useGetLeaveOverviewQuery(undefined, {
    skip: !!initialData,
  });
  const data = initialData || fetchedData;
  const isLoading = propLoading !== undefined ? propLoading : (queryLoading && !data);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const mainBalances = (data?.balances || []).slice(0, 3);

  return (
    <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-2xs">
              <CalendarOff className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Time Off Balances</h3>
              <p className="text-[11px] text-muted-foreground">Annual leave balance status</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setApplyModalOpen(true)}
            className="h-8 px-2.5 rounded-md text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Apply Leave</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {mainBalances.map((b: LeaveBalance) => (
              <div
                key={b.type}
                className="p-3 rounded-md bg-surface-subtle/60 border border-border/70 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {b.type}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {b.used} used
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold font-mono text-foreground">
                      {b.available}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/ {b.total}d</span>
                  </div>
                  <div className="h-1.5 w-full rounded-sm bg-surface-subtle border border-border/60 overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-sm bg-primary"
                      style={{
                        width: `${Math.min(100, Math.round((b.available / b.total) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
        <Link
          href="/leaves"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group"
        >
          <span>
            {canReviewLeaves ? "View Leave History & Approvals" : "View My Leave Applications"}
          </span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ApplyLeaveModal open={applyModalOpen} onOpenChange={setApplyModalOpen} />
    </div>
  );
}
