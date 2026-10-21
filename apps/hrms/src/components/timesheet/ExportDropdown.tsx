"use client";

import { useState } from "react";
import { Button } from "@zsyio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zsyio/ui";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useTimeZone } from "@/context/TimeZoneContext";

interface ExportDropdownProps {
  filters?: Record<string, any>;
}

export function ExportDropdown({ filters = {} }: ExportDropdownProps) {
  const { timeZone } = useTimeZone();
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (format: "csv" | "xlsx", type: "summary" | "detailed") => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      params.set("format", format);
      params.set("type", type);
      params.set("timezone", timeZone);

      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          params.set(key, String(val));
        }
      });

      const url = `/api/timesheet/export?${params.toString()}`;
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={downloading}
          className="h-9 px-3.5 text-xs font-semibold gap-2 rounded-lg border-border hover:bg-surface-elevated shadow-xs"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : (
            <Download className="w-3.5 h-3.5 text-primary" />
          )}
          <span>Export Timesheets</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-lg p-1.5 shadow-md">
        <DropdownMenuLabel className="text-xs font-semibold   text-muted-foreground px-2 py-1">
          Daily Summary Export
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleExport("xlsx", "summary")}
          className="text-xs font-medium gap-2 rounded-lg cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-success" />
          <span>Summary in Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("csv", "summary")}
          className="text-xs font-medium gap-2 rounded-lg cursor-pointer"
        >
          <FileText className="w-4 h-4 text-notion-blue-fg" />
          <span>Summary in CSV (.csv)</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuLabel className="text-xs font-semibold   text-muted-foreground px-2 py-1">
          Detailed Activity Breakdown
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleExport("xlsx", "detailed")}
          className="text-xs font-medium gap-2 rounded-lg cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-success" />
          <span>Activities in Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("csv", "detailed")}
          className="text-xs font-medium gap-2 rounded-lg cursor-pointer"
        >
          <FileText className="w-4 h-4 text-notion-blue-fg" />
          <span>Activities in CSV (.csv)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
