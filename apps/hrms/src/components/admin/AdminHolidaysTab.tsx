"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Button,
  EmptyState,
  ConfirmDialog,
  SegmentedTabs,
} from "@zsyio/ui";
import {
  CalendarHeart,
  Plus,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  useGetHolidaysQuery,
  useDeleteHolidayMutation,
} from "@/store/api/timesheetApi";
import { useTimeZone } from "@/context/TimeZoneContext";
import type { CompanyHoliday } from "@zsyio/types";
import { ManageHolidayModal } from "./modals/ManageHolidayModal";
import { toast } from "sonner";

export function AdminHolidaysTab() {
  const { formatDate } = useTimeZone();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = (session?.user as any)?.permissions || [];
  const canManageHolidays =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userPermissions.includes("timesheet:manage");

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);

  const [deletingHoliday, setDeletingHoliday] = useState<CompanyHoliday | null>(null);

  const { data, isLoading } = useGetHolidaysQuery({ year: selectedYear });
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  const holidays = data?.holidays || [];

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
      toast.success(`Holiday "${deletingHoliday.name}" deleted successfully.`);
      setDeletingHoliday(null);
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e?.data?.error?.message || "Failed to delete holiday.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-lg bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-3">
            <CalendarHeart className="w-5 h-5 text-notion-blue-fg" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Company Holiday Schedule
              </h3>
              <p className="text-xs text-muted-foreground">
                {holidays.length} holiday{holidays.length !== 1 ? "s" : ""} configured for {selectedYear}
              </p>
            </div>
          </div>

          {/* Year Buttons */}
          <div className="pl-2 sm:border-l border-border/70">
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
          </div>
        </div>

        {canManageHolidays && (
          <Button
            variant="default"
            size="sm"
            onClick={handleCreate}
            className="rounded-md text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Holiday</span>
          </Button>
        )}
      </div>

      {/* Holidays List */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center gap-2.5 text-xs text-muted-foreground bg-card rounded-lg border border-border/80 shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading holidays for {selectedYear}...</span>
        </div>
      ) : holidays.length === 0 ? (
        <div className="p-8 rounded-lg bg-card border border-border/80 shadow-xs">
          <EmptyState
            title={`No Holidays Configured for ${selectedYear}`}
            description={
              canManageHolidays
                ? "Click 'Add Holiday' to define official company off-days or festive celebrations."
                : "No company holidays have been scheduled for this calendar year."
            }
            icon={<CalendarHeart className="w-8 h-8 text-muted-foreground" />}
            action={
              canManageHolidays ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreate}
                  className="mt-2 rounded-md text-xs font-semibold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Holiday</span>
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="rounded-lg bg-card border border-border/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-subtle/50 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Date & Day</th>
                  <th className="py-3 px-4">Holiday Name</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Timeline</th>
                  {canManageHolidays && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {holidays.map((h) => {
                  const isToday = h.daysRemaining === 0;
                  const isPast = h.daysRemaining < 0;

                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-surface-elevated/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {formatDate(h.date)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {h.dayOfWeek}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          {h.name}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {h.isOptional ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-notion-purple-fg/10 text-notion-purple-fg border border-notion-purple-fg/25">
                            Optional / Restricted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-notion-blue-fg/10 text-notion-blue-fg border border-notion-blue-fg/25">
                            Mandatory Public
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {h.description || "-"}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isToday ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                            Today
                          </span>
                        ) : isPast ? (
                          <span className="text-xs text-muted-foreground/60 font-mono">
                            Passed
                          </span>
                        ) : (
                          <span className="text-xs text-notion-blue-fg font-semibold font-mono">
                            In {h.daysRemaining} day{h.daysRemaining !== 1 ? "s" : ""}
                          </span>
                        )}
                      </td>

                      {canManageHolidays && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(h)}
                              className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-foreground"
                              title="Edit Holiday"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingHoliday(h)}
                              className="h-7 w-7 p-0 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete Holiday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Holiday Modal */}
      {modalOpen && (
        <ManageHolidayModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          holiday={editingHoliday}
          defaultYear={selectedYear}
          existingHolidays={holidays}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingHoliday)}
        onOpenChange={(open) => !open && setDeletingHoliday(null)}
        title={`Delete Holiday "${deletingHoliday?.name}"?`}
        description="Are you sure you want to permanently remove this holiday from the company calendar? This action cannot be undone."
        variant="destructive"
        confirmText="Delete Holiday"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
