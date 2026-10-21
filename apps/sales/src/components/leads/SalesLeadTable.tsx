"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  DollarSign,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  List as ListIcon,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useGetSalesLeadsQuery,
  useDeleteSalesLeadMutation,
  useConvertSalesLeadMutation,
} from "@/store/api/salesLeadsApi";
import { SalesStageBadge, SalesPriorityBadge } from "@/components/shared/SalesStageBadge";
import { UserAvatar, EmptyState, KpiCard, ConfirmDialog } from "@/components/shared";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  SegmentedTabs,
} from "@zsyio/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SalesLead, SalesStage, SalesPriority } from "@zsyio/types";
import { SALES_STAGE_LABELS, SALES_PRIORITY_LABELS } from "@zsyio/types";
import { toast } from "sonner";

export function SalesLeadTable() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<SalesLead | null>(null);
  const [convertTarget, setConvertTarget] = useState<SalesLead | null>(null);

  const { data, isLoading, isError, refetch } = useGetSalesLeadsQuery({
    search: search || undefined,
    stage: stageFilter !== "ALL" ? stageFilter : undefined,
    priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
    limit: 100,
  });

  const [deleteLead, { isLoading: isDeleting }] = useDeleteSalesLeadMutation();
  const [convertLead, { isLoading: isConverting }] = useConvertSalesLeadMutation();

  const leads = useMemo(() => data?.items ?? [], [data]);

  // Derived KPIs
  const stats = useMemo(() => {
    const total = leads.length;
    const totalVal = leads.reduce((acc, l) => acc + (l.dealValue ? Number(l.dealValue) : 0), 0);
    const wonLeads = leads.filter((l) => l.currentStage === "WON");
    const wonVal = wonLeads.reduce((acc, l) => acc + (l.dealValue ? Number(l.dealValue) : 0), 0);
    const followUpsDue = leads.filter((l) => {
      if (!l.nextFollowUpAt) return false;
      return new Date(l.nextFollowUpAt) <= new Date();
    }).length;

    return { total, totalVal, wonCount: wonLeads.length, wonVal, followUpsDue };
  }, [leads]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLead(deleteTarget.id).unwrap();
      toast.success("Lead deleted successfully");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const handleConvert = async () => {
    if (!convertTarget) return;
    try {
      await convertLead({ id: convertTarget.id }).unwrap();
      toast.success("Client converted to Development Client!");
      setConvertTarget(null);
    } catch {
      toast.error("Failed to convert lead");
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Leads"
          value={stats.total}
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
          variant="primary"
        />
        <KpiCard
          label="Total Pipeline Value"
          value={formatCurrency(stats.totalVal)}
          icon={<DollarSign className="w-4 h-4 text-success" />}
          variant="emerald"
        />
        <KpiCard
          label="Won Deals Value"
          value={formatCurrency(stats.wonVal)}
          subtext={`${stats.wonCount} won`}
          icon={<Sparkles className="w-4 h-4 text-warning" />}
          variant="amber"
        />
        <KpiCard
          label="Follow-ups Due"
          value={stats.followUpsDue}
          subtext={stats.followUpsDue > 0 ? "Requires attention" : "All caught up"}
          icon={<Clock className={`w-4 h-4 ${stats.followUpsDue > 0 ? "text-destructive" : "text-muted-foreground"}`} />}
          variant={stats.followUpsDue > 0 ? "rose" : "default"}
        />
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Input
              placeholder="Search by client, contact, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pr-8"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              {(Object.keys(SALES_STAGE_LABELS) as SalesStage[]).map((stg) => (
                <SelectItem key={stg} value={stg}>
                  {SALES_STAGE_LABELS[stg]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              {(Object.keys(SALES_PRIORITY_LABELS) as SalesPriority[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {SALES_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || stageFilter !== "ALL" || priorityFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStageFilter("ALL");
                setPriorityFilter("ALL");
              }}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <SegmentedTabs<"table" | "grid">
            value={viewMode}
            onChange={setViewMode}
            size="sm"
            tabs={[
              {
                id: "table",
                label: "Table",
                icon: <ListIcon className="w-3.5 h-3.5" />,
              },
              {
                id: "grid",
                label: "Grid",
                icon: <LayoutGrid className="w-3.5 h-3.5" />,
              },
            ]}
          />

          <Link href="/leads/new">
            <Button size="sm" className="h-9">
              + New Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm">Failed to load sales leads</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-10 h-10 text-muted-foreground/60" />}
          title="No sales leads found"
          description={
            search || stageFilter !== "ALL" || priorityFilter !== "ALL"
              ? "Try clearing filters to find more leads"
              : "Get started by creating your first sales lead to track opportunities"
          }
          action={
            <Link href="/leads/new">
              <Button size="sm">+ Create Sales Lead</Button>
            </Link>
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const isOverdue =
              lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date();
            return (
              <div
                key={lead.id}
                className="group relative flex flex-col rounded-lg border border-border/80 bg-card hover:border-primary/40 hover:shadow-md  transition-all duration-200 overflow-hidden p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors truncate block"
                    >
                      {lead.client?.name ?? "-"}
                    </Link>
                    {lead.client?.contactName && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground truncate">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>{lead.client?.contactName}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SalesStageBadge stage={lead.currentStage} size="sm" />
                    <SalesPriorityBadge priority={lead.priority} size="sm" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-semibold text-foreground">
                    <DollarSign className="w-3.5 h-3.5 text-success" />
                    <span>{lead.dealValue ? formatCurrency(lead.dealValue) : "-"}</span>
                  </div>
                  {lead.assignedTo ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UserAvatar
                        user={lead.assignedTo}
                        name={lead.assignedTo.name ?? lead.assignedTo.email}
                        size="xs"
                      />
                      <span className="truncate max-w-[100px]">
                        {lead.assignedTo.name ?? lead.assignedTo.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 italic">Unassigned</span>
                  )}
                </div>

                {lead.nextFollowUpAt && (
                  <div
                    className={`mt-2.5 flex items-center gap-1.5 text-xs ${
                      isOverdue
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>Follow-up: {formatDate(lead.nextFollowUpAt)}</span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                  <Link
                    href={`/leads/${lead.id}?from=leads`}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    View details
                    <ChevronRight className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1">
                    {lead.currentStage === "WON" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConvertTarget(lead)}
                        className="h-7 text-xs text-success hover:text-success hover:bg-success-light"
                      >
                        Convert
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(lead)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-xs  text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Lead / Client</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Next Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {leads.map((lead) => {
                  const isOverdue =
                    lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date();
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/leads/${lead.id}?from=leads`}
                          className="font-medium text-foreground hover:text-primary transition-colors block"
                        >
                          {lead.client?.name ?? "-"}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {lead.client?.contactName && (
                            <span>{lead.client?.contactName}</span>
                          )}
                          {lead.client?.contactEmail && (
                            <>
                              <span>•</span>
                              <span>{lead.client?.contactEmail}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SalesStageBadge stage={lead.currentStage} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SalesPriorityBadge priority={lead.priority} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                        {lead.dealValue ? formatCurrency(lead.dealValue) : "-"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              user={lead.assignedTo}
                              name={lead.assignedTo.name ?? lead.assignedTo.email}
                              size="sm"
                            />
                            <span className="text-xs text-foreground">
                              {lead.assignedTo.name ?? lead.assignedTo.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {lead.nextFollowUpAt ? (
                          <span
                            className={
                              isOverdue
                                ? "text-destructive font-semibold"
                                : "text-muted-foreground"
                            }
                          >
                            {formatDate(lead.nextFollowUpAt)}
                            {isOverdue && " (Overdue)"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {lead.currentStage === "WON" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConvertTarget(lead)}
                              className="h-7 text-xs border-success/30 text-success hover:bg-success-light"
                            >
                              Convert to Dev
                            </Button>
                          )}
                          <Link href={`/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(lead)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Sales Lead"
        description={`Are you sure you want to delete "${deleteTarget?.client?.name ?? "this lead"}"? This will permanently remove the lead and all its activities.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Convert Confirmation Dialog */}
      <ConfirmDialog
        open={!!convertTarget}
        onOpenChange={(open) => !open && setConvertTarget(null)}
        title="Convert to Development Client"
        description={`Converting "${convertTarget?.client?.name ?? "this client"}" will classify them as an active Development Client, granting the project & engineering teams visibility to initiate project delivery.`}
        confirmText="Confirm Conversion"
        variant="primary"
        onConfirm={handleConvert}
        isLoading={isConverting}
      />
    </div>
  );
}
