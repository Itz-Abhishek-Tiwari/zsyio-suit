"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { PageHeader, SegmentedTabs, EmptyState, Button, ConfirmDialog } from "@zsyio/ui";
import {
  CalendarHeart,
  Loader2,
  PartyPopper,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  useGetHolidaysQuery,
  useDeleteHolidayMutation,
} from "@/store/api/timesheetApi";
import { useTimeZone } from "@/context/TimeZoneContext";
import type { CompanyHoliday } from "@zsyio/types";
import { ManageHolidayModal } from "@/components/admin/modals/ManageHolidayModal";
import { toast } from "sonner";

export default function HolidaysPage() {
  const { formatDate } = useTimeZone();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isSuperAdminOrAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filterType, setFilterType] = useState<string>("ALL");

  // Admin holiday modal & delete dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<CompanyHoliday | null>(null);

  const { data, isLoading } = useGetHolidaysQuery({ year: selectedYear });
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  const holidays = useMemo(() => data?.holidays || [], [data?.holidays]);
  const upcoming = data?.upcoming;

  const filteredHolidays = useMemo(() => {
    if (filterType === "MANDATORY") {
      return holidays.filter((h) => !h.isOptional);
    }
    if (filterType === "OPTIONAL") {
      return holidays.filter((h) => h.isOptional);
    }
    return holidays;
  }, [holidays, filterType]);

  const handleCreate = () => {
    setEditingHoliday(null);
    setModalOpen(true);
  };

  const handleEdit = (holiday: CompanyHoliday) => {
    setEditingHoliday(holiday);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHoliday) return;
    try {
      await deleteHoliday(deletingHoliday.id).unwrap();
      toast.success(`Holiday "${deletingHoliday.name}" deleted.`);
      setDeletingHoliday(null);
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e?.data?.error?.message || "Failed to delete holiday.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Company Schedule"
        title="Annual Holiday Calendar"
        titleIcon={<CalendarHeart className="w-5 h-5 text-sky-500" />}
        description={`Official public holidays, national commemorations, and optional festive off-days for ${selectedYear}.`}
        borderBottom
        actions={
          isSuperAdminOrAdmin ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleCreate}
              className="rounded-xl text-xs font-bold gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Holiday</span>
            </Button>
          ) : undefined
        }
      />

      {/* Featured Upcoming Holiday Banner */}
      {upcoming && (
        <div className="relative overflow-hidden rounded-lg border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-card to-surface-elevated p-6 shadow-xs">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  {upcoming.daysRemaining === 0
                    ? "Today's Holiday!"
                    : upcoming.daysRemaining === 1
                    ? "Tomorrow!"
                    : `In ${upcoming.daysRemaining} Days`}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">Next Upcoming Holiday</span>
              </div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                {upcoming.name}
              </h2>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {upcoming.dayOfWeek}, {formatDate(upcoming.date)} - {upcoming.description}
              </p>
            </div>

            <div className="w-12 h-12 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400 shadow-xs">
              <PartyPopper className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Year Selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs
          value={filterType}
          onChange={setFilterType}
          size="sm"
          tabs={[
            { id: "ALL", label: `All Holidays (${holidays.length})` },
            {
              id: "MANDATORY",
              label: `Mandatory (${holidays.filter((h) => !h.isOptional).length})`,
            },
            {
              id: "OPTIONAL",
              label: `Optional / Restricted (${holidays.filter((h) => h.isOptional).length})`,
            },
          ]}
        />

        <div className="flex items-center gap-2">
          <SegmentedTabs
            value={String(selectedYear)}
            onChange={(y) => setSelectedYear(Number(y))}
            size="sm"
            tabs={[
              { id: String(currentYear - 1), label: String(currentYear - 1) },
              { id: String(currentYear), label: String(currentYear) },
              { id: String(currentYear + 1), label: String(currentYear + 1) },
            ]}
          />

          {isSuperAdminOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreate}
              className="h-8 px-2.5 rounded-xl text-xs font-semibold gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </Button>
          )}
        </div>
      </div>

      {/* Holidays List */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-card rounded-lg border border-border/80 shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading holiday calendar...</span>
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="p-8 rounded-lg bg-card border border-border/80 shadow-xs">
          <EmptyState
            title="No Holidays Found"
            description="No matching holidays found for the selected category."
            icon={<CalendarHeart className="w-8 h-8 text-muted-foreground" />}
            action={
              isSuperAdminOrAdmin ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreate}
                  className="mt-2 rounded-md text-xs font-bold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Holiday</span>
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredHolidays.map((holiday) => {
            const isPast = holiday.daysRemaining < 0;
            const isToday = holiday.daysRemaining === 0;

            return (
              <div
                key={holiday.id}
                className={`p-4 rounded-lg border transition-all flex items-start justify-between gap-3 shadow-2xs group ${
                  isToday
                    ? "bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/20"
                    : isPast
                    ? "bg-surface-subtle/30 border-border/60 opacity-70"
                    : "bg-card border-border/80 hover:border-primary/30 hover:bg-surface-subtle/50"
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-foreground truncate">
                      {holiday.name}
                    </span>

                    {holiday.isOptional ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:text-purple-300">
                        Optional
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        Mandatory
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground" suppressHydrationWarning>
                    <span className="font-semibold text-foreground">{formatDate(holiday.date)}</span>
                    <span>•</span>
                    <span>{holiday.dayOfWeek}</span>
                  </div>

                  {holiday.description && (
                    <p className="text-[11px] text-muted-foreground pt-0.5">
                      {holiday.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  {isToday ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Today
                    </span>
                  ) : isPast ? (
                    <span className="text-[11px] font-mono text-muted-foreground/60">
                      Completed
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-subtle text-foreground border border-border/70">
                      In {holiday.daysRemaining}d
                    </span>
                  )}

                  {/* Super Admin & Admin Edit / Delete Actions */}
                  {isSuperAdminOrAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(holiday)}
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Edit Holiday"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingHoliday(holiday)}
                        className="h-7 w-7 p-0 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Holiday Modal */}
      {modalOpen && (
        <ManageHolidayModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          holiday={editingHoliday}
          defaultYear={selectedYear}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingHoliday)}
        onOpenChange={(open) => !open && setDeletingHoliday(null)}
        title={`Delete Holiday "${deletingHoliday?.name}"?`}
        description="Are you sure you want to delete this company holiday? It will be removed from the organization attendance schedule."
        variant="destructive"
        confirmText="Delete Holiday"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
