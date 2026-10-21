"use client";

import { useState } from "react";
import { Button } from "@zsyio/ui";
import { AlertTriangle, Wrench } from "lucide-react";
import { useGetTimesheetStatusQuery, type TimesheetStatusResponse } from "@/store/api/timesheetApi";
import { FixIncompleteModal } from "./modals/FixIncompleteModal";
import { useTimeZone } from "@/context/TimeZoneContext";

interface IncompleteSessionItem {
  id: string;
  type: "WORK" | "OOO";
  date: string;
  startTime: string;
  reason?: string | null;
}

interface IncompleteRecordsBannerProps {
  statusData?: TimesheetStatusResponse | null;
}

export function IncompleteRecordsBanner({ statusData: propStatusData }: IncompleteRecordsBannerProps = {}) {
  const { formatTime, formatDate } = useTimeZone();
  const { data: fetchedStatusData } = useGetTimesheetStatusQuery(undefined, {
    skip: !!propStatusData,
  });
  const statusData = propStatusData || fetchedStatusData;
  const [fixModalOpen, setFixModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<IncompleteSessionItem | null>(null);

  if (!statusData || !statusData.incompleteSessions || statusData.incompleteSessions.length === 0) {
    return null;
  }

  const firstIncomplete = statusData.incompleteSessions[0] as IncompleteSessionItem;

  const handleOpenFix = (session: IncompleteSessionItem) => {
    setSelectedSession(session);
    setFixModalOpen(true);
  };

  return (
    <>
      <div className="p-4.5 sm:p-5 rounded-lg bg-warning/10 border border-warning/30 text-warning shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-warning/20 text-warning flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span>⚠️ Incomplete Timesheet Detected</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-warning/20 font-mono">
                {statusData.incompleteSessions.length} pending
              </span>
            </h3>
            <p className="text-xs text-warning/80 mt-0.5">
              Missing {firstIncomplete.type === "WORK" ? "Clock Out" : "Break End"} on{" "}
              <span className="font-semibold">{formatDate(firstIncomplete.date)}</span> (Started at{" "}
              {formatTime(firstIncomplete.startTime)}). Please provide the missing time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            size="sm"
            onClick={() => handleOpenFix(firstIncomplete)}
            className="h-9 px-4 rounded-md text-xs font-semibold gap-1.5 bg-warning hover:bg-warning text-white shadow-xs"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Fix Timesheet</span>
          </Button>
        </div>
      </div>

      <FixIncompleteModal
        open={fixModalOpen}
        onOpenChange={setFixModalOpen}
        session={selectedSession}
      />
    </>
  );
}
