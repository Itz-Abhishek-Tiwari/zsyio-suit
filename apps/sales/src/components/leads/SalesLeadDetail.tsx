"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { can } from "@zsyio/auth/permissions";
import {
  Building2,
  Mail,
  Phone,
  User2,
  Globe,
  ArrowLeft,
  Edit2,
  Trash2,
  Sparkles,
  AlertTriangle,
  Plus,
  History,
  Calendar,
  Euro,
  Percent,
  Check,
  ExternalLink,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  useGetSalesLeadQuery,
  useMoveSalesLeadMutation,
  useConvertSalesLeadMutation,
  useDeleteSalesLeadMutation,
} from "@/store/api/salesLeadsApi";
import { SalesStageBadge } from "@/components/shared/SalesStageBadge";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { SalesLeadForm } from "./SalesLeadForm";
import {
  Button,
  Modal,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  UserAvatar,
  KanbanIdentifierBadge,
  KanbanPriorityBadge,
  KanbanDueDateBadge,
  ConfirmDialog,
} from "@zsyio/ui";
import {
  formatCurrency,
  formatDate,
  formatLeadId,
  getInitials,
  cn,
} from "@/lib/utils";
import type { SalesStage } from "@zsyio/types";
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  SALES_STAGE_FLOW,
} from "@zsyio/types";
import { toast } from "sonner";

const PIPELINE_STEPPER_STAGES: readonly SalesStage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
];

interface SalesLeadDetailProps {
  leadId: string;
}

export function SalesLeadDetail({ leadId }: SalesLeadDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Contextual Return Navigation
  const fromParam = searchParams.get("from");
  const backHref =
    fromParam === "kanban" ? "/kanban" : fromParam === "dashboard" ? "/" : "/leads";
  const backLabel =
    fromParam === "kanban"
      ? "Kanban Board"
      : fromParam === "dashboard"
      ? "Sales Dashboard"
      : "All Leads";

  const { data: lead, isLoading, isError, refetch } = useGetSalesLeadQuery(leadId);
  const { data: session } = useSession();
  const role = session?.user?.role;
  const permissions = session?.user?.permissions;

  const canEdit = can(role, "sales:edit", permissions);
  const canDelete = can(role, "sales:delete", permissions);
  const canConvert = can(role, "sales:convert", permissions);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);

  const [moveLead, { isLoading: isMoving }] = useMoveSalesLeadMutation();
  const [convertLead, { isLoading: isConverting }] = useConvertSalesLeadMutation();
  const [deleteLead, { isLoading: isDeleting }] = useDeleteSalesLeadMutation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-sm font-semibold text-foreground">Failed to load lead details</p>
        <p className="text-xs text-muted-foreground">The requested lead could not be found or retrieved.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-lg mt-2">
          Retry
        </Button>
      </div>
    );
  }

  const handleStageChange = async (newStage: SalesStage) => {
    if (newStage === lead.currentStage) return;
    try {
      await moveLead({ id: lead.id, stageKey: newStage }).unwrap();
      toast.success(`Stage moved to ${SALES_STAGE_LABELS[newStage]}`);
    } catch {
      toast.error("Failed to update stage");
    }
  };

  const handleConvert = async () => {
    try {
      await convertLead({ id: lead.id }).unwrap();
      toast.success("Client moved to Development successfully!");
      setIsConvertDialogOpen(false);
      refetch();
    } catch {
      toast.error("Failed to move client to Development");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLead(lead.id).unwrap();
      toast.success("Lead deleted");
      router.push(backHref);
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const isLost = lead.currentStage === "LOST";
  const isDevClient = lead.client?.clientType === "DEVELOPMENT";
  const currentStageIndex = PIPELINE_STEPPER_STAGES.indexOf(lead.currentStage);
  const companyInitials = getInitials(lead.client?.name);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Contextual Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="p-2 rounded-lg border border-border/80 bg-card hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shadow-2xs"
            title={`Return to ${backLabel}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              href={backHref}
              className="hover:text-foreground hover:underline transition-colors font-medium"
            >
              {backLabel}
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold font-mono">
              {formatLeadId(lead.id)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Stage Dropdown */}
          {canEdit && (
            <Select
              value={lead.currentStage}
              onValueChange={(val) => handleStageChange(val as SalesStage)}
              disabled={isMoving || !canEdit}
            >
              <SelectTrigger className="h-9 w-[155px] text-xs rounded-lg font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALES_STAGE_FLOW.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: SALES_STAGE_COLORS[s] }}
                      />
                      <span>{SALES_STAGE_LABELS[s]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Move to Dev Client button */}
          {!isDevClient ? (
            <Button
              size="sm"
              disabled={!canConvert}
              onClick={() => canConvert && setIsConvertDialogOpen(true)}
              title={!canConvert ? "Requires Sales Manager or Admin permission to move this client to Dev" : "Promote client into Zsyio Flow Development"}
              className={cn(
                "h-9 gap-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all",
                canConvert
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Move to Dev</span>
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>Dev Client</span>
            </span>
          )}

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="h-9 gap-1.5 rounded-lg text-xs font-semibold border-border/80 hover:bg-surface-subtle"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-9 w-9 p-0 rounded-lg text-destructive hover:bg-destructive/10 border-destructive/20"
              title="Delete lead"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* 2. Hero Opportunity Profile Card */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-extrabold text-lg shrink-0 shadow-2xs">
              {companyInitials}
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <KanbanIdentifierBadge id={formatLeadId(lead.id)} />
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate">
                  {lead.client?.name ?? "Sales Opportunity"}
                </h1>
                <SalesStageBadge stage={lead.currentStage} size="sm" />
                <KanbanPriorityBadge priority={lead.priority} />
                {isDevClient && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Dev Client
                  </span>
                )}
              </div>

              {/* Subtitle Contact Information */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                {lead.client?.contactName && (
                  <span className="flex items-center gap-1.5 text-foreground/90 font-medium">
                    <User2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {lead.client.contactName}
                  </span>
                )}
                {lead.client?.contactEmail && (
                  <a
                    href={`mailto:${lead.client.contactEmail}`}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {lead.client.contactEmail}
                  </a>
                )}
                {lead.client?.contactPhone && (
                  <a
                    href={`tel:${lead.client.contactPhone}`}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {lead.client.contactPhone}
                  </a>
                )}
                {lead.client?.domain && (
                  <a
                    href={
                      lead.client.domain.startsWith("http")
                        ? lead.client.domain
                        : `https://${lead.client.domain}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {lead.client.domain}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Pipeline Stage Progression Stepper */}
        {!isLost && (
          <div className="border-t border-border/60 pt-5">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
              {PIPELINE_STEPPER_STAGES.map((stageKey, idx) => {
                const isCurrent = lead.currentStage === stageKey;
                const isCompleted = currentStageIndex > idx;
                const stageColor = SALES_STAGE_COLORS[stageKey];

                return (
                  <button
                    key={stageKey}
                    type="button"
                    disabled={!canEdit || isMoving}
                    onClick={() => canEdit && handleStageChange(stageKey)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0",
                      canEdit ? "cursor-pointer" : "cursor-default opacity-70",
                      isCurrent
                        ? "bg-primary/10 text-primary border-primary/40 shadow-2xs font-bold"
                        : isCompleted
                        ? "bg-muted/40 text-foreground/80 border-border/60 hover:bg-muted"
                        : "bg-surface-subtle/40 text-muted-foreground border-transparent hover:border-border/60 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                        isCurrent
                          ? "text-white"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                      style={isCurrent ? { backgroundColor: stageColor } : undefined}
                    >
                      {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                    </span>
                    <span>{SALES_STAGE_LABELS[stageKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. KPI Highlights (4 Tokenized Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Deal Value */}
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Deal Value
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Euro className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-foreground tracking-tight block">
              {lead.dealValue ? formatCurrency(lead.dealValue) : "-"}
            </span>
            <span className="text-[11px] text-muted-foreground">Projected revenue</span>
          </div>
        </div>

        {/* Win Probability */}
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Win Probability
            </span>
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold font-mono text-foreground tracking-tight block">
              {lead.probability !== null && lead.probability !== undefined
                ? `${lead.probability}%`
                : "-"}
            </span>
            <span className="text-[11px] text-muted-foreground">Confidence level</span>
          </div>
        </div>

        {/* Expected Close */}
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Expected Close
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block">
              {lead.expectedCloseAt ? formatDate(lead.expectedCloseAt) : "Not set"}
            </span>
            <span className="text-[11px] text-muted-foreground">Target closing date</span>
          </div>
        </div>

        {/* Assigned Salesperson */}
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Assigned Rep
            </span>
            <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0">
              <User2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lead.assignedTo ? (
              <>
                <UserAvatar user={lead.assignedTo} size="xs" />
                <span className="text-xs font-bold text-foreground truncate">
                  {lead.assignedTo.name ?? lead.assignedTo.email}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (1 col): Lead & Account Attributes */}
        <div className="space-y-6">
          {/* Account Profile Card */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </span>
              <div>
                <h2 className="text-xs font-bold text-foreground">Contact Channels</h2>
                <p className="text-[10px] text-muted-foreground">Key communication touchpoints</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Contact Person:</span>
                <span className="font-semibold text-foreground truncate">
                  {lead.client?.contactName || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Email:</span>
                {lead.client?.contactEmail ? (
                  <a
                    href={`mailto:${lead.client.contactEmail}`}
                    className="text-primary hover:underline truncate font-medium"
                  >
                    {lead.client.contactEmail}
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Phone:</span>
                {lead.client?.contactPhone ? (
                  <a
                    href={`tel:${lead.client.contactPhone}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {lead.client.contactPhone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Domain:</span>
                {lead.client?.domain ? (
                  <a
                    href={
                      lead.client.domain.startsWith("http")
                        ? lead.client.domain
                        : `https://${lead.client.domain}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate font-medium"
                  >
                    {lead.client.domain}
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
          </div>

          {/* PMS Development Integration Card */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h2 className="text-xs font-bold text-foreground">Development Status</h2>
                  <p className="text-[10px] text-muted-foreground">PMS Client Roster Sync</p>
                </div>
              </div>
              {isDevClient ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  In Dev
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/50 border border-border/60 px-2 py-0.5 rounded-full">
                  Sales Only
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isDevClient
                ? "This client is active in Zsyio Flow. Engineering and project teams can view their products, specifications, and tasks."
                : "This client is isolated to the Sales CRM pipeline. When ready for engineering onboarding, move them to Development."}
            </p>

            {!isDevClient ? (
              <Button
                size="sm"
                disabled={!canConvert}
                onClick={() => canConvert && setIsConvertDialogOpen(true)}
                title={!canConvert ? "Requires Sales Manager or Admin permission to move this client to Dev" : "Promote client into Zsyio Flow Development"}
                className={cn(
                  "w-full h-9 gap-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all",
                  canConvert
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Move to Development Clients</span>
              </Button>
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                <span className="text-muted-foreground">PMS Roster:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Synced with Dev Clients
                </span>
              </div>
            )}
          </div>

          {/* Deal Meta Details Card */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <span className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <div>
                <h2 className="text-xs font-bold text-foreground">Deal Parameters</h2>
                <p className="text-[10px] text-muted-foreground">Source and timeline data</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Pipeline</span>
                <span className="font-semibold text-foreground">
                  {lead.pipeline?.name || "Default Pipeline"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Lead Source</span>
                <span className="font-medium text-foreground">
                  {lead.leadSource || "Direct"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Next Follow-up</span>
                <div className="flex items-center gap-1.5">
                  <KanbanDueDateBadge dueDate={lead.nextFollowUpAt} />
                  <span className="font-medium text-foreground">
                    {lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : "None"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Last Contact</span>
                <span className="font-medium text-foreground">
                  {lead.lastContactAt ? formatDate(lead.lastContactAt) : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-foreground">
                  {formatDate(lead.createdAt)}
                </span>
              </div>
            </div>

            {lead.client?.notes && (
              <div className="pt-2 border-t border-border/40">
                <span className="text-xs font-bold text-muted-foreground block mb-1.5">
                  Internal Notes
                </span>
                <p className="text-xs text-foreground bg-muted/30 border border-border/60 p-3 rounded-lg whitespace-pre-wrap leading-relaxed">
                  {lead.client.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2 cols): Activities & History Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <History className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Activities & Audit History
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Chronological interaction history, communications, and pipeline audit logs.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsActivityOpen(true)}
              className="h-9 px-3.5 gap-1.5 text-xs font-semibold rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Activity</span>
            </Button>
          </div>

          <div className="p-5 sm:p-6 rounded-xl bg-card border border-border/80 shadow-xs">
            <ActivityTimeline
              activities={lead.activities ?? []}
              auditLogs={lead.auditLogs ?? []}
              leadId={lead.id}
              onLogActivity={() => setIsActivityOpen(true)}
              onRefresh={refetch}
            />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Sales Lead"
        description="Update company details, deal values, and stage assignment."
        icon={<Edit2 className="w-4.5 h-4.5" />}
        iconVariant="primary"
        size="2xl"
        bodyClassName="p-6 max-h-[calc(85vh-120px)] overflow-y-auto"
      >
        <SalesLeadForm
          existingLead={lead}
          layout="modal"
          onSuccess={() => {
            setIsEditOpen(false);
            refetch();
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      {/* Log Activity Modal */}
      <Modal
        open={isActivityOpen}
        onOpenChange={setIsActivityOpen}
        title="Log Sales Activity"
        description="Record a call, meeting, email, follow-up, or note."
        icon={<Calendar className="w-4.5 h-4.5" />}
        iconVariant="primary"
        size="lg"
        bodyClassName="p-6 max-h-[calc(85vh-120px)] overflow-y-auto"
      >
        <ActivityForm
          leadId={lead.id}
          onSuccess={() => {
            setIsActivityOpen(false);
            refetch();
          }}
          onCancel={() => setIsActivityOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Sales Lead"
        description={`Are you sure you want to permanently delete "${lead.client?.name ?? "this lead"}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Convert Confirmation */}
      <ConfirmDialog
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        title="Move to Development Clients"
        description={`This will move "${lead.client?.name ?? "this client"}" into the Development Clients in Zsyio Flow, setting its status to Onboarding and advancing this deal to Won.`}
        confirmText="Move to Dev"
        variant="primary"
        onConfirm={handleConvert}
        isLoading={isConverting}
      />
    </div>
  );
}
