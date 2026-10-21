"use client";

import { Modal, Button, UserAvatar } from "@zsyio/ui";
import { ShieldCheck, ArrowRight, Loader2, History, PlusCircle, Wrench, Trash2 } from "lucide-react";
import { useGetSessionAuditLogsQuery } from "@/store/api/timesheetApi";
import { formatTime, formatDate } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";

interface AuditHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  label?: string;
}

function isIsoDateTime(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str.trim()) && !isNaN(Date.parse(str.trim()));
}

function formatSingleTimestamp(str: string, timeZone?: string): string {
  const d = new Date(str.trim());
  return formatTime(d, timeZone);
}

function formatAuditValue(val?: string | null, timeZone?: string): string {
  if (!val || val === "None" || val === "null" || val === "undefined") return "None";

  // Check if it's an interval: "start - end"
  if (val.includes(" - ")) {
    const parts = val.split(" - ");
    if (parts.length === 2) {
      const part0Iso = isIsoDateTime(parts[0]);
      const part1Iso = isIsoDateTime(parts[1]);
      const part1IsNull = parts[1].trim() === "null" || parts[1].trim() === "None" || !parts[1].trim();
      const part0IsNull = parts[0].trim() === "null" || parts[0].trim() === "None" || !parts[0].trim();

      if (part0Iso && part1Iso) {
        return `${formatDate(parts[0], timeZone)} ${formatSingleTimestamp(parts[0], timeZone)} – ${formatSingleTimestamp(parts[1], timeZone)}`;
      }
      if (part0Iso && part1IsNull) {
        return `${formatDate(parts[0], timeZone)} ${formatSingleTimestamp(parts[0], timeZone)} – (Ongoing)`;
      }
      if (part0IsNull && part1Iso) {
        return `None – ${formatDate(parts[1], timeZone)} ${formatSingleTimestamp(parts[1], timeZone)}`;
      }
    }
  }

  // Check if it's a single ISO timestamp
  if (isIsoDateTime(val)) {
    return `${formatDate(val, timeZone)} ${formatSingleTimestamp(val, timeZone)}`;
  }

  return val;
}

function getActionBadge(action: string) {
  switch (action) {
    case "CREATED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/25  font-mono shadow-2xs">
          <PlusCircle className="w-3 h-3" />
          Created
        </span>
      );
    case "CORRECTED":
    case "UPDATED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-notion-blue-fg/10 text-notion-blue-fg border border-notion-blue-fg/25  font-mono shadow-2xs">
          <Wrench className="w-3 h-3" />
          Corrected
        </span>
      );
    case "DELETED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/25  font-mono shadow-2xs">
          <Trash2 className="w-3 h-3" />
          Deleted
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-notion-purple-fg/10 text-notion-purple-fg border border-notion-purple-fg/25  font-mono shadow-2xs">
          <ShieldCheck className="w-3 h-3" />
          {action}
        </span>
      );
  }
}

export function AuditHistoryModal({ open, onOpenChange, sessionId, label }: AuditHistoryModalProps) {
  const { timeZone, timeZoneConfig } = useTimeZone();
  const { data: auditLogs, isLoading } = useGetSessionAuditLogsQuery(sessionId || "", {
    skip: !sessionId || !open,
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Timesheet Audit History"
      icon={<History className="w-5 h-5 text-primary" />}
      iconVariant="primary"
      size="md"
      description={`Audit trail and record changes for ${label || "this session"}. Times displayed in ${timeZoneConfig.code}.`}
    >
      <div className="space-y-4 pt-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading audit history...</span>
          </div>
        ) : !auditLogs || auditLogs.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground bg-surface-subtle/40 rounded-lg border border-dashed border-border/80">
            No audit modifications recorded for this entry.
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {auditLogs.map((log) => {
              const date = new Date(log.createdAt);
              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-lg bg-surface-subtle/70 border border-border/80 text-xs space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <UserAvatar
                        user={{ name: log.actor.name, email: log.actor.email }}
                        size="xs"
                      />
                      <span>{log.actor.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-card text-muted-foreground font-mono font-medium border border-border/60 ">
                        {log.actor.role}
                      </span>
                    </div>

                    {getActionBadge(log.action)}
                  </div>

                  {log.field && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold   text-muted-foreground">
                      <span>FIELD:</span>
                      <span className="px-1.5 py-0.5 rounded bg-card text-xs font-mono border border-border/70 text-foreground font-semibold">
                        {log.field === "timeRange" ? "TIME RANGE" : log.field.replace(/([A-Z])/g, " $1")}
                      </span>
                    </div>
                  )}

                  {log.reason && (
                    <div className="text-xs bg-card p-2.5 rounded-lg border border-border/70 shadow-2xs">
                      <span className="font-semibold text-muted-foreground">Reason: </span>
                      <span className="text-foreground italic">{log.reason}</span>
                    </div>
                  )}

                  {(log.oldValue || log.newValue) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground bg-card/80 p-2.5 rounded-lg border border-border/60 shadow-2xs">
                      <span
                        className="line-through text-destructive font-medium"
                        title={formatAuditValue(log.oldValue, timeZone)}
                      >
                        {formatAuditValue(log.oldValue, timeZone)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span
                        className="text-success font-semibold"
                        title={formatAuditValue(log.newValue, timeZone)}
                      >
                        {formatAuditValue(log.newValue, timeZone)}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-right pt-0.5">
                    {formatDate(date, timeZone)} at {formatTime(date, timeZone)} <span className="font-mono opacity-75">({timeZoneConfig.code})</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-lg text-xs px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
