"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Button,
  Input,
  Label,
  Modal,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SegmentedTabs,
  SearchInput,
  UserAvatar,
  Progress,
} from "@zsyio/ui";
import {
  CalendarOff,
  Clock,
  Clock4,
  CheckCircle2,
  Loader2,
  Save,
  Users2,
  Sliders,
  Edit2,
  AlertCircle,
  Coffee,
  HeartPulse,
  CalendarCheck,
  RotateCcw,
  Sparkles,
  Filter,
  Plus,
  Minus,
} from "lucide-react";
import {
  useGetAdminPoliciesQuery,
  useUpdateAdminPoliciesMutation,
  useGetAllUserLeaveBalancesQuery,
  useAdjustUserLeaveAllocationMutation,
} from "@/store/api/timesheetApi";
import type { LeavePolicyItem } from "@zsyio/types";
import { toast } from "sonner";

interface LeaveCardMeta {
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeClass: string;
  cardBorder: string;
  cardBg: string;
  defaultDescription: string;
}

const LEAVE_TYPE_METAS: Record<string, LeaveCardMeta> = {
  CASUAL: {
    icon: Coffee,
    accentColor: "text-emerald-500 dark:text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    cardBorder: "border-emerald-500/20 hover:border-emerald-500/35",
    cardBg: "bg-emerald-500/[0.02]",
    defaultDescription: "Short-notice unplanned time-off for personal commitments and domestic emergencies.",
  },
  SICK: {
    icon: HeartPulse,
    accentColor: "text-rose-500 dark:text-rose-400",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    cardBorder: "border-rose-500/20 hover:border-rose-500/35",
    cardBg: "bg-rose-500/[0.02]",
    defaultDescription: "Medical recovery leave for acute illness, health appointments, and recovery.",
  },
  EARNED: {
    icon: CalendarCheck,
    accentColor: "text-sky-500 dark:text-sky-400",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    cardBorder: "border-sky-500/20 hover:border-sky-500/35",
    cardBg: "bg-sky-500/[0.02]",
    defaultDescription: "Accrued paid annual vacation days earned through continuous employee tenure.",
  },
  COMPENSATORY: {
    icon: Clock4,
    accentColor: "text-purple-500 dark:text-purple-400",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
    cardBorder: "border-purple-500/20 hover:border-purple-500/35",
    cardBg: "bg-purple-500/[0.02]",
    defaultDescription: "Compensatory time-off credited for hours worked during official holidays or weekends.",
  },
  UNPAID: {
    icon: CalendarOff,
    accentColor: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-border",
    cardBorder: "border-border/80 hover:border-border",
    cardBg: "bg-surface-subtle/30",
    defaultDescription: "Approved leave without salary deduction when all other leave balances are exhausted.",
  },
};

export function AdminLeavePoliciesTab() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = (session?.user as any)?.permissions || [];
  const canManagePolicies =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userPermissions.includes("timesheet:manage");

  // Primary subtab navigation
  const [activeSubTab, setActiveSubTab] = useState<string>("QUOTAS");

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: policiesData, isLoading: isLoadingPolicies } = useGetAdminPoliciesQuery();
  const [updatePolicies, { isLoading: isUpdatingPolicies }] = useUpdateAdminPoliciesMutation();

  const { data: userBalances, isLoading: isLoadingBalances } = useGetAllUserLeaveBalancesQuery({
    year: selectedYear,
  });

  // Local state for editing organization leave quotas
  const [localPolicies, setLocalPolicies] = useState<LeavePolicyItem[]>([]);

  // Local state for editing HR work policies
  const [standardDailyHours, setStandardDailyHours] = useState(8);
  const [halfDayMinimumHours, setHalfDayMinimumHours] = useState(4);
  const [weekendDays, setWeekendDays] = useState("0,6");

  // Filter state for Employee balances tab
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [filterCustomOnly, setFilterCustomOnly] = useState(false);

  // Adjust Employee Allocation Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [selectedLeaveType, setSelectedLeaveType] = useState("CASUAL");
  const [adjustedTotalDays, setAdjustedTotalDays] = useState(12);
  const [adjustmentNotes, setAdjustmentNotes] = useState("");

  const [adjustAllocation, { isLoading: isAdjusting }] = useAdjustUserLeaveAllocationMutation();

  // Synchronize server state to local inputs
  const resetToLoadedSettings = useCallback(() => {
    if (policiesData) {
      setLocalPolicies(policiesData.policies);
      const stdHours = policiesData.settings.standardDailyHours || 8;
      setStandardDailyHours(stdHours);
      // Half-day is always strictly half of the full day target
      setHalfDayMinimumHours(Number((stdHours / 2).toFixed(2)));
      setWeekendDays(policiesData.settings.weekendDays);
    }
  }, [policiesData]);

  useEffect(() => {
    resetToLoadedSettings();
  }, [resetToLoadedSettings]);

  // Handler for standard daily hours that keeps half day locked to 50%
  const handleStandardDailyHoursChange = (val: number) => {
    const validHours = Math.max(1, Math.min(24, val));
    setStandardDailyHours(validHours);
    setHalfDayMinimumHours(Number((validHours / 2).toFixed(2)));
  };

  // Compute dirty / unsaved changes state
  const isDirty = useMemo(() => {
    if (!policiesData) return false;
    if (standardDailyHours !== policiesData.settings.standardDailyHours) return true;
    if (halfDayMinimumHours !== policiesData.settings.halfDayMinimumHours) return true;
    if (weekendDays !== policiesData.settings.weekendDays) return true;

    if (localPolicies.length !== policiesData.policies.length) return true;
    for (let i = 0; i < localPolicies.length; i++) {
      const p1 = localPolicies[i];
      const p2 = policiesData.policies.find((p) => p.leaveType === p1.leaveType);
      if (!p2) return true;
      if (p1.totalDays !== p2.totalDays) return true;
      if (p1.carryForward !== p2.carryForward) return true;
    }
    return false;
  }, [policiesData, localPolicies, standardDailyHours, halfDayMinimumHours, weekendDays]);

  const handlePolicyChange = (leaveType: string, field: keyof LeavePolicyItem, value: any) => {
    setLocalPolicies((prev) =>
      prev.map((p) => (p.leaveType === leaveType ? { ...p, [field]: value } : p))
    );
  };

  const handleSavePoliciesAndSettings = async () => {
    const calculatedHalfDay = Number((standardDailyHours / 2).toFixed(2));

    try {
      await updatePolicies({
        policies: localPolicies,
        settings: {
          standardDailyHours: Number(standardDailyHours),
          halfDayMinimumHours: calculatedHalfDay,
          overtimeThresholdMins: 0,
          weekendDays,
        },
      }).unwrap();
      toast.success("Organization leave quotas and attendance policies saved successfully!");
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e?.data?.error?.message || "Failed to update policies.");
    }
  };

  const handleOpenAdjustModal = (
    userId: string,
    userName: string,
    userEmail: string,
    leaveType: string,
    currentTotal: number
  ) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectedUserEmail(userEmail);
    setSelectedLeaveType(leaveType);
    setAdjustedTotalDays(currentTotal);
    setAdjustmentNotes("");
    setAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      await adjustAllocation({
        userId: selectedUserId,
        leaveType: selectedLeaveType as any,
        year: selectedYear,
        totalDays: Number(adjustedTotalDays),
        notes: adjustmentNotes.trim() || null,
      }).unwrap();
      toast.success(`Leave quota updated for ${selectedUserName}.`);
      setAdjustModalOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e?.data?.error?.message || "Failed to adjust employee quota.");
    }
  };

  // Filtered employees for the Employee Balances subtab
  const filteredBalances = useMemo(() => {
    if (!userBalances) return [];
    return userBalances.filter((item) => {
      const matchesSearch =
        item.user.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        item.user.email.toLowerCase().includes(employeeSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (filterCustomOnly) {
        const hasCustom = item.balances.some((b) => b.isCustom);
        if (!hasCustom) return false;
      }

      return true;
    });
  }, [userBalances, employeeSearch, filterCustomOnly]);

  const customOverridesCount = useMemo(() => {
    if (!userBalances) return 0;
    return userBalances.filter((u) => u.balances.some((b) => b.isCustom)).length;
  }, [userBalances]);

  if (isLoadingPolicies) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground bg-card rounded-2xl border border-border/80 shadow-xs">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="font-medium">Loading organization leave policies and rules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Notification Banner */}
      {!canManagePolicies && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>View-Only Mode:</strong> You do not have permission to modify organization leave quotas or HR policies. Only system administrators can save policy changes or adjust employee quotas.
          </span>
        </div>
      )}

      {/* Subtab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/70">
        <SegmentedTabs
          value={activeSubTab}
          onChange={setActiveSubTab}
          size="sm"
          tabs={[
            {
              id: "QUOTAS",
              label: "Company Quotas & Work Rules",
              icon: <Sliders className="w-3.5 h-3.5" />,
            },
            {
              id: "EMPLOYEES",
              label: `Employee Allocations & Balances (${userBalances?.length || 0})`,
              icon: <Users2 className="w-3.5 h-3.5" />,
            },
          ]}
        />

        {/* Global Save Action on Company Quotas Subtab */}
        {activeSubTab === "QUOTAS" && canManagePolicies && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isDirty && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetToLoadedSettings}
                disabled={isUpdatingPolicies}
                className="h-8 px-2.5 rounded-xl text-xs gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard</span>
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleSavePoliciesAndSettings}
              disabled={isUpdatingPolicies || !isDirty}
              className={`h-8 px-3.5 rounded-xl text-xs font-bold gap-1.5 shadow-xs transition-all ${
                isDirty
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25 ring-2 ring-primary/20"
                  : "opacity-60"
              }`}
            >
              {isUpdatingPolicies ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Changes</span>
            </Button>
          </div>
        )}
      </div>

      {/* SUBTAB 1: Company Policies & Work Rules */}
      {activeSubTab === "QUOTAS" && (
        <div className="space-y-6">
          {/* Work Schedule Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Standard Attendance & Work Schedule
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground pl-9">
                  Define daily shift targets, half-day absence cutoffs, and weekly non-working off days.
                </p>
              </div>

              <div className="pl-9 sm:pl-0 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle border border-border/60 text-foreground font-mono font-semibold">
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  {weekendDays === "0,6" ? "40 hrs/week · 5 days" : "48 hrs/week · 6 days"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Shift */}
              <div className="p-4 rounded-xl border border-border/80 bg-surface-subtle/30 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="standard-hours" className="text-xs font-bold text-foreground">
                    Full Shift Daily Target
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Standard daily duration required for complete attendance.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
                    <button
                      type="button"
                      disabled={!canManagePolicies || standardDailyHours <= 1}
                      onClick={() => handleStandardDailyHoursChange(Math.max(1, standardDailyHours - 0.5))}
                      className="h-8 w-8 flex items-center justify-center hover:bg-surface-subtle text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <Input
                      id="standard-hours"
                      type="number"
                      min={1}
                      max={24}
                      step={0.5}
                      value={standardDailyHours}
                      disabled={!canManagePolicies}
                      onChange={(e) => handleStandardDailyHoursChange(parseFloat(e.target.value) || 8)}
                      className="w-14 h-8 text-center text-xs font-mono font-bold border-0 shadow-none focus-visible:ring-0 p-0"
                    />
                    <button
                      type="button"
                      disabled={!canManagePolicies || standardDailyHours >= 24}
                      onClick={() => handleStandardDailyHoursChange(Math.min(24, standardDailyHours + 0.5))}
                      className="h-8 w-8 flex items-center justify-center hover:bg-surface-subtle text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">hrs / day</span>
                </div>
              </div>

              {/* Half Day Cutoff (Locked to 50% of Full Shift) */}
              <div className="p-4 rounded-xl border border-border/80 bg-surface-subtle/30 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      Half-Day Minimum Cutoff
                    </Label>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.2 rounded">
                      50% of Shift
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Always calculated as 50% of full shift target.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-border/80 bg-card/70 shadow-2xs px-3.5 py-1.5 min-w-[70px] justify-center">
                    <span className="text-xs font-mono font-bold text-foreground">
                      {halfDayMinimumHours}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">hrs / day</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ({standardDailyHours}h ÷ 2)
                  </span>
                </div>
              </div>

              {/* Weekend Off Days */}
              <div className="p-4 rounded-xl border border-border/80 bg-surface-subtle/30 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">
                    Weekly Non-Working Days
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Calendar days excluded from work requirements and leaves.
                  </p>
                </div>

                <div className={!canManagePolicies ? "pointer-events-none opacity-60" : ""}>
                  <SegmentedTabs
                    value={weekendDays}
                    onChange={setWeekendDays}
                    size="sm"
                    fullWidth
                    tabs={[
                      { id: "0,6", label: "Sat & Sun (5-Day)" },
                      { id: "0", label: "Sunday Only (6-Day)" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Annual Leave Entitlements */}
          <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-5">
            <div className="space-y-0.5 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CalendarOff className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Organization Annual Leave Entitlements
                </h3>
              </div>
              <p className="text-xs text-muted-foreground pl-9">
                Standard baseline leave quotas credited to full-time employees per calendar year.
              </p>
            </div>

            {/* Quotas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localPolicies.map((policy) => {
                const meta = LEAVE_TYPE_METAS[policy.leaveType] || LEAVE_TYPE_METAS.UNPAID;
                const Icon = meta.icon;

                return (
                  <div
                    key={policy.leaveType}
                    className={`p-4 rounded-2xl border transition-all duration-200 bg-card ${meta.cardBorder} space-y-4 shadow-2xs hover:shadow-xs`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.cardBg} border border-border/60`}>
                          <Icon className={`w-4 h-4 ${meta.accentColor}`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground leading-tight">
                            {policy.label}
                          </h4>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {policy.leaveType}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${meta.badgeClass}`}>
                        Annual
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed min-h-[32px]">
                      {policy.description || meta.defaultDescription}
                    </p>

                    {/* Quota Stepper */}
                    <div className="pt-2 border-t border-border/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`quota-${policy.leaveType}`}
                          className="text-xs font-semibold text-muted-foreground"
                        >
                          Annual Allowance
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center rounded-lg border border-border bg-surface-subtle shadow-2xs overflow-hidden">
                            <button
                              type="button"
                              disabled={!canManagePolicies || policy.totalDays <= 0}
                              onClick={() =>
                                handlePolicyChange(
                                  policy.leaveType,
                                  "totalDays",
                                  Math.max(0, policy.totalDays - 1)
                                )
                              }
                              className="h-7 w-7 flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <Input
                              id={`quota-${policy.leaveType}`}
                              type="number"
                              min={0}
                              max={365}
                              step={0.5}
                              value={policy.totalDays}
                              disabled={!canManagePolicies}
                              onChange={(e) =>
                                handlePolicyChange(
                                  policy.leaveType,
                                  "totalDays",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-12 h-7 text-center text-xs font-mono font-bold border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent"
                            />
                            <button
                              type="button"
                              disabled={!canManagePolicies || policy.totalDays >= 365}
                              onClick={() =>
                                handlePolicyChange(
                                  policy.leaveType,
                                  "totalDays",
                                  Math.min(365, policy.totalDays + 1)
                                )
                              }
                              className="h-7 w-7 flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <span className="text-xs font-semibold text-foreground">days</span>
                        </div>
                      </div>

                      {/* Carry Forward Toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground block text-[11px]">
                            Carry Forward
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {policy.carryForward ? "Rolls over into next year" : "Lapses on Dec 31"}
                          </span>
                        </div>

                        <label
                          className={`relative inline-flex items-center ${
                            canManagePolicies ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={policy.carryForward}
                            disabled={!canManagePolicies}
                            onChange={(e) =>
                              handlePolicyChange(policy.leaveType, "carryForward", e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Bottom Save Action on Unsaved Changes */}
          {isDirty && canManagePolicies && (
            <div className="sticky bottom-4 z-40 p-4 rounded-2xl bg-surface-elevated/95 backdrop-blur-md border border-primary/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                <span className="font-medium text-foreground">
                  You have unsaved changes to organization leave quotas and work rules.
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToLoadedSettings}
                  disabled={isUpdatingPolicies}
                  className="rounded-xl text-xs h-8"
                >
                  Discard
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSavePoliciesAndSettings}
                  disabled={isUpdatingPolicies}
                  className="rounded-xl text-xs font-bold gap-1.5 h-8 shadow-xs"
                >
                  {isUpdatingPolicies ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save All Policies</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Employee Balances & Custom Allocations */}
      {activeSubTab === "EMPLOYEES" && (
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-5">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Users2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Employee Specific Leave Allocations & Balances
                </h3>
              </div>
              <p className="text-xs text-muted-foreground pl-9">
                Monitor individual balance utilization for {selectedYear} and apply individual overrides.
              </p>
            </div>

            <div className="pl-9 md:pl-0 flex items-center gap-3 flex-wrap">
              {/* Year Selector */}
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

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <SearchInput
                value={employeeSearch}
                onChange={setEmployeeSearch}
                onClear={() => setEmployeeSearch("")}
                placeholder="Search employee name or email..."
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setFilterCustomOnly(!filterCustomOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  filterCustomOnly
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 shadow-2xs"
                    : "bg-surface-subtle hover:bg-surface-subtle/80 text-muted-foreground border-border/60"
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>Custom Overrides Only</span>
                {customOverridesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500 text-white font-mono font-bold">
                    {customOverridesCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Balances Table */}
          {isLoadingBalances ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading employee leave balances...</span>
            </div>
          ) : filteredBalances.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground bg-surface-subtle/30 rounded-xl border border-dashed border-border/80">
              {employeeSearch || filterCustomOnly
                ? "No employees match the specified filters."
                : "No active employee records found."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-surface-subtle/60 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Casual Leave (CL)</th>
                    <th className="py-3 px-4">Sick Leave (SL)</th>
                    <th className="py-3 px-4">Earned Leave (EL)</th>
                    <th className="py-3 px-4">Compensatory</th>
                    {canManagePolicies && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredBalances.map((item) => (
                    <tr key={item.user.id} className="hover:bg-surface-elevated/70 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            user={{ name: item.user.name, email: item.user.email }}
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-foreground">{item.user.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {item.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Leave Categories */}
                      {["CASUAL", "SICK", "EARNED", "COMPENSATORY"].map((type) => {
                        const bal = item.balances.find((b) => b.type === type);
                        if (!bal) {
                          return (
                            <td key={type} className="py-3 px-4 text-muted-foreground">
                              -
                            </td>
                          );
                        }

                        const usedPercent = (bal.used / Math.max(1, bal.total)) * 100;
                        const progressVariant =
                          usedPercent >= 100
                            ? "destructive"
                            : usedPercent >= 75
                            ? "warning"
                            : "success";

                        return (
                          <td key={type} className="py-3 px-4 whitespace-nowrap">
                            <div className="space-y-1.5 min-w-[100px]">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-mono flex items-baseline gap-1">
                                  <span className="font-bold text-foreground text-xs">
                                    {bal.available}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    / {bal.total}d
                                  </span>
                                </div>

                                {bal.isCustom && (
                                  <span
                                    className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25"
                                    title="Custom quota allocation applied"
                                  >
                                    Custom
                                  </span>
                                )}
                              </div>

                              <Progress
                                value={usedPercent}
                                size="xs"
                                variant={progressVariant}
                                className="bg-muted/60"
                              />

                              <div className="text-[10px] text-muted-foreground">
                                {bal.used} used
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      {/* Action */}
                      {canManagePolicies && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const clBal = item.balances.find((b) => b.type === "CASUAL");
                              handleOpenAdjustModal(
                                item.user.id,
                                item.user.name,
                                item.user.email,
                                "CASUAL",
                                clBal ? clBal.total : 12
                              );
                            }}
                            className="h-7 px-2.5 rounded-lg text-xs font-semibold gap-1 text-foreground hover:text-primary hover:border-primary/40"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Adjust Quota</span>
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Adjust Individual Allocation Modal */}
      {adjustModalOpen && (
        <Modal
          open={adjustModalOpen}
          onOpenChange={setAdjustModalOpen}
          title="Adjust Employee Leave Quota"
          icon={<Sliders className="w-5 h-5 text-purple-500" />}
          iconVariant="indigo"
          size="md"
        >
          <form onSubmit={handleSaveAdjustment} className="space-y-4 pt-1">
            {/* Employee Target Summary */}
            <div className="p-3 rounded-xl bg-surface-subtle/70 border border-border/70 flex items-center gap-3">
              <UserAvatar
                user={{ name: selectedUserName, email: selectedUserEmail }}
                size="md"
              />
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {selectedUserName}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono block">
                  {selectedUserEmail}
                </span>
              </div>
            </div>

            {/* Leave Category Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Leave Category</Label>
              <Select
                value={selectedLeaveType}
                onValueChange={(val) => {
                  setSelectedLeaveType(val);
                  const userRecord = userBalances?.find((u) => u.user.id === selectedUserId);
                  const bal = userRecord?.balances.find((b) => b.type === val);
                  if (bal) setAdjustedTotalDays(bal.total);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASUAL">Casual Leave (CL)</SelectItem>
                  <SelectItem value="SICK">Sick Leave (SL)</SelectItem>
                  <SelectItem value="EARNED">Earned / Annual Leave (EL)</SelectItem>
                  <SelectItem value="COMPENSATORY">Compensatory Off (Comp-Off)</SelectItem>
                  <SelectItem value="UNPAID">Leave Without Pay (LWP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quota Input with Steppers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-total-days" className="text-xs font-semibold">
                  Custom Quota for {selectedYear} (Days)
                </Label>
                {(() => {
                  const standardPolicy = localPolicies.find((p) => p.leaveType === selectedLeaveType);
                  return standardPolicy ? (
                    <span className="text-[10px] text-muted-foreground">
                      Company baseline: <strong>{standardPolicy.totalDays}d</strong>
                    </span>
                  ) : null;
                })()}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    disabled={adjustedTotalDays <= 0}
                    onClick={() => setAdjustedTotalDays((d) => Math.max(0, d - 1))}
                    className="h-9 w-9 flex items-center justify-center hover:bg-surface-subtle text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <Input
                    id="custom-total-days"
                    type="number"
                    min={0}
                    max={365}
                    step={0.5}
                    value={adjustedTotalDays}
                    onChange={(e) => setAdjustedTotalDays(parseFloat(e.target.value) || 0)}
                    required
                    className="w-16 h-9 text-center text-sm font-mono font-bold border-0 shadow-none focus-visible:ring-0 p-0"
                  />
                  <button
                    type="button"
                    disabled={adjustedTotalDays >= 365}
                    onClick={() => setAdjustedTotalDays((d) => Math.min(365, d + 1))}
                    className="h-9 w-9 flex items-center justify-center hover:bg-surface-subtle text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">days</span>
              </div>
            </div>

            {/* Note / Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="adjust-notes" className="text-xs font-semibold">
                Adjustment Reason / Note (Optional)
              </Label>
              <Textarea
                id="adjust-notes"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="e.g. Special executive allowance, joining probation adjustment, tenure bonus"
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isAdjusting}
                className="rounded-xl text-xs font-bold gap-1.5 shadow-xs"
              >
                {isAdjusting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Save Allocation</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
