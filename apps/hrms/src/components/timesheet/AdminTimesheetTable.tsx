import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Button, UserAvatar, TimesheetStatusBadge } from "@zsyio/ui";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Wrench,
  History,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useDeleteManualOooMutation } from "@/store/api/timesheetApi";
import type { AdminTimesheetListItem } from "@/store/api/timesheetApi";
import { formatDuration } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";
import { AdminCorrectionModal } from "./modals/AdminCorrectionModal";
import { AuditHistoryModal } from "./modals/AuditHistoryModal";

interface AdminTimesheetTableProps {
  items: AdminTimesheetListItem[];
  isLoading: boolean;
}

export function AdminTimesheetTable({ items, isLoading }: AdminTimesheetTableProps) {
  const { data: session } = useSession();
  const { formatTime, formatDate, timeZoneConfig } = useTimeZone();
  const userRole = session?.user?.role;
  const userPermissions = (session?.user as any)?.permissions || [];
  const canManageTimesheet =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userPermissions.includes("timesheet:manage");

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [correctionSession, setCorrectionSession] = useState<{
    id: string;
    type: "WORK" | "OOO";
    employeeName: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
  } | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);

  const [auditSessionId, setAuditSessionId] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLabel, setAuditLabel] = useState<string>("");

  const [deleteManualOoo, { isLoading: isDeletingOoo }] = useDeleteManualOooMutation();

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCorrection = (item: AdminTimesheetListItem) => {
    setCorrectionSession({
      id: item.id,
      type: "WORK",
      employeeName: item.user.name,
      date: item.date,
      startTime: item.firstClockIn,
      endTime: item.lastClockOut,
    });
    setCorrectionOpen(true);
  };

  const handleOpenOooCorrection = (item: AdminTimesheetListItem, act: any) => {
    setCorrectionSession({
      id: act.id,
      type: "OOO",
      employeeName: item.user.name,
      date: item.date,
      startTime: act.startTime,
      endTime: act.endTime,
    });
    setCorrectionOpen(true);
  };

  const handleDeleteOoo = async (oooId: string) => {
    if (!window.confirm("Are you sure you want to delete this manual break?")) return;
    try {
      await deleteManualOoo(oooId).unwrap();
      toast.success("Manual break deleted.");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Failed to delete break.");
    }
  };

  const handleOpenAudit = (id: string, label: string) => {
    setAuditSessionId(id);
    setAuditLabel(label);
    setAuditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-lg border border-border/80">
        Loading organization timesheets...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-16 text-center rounded-lg border border-dashed border-border/80 bg-card/40 space-y-2">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
        <h3 className="text-sm font-bold text-foreground">No Timesheets Match Filters</h3>
        <p className="text-xs text-muted-foreground">
          Try broadening your search or adjusting the selected date and status filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg bg-card border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-surface-subtle/70 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 pl-3.5 pr-1 w-9 text-center"></th>
                <th className="py-3.5 px-3 min-w-[200px]">Employee</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Date</th>
                <th className="py-3.5 px-3 whitespace-nowrap">
                  First In <span className="text-[9px] opacity-75 font-mono">({timeZoneConfig.code})</span>
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Last Out <span className="text-[9px] opacity-75 font-mono">({timeZoneConfig.code})</span>
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">Net Working</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Breaks</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Type</th>
                <th className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item) => {
                const isExpanded = Boolean(expandedRows[item.id]);
                const hasWork = item.netWorkingMinutes > 0;
                const isTargetMet = item.netWorkingMinutes >= 480;

                return (
                  <React.Fragment key={item.id}>
                    <tr className="group hover:bg-surface-subtle/50 transition-colors">
                      {/* Expand Toggle */}
                      <td className="py-3 pl-3.5 pr-1 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => toggleRow(item.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer inline-flex items-center justify-center"
                          title={isExpanded ? "Collapse activity breakdown" : "Expand activity breakdown"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Employee Profile */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar user={item.user} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs leading-snug truncate">
                              {item.user.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate font-mono">
                              {item.user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap text-muted-foreground font-medium text-xs">
                        {formatDate(item.date)}
                      </td>

                      {/* First In */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-xs text-foreground">
                        {formatTime(item.firstClockIn)}
                      </td>

                      {/* Last Out */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-xs text-foreground">
                        {formatTime(item.lastClockOut)}
                      </td>

                      {/* Net Working Hours */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-xs font-semibold">
                        <span
                          className={
                            isTargetMet
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : hasWork
                              ? "text-foreground font-semibold"
                              : "text-muted-foreground/60"
                          }
                        >
                          {formatDuration(item.netWorkingMinutes)}
                        </span>
                      </td>

                      {/* OOO Breaks */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-xs">
                        {item.totalOooMinutes > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {formatDuration(item.totalOooMinutes)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">0m</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <TimesheetStatusBadge
                          status={item.isIncomplete ? "INCOMPLETE" : item.status}
                          size="xs"
                        />
                      </td>

                      {/* Entry Type */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-subtle text-muted-foreground border border-border/80">
                          {item.hasManual ? "Manual" : "Auto"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-4 pl-3 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageTimesheet && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCorrection(item)}
                              className="h-7 px-2.5 text-xs rounded-lg gap-1 border-border/80 hover:bg-surface-subtle hover:text-foreground"
                            >
                              <Wrench className="w-3 h-3 text-primary" />
                              <span>Correct</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleOpenAudit(item.id, `${item.user.name} - ${formatDate(item.date)}`)
                            }
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                            title="Audit history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Activity Breakdown Subtable */}
                    {isExpanded && (
                      <tr className="bg-surface-subtle/70">
                        <td colSpan={10} className="p-4 border-t border-border/60">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Activity Timeline Segments ({item.timeline.length})
                              </p>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                Shift total: {formatDuration(item.netWorkingMinutes)} work ·{" "}
                                {formatDuration(item.totalOooMinutes)} break
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {item.timeline.map((act) => (
                                <div
                                  key={act.id}
                                  className="p-2.5 rounded-xl bg-card border border-border/60 text-xs space-y-1 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        act.type === "WORK"
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      }`}
                                    >
                                      {act.label}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-foreground">
                                        {formatDuration(act.durationMinutes)}
                                      </span>
                                      {canManageTimesheet && act.type === "OOO" && act.entryType === "MANUAL" && (
                                        <div className="flex items-center gap-1 ml-1">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenOooCorrection(item, act)}
                                            className="h-5 w-5 rounded flex items-center justify-center bg-card hover:bg-surface-elevated text-muted-foreground hover:text-foreground border border-border/80 shadow-2xs transition-colors"
                                            title="Edit manual break"
                                            aria-label="Edit manual break"
                                          >
                                            <Edit2 className="w-2.5 h-2.5" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isDeletingOoo}
                                            onClick={() => handleDeleteOoo(act.id)}
                                            className="h-5 w-5 rounded flex items-center justify-center bg-card hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 border border-border/80 hover:border-rose-500/30 shadow-2xs transition-colors disabled:opacity-50"
                                            title="Delete manual break"
                                            aria-label="Delete manual break"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-[11px] font-mono text-muted-foreground">
                                    {formatTime(act.startTime)} → {formatTime(act.endTime)}
                                  </div>
                                  {act.reason && (
                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {act.reason}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {correctionSession && (
        <AdminCorrectionModal
          key={correctionSession.id}
          open={correctionOpen}
          onOpenChange={setCorrectionOpen}
          session={correctionSession}
        />
      )}

      <AuditHistoryModal
        open={auditOpen}
        onOpenChange={setAuditOpen}
        sessionId={auditSessionId}
        label={auditLabel}
      />
    </>
  );
}

