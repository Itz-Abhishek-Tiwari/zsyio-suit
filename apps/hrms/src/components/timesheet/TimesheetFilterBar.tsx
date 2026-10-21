"use client";

import { Input, Button, DatePicker, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@zsyio/ui";
import { Search, RotateCcw, AlertTriangle } from "lucide-react";
import { ExportDropdown } from "./ExportDropdown";

interface TimesheetFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  date: string;
  onDateChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  entryType: string;
  onEntryTypeChange: (val: string) => void;
  incompleteOnly: boolean;
  onIncompleteOnlyToggle: (val: boolean) => void;
  onReset: () => void;
}

export function TimesheetFilterBar({
  search,
  onSearchChange,
  date,
  onDateChange,
  status,
  onStatusChange,
  entryType,
  onEntryTypeChange,
  incompleteOnly,
  onIncompleteOnlyToggle,
  onReset,
}: TimesheetFilterBarProps) {
  return (
    <div className="p-4.5 sm:p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search employee by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs h-9 rounded-md bg-surface-subtle/50"
          />
        </div>

        {/* Action Controls & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker
            value={date}
            onChange={onDateChange}
            className="w-38 h-9 text-xs"
            placeholder="Filter date..."
          />

          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-32 h-9 text-xs rounded-md bg-surface-subtle/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-md text-xs">
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Working / Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entryType} onValueChange={onEntryTypeChange}>
            <SelectTrigger className="w-32 h-9 text-xs rounded-md bg-surface-subtle/50">
              <SelectValue placeholder="Entry Type" />
            </SelectTrigger>
            <SelectContent className="rounded-md text-xs">
              <SelectItem value="ALL">All Entries</SelectItem>
              <SelectItem value="AUTOMATIC">Automatic Only</SelectItem>
              <SelectItem value="MANUAL">Manual Only</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={incompleteOnly ? "default" : "outline"}
            size="sm"
            onClick={() => onIncompleteOnlyToggle(!incompleteOnly)}
            className={`h-9 px-3 rounded-md text-xs gap-1.5 font-semibold ${
              incompleteOnly
                ? "bg-warning hover:bg-warning text-white"
                : "text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incomplete</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <ExportDropdown
            filters={{
              search,
              date,
              status: status !== "ALL" ? status : undefined,
              entryType: entryType !== "ALL" ? entryType : undefined,
              incompleteOnly: incompleteOnly ? true : undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
}
