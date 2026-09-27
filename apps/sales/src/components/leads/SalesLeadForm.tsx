"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DatePicker,
  UserAvatar,
  KanbanPriorityBadge,
  getErrorMessage,
} from "@zsyio/ui";
import {
  Loader2,
  Building2,
  Globe,
  User2,
  Mail,
  Phone,
  Euro,
  Percent,
  TrendingUp,
  FileText,
  Calendar,
  Plus,
  Check,
  Tag,
} from "lucide-react";
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  SALES_PRIORITY_LABELS,
} from "@zsyio/types";
import type { SalesStage, SalesPriority, SalesLead } from "@zsyio/types";
import {
  useCreateSalesLeadMutation,
  useUpdateSalesLeadMutation,
} from "@/store/api/salesLeadsApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { cn } from "@/lib/utils";

const ALL_STAGES: SalesStage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];
const ALL_PRIORITIES: SalesPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const LEAD_SOURCES = [
  "Website",
  "Referral",
  "Cold Outreach",
  "LinkedIn",
  "Conference",
  "Advertisement",
  "Partner",
  "Inbound Call",
  "Email Campaign",
  "Other",
];

const VALUE_PRESETS = [5000, 15000, 25000, 50000, 100000];
const PROBABILITY_PRESETS = [20, 40, 60, 80, 100];

const NOTE_SUGGESTIONS = [
  "Initial LinkedIn outreach; expressed interest in enterprise clinical trial suite.",
  "Scheduled preliminary demo call to review procurement criteria.",
  "Budget approved for Q4 rollout across central radiology department.",
];

const formSchema = z.object({
  clientName: z.string().min(1, "Company name is required"),
  domain: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  currentStage: z.enum([
    "NEW_LEAD",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL_SENT",
    "NEGOTIATION",
    "WON",
    "LOST",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dealValue: z.string().optional(),
  probability: z.string().optional(),
  expectedCloseAt: z.string().optional(),
  leadSource: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  assignedToId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SalesLeadFormProps {
  existingLead?: SalesLead;
  onSuccess?: (lead: SalesLead) => void;
  onCancel?: () => void;
  defaultStage?: SalesStage;
  layout?: "page" | "modal";
}

export function SalesLeadForm({
  existingLead,
  onSuccess,
  onCancel,
  defaultStage = "NEW_LEAD",
  layout = "page",
}: SalesLeadFormProps) {
  const isEditing = !!existingLead;
  const { data: users } = useGetUsersQuery();
  const [createLead, { isLoading: isCreating }] = useCreateSalesLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateSalesLeadMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: existingLead?.client?.name ?? "",
      domain: existingLead?.client?.domain ?? "",
      contactName: existingLead?.client?.contactName ?? "",
      contactEmail: existingLead?.client?.contactEmail ?? "",
      contactPhone: existingLead?.client?.contactPhone ?? "",
      notes: existingLead?.client?.notes ?? "",
      currentStage: existingLead?.currentStage ?? defaultStage,
      priority: existingLead?.priority ?? "MEDIUM",
      dealValue: existingLead?.dealValue?.toString() ?? "",
      probability: existingLead?.probability?.toString() ?? "",
      expectedCloseAt: existingLead?.expectedCloseAt?.slice(0, 10) ?? "",
      leadSource: existingLead?.leadSource ?? "",
      nextFollowUpAt: existingLead?.nextFollowUpAt?.slice(0, 10) ?? "",
      assignedToId: existingLead?.assignedToId ?? "",
    },
  });

  useEffect(() => {
    if (!existingLead && defaultStage) {
      setValue("currentStage", defaultStage);
    }
  }, [defaultStage, existingLead, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        clientName: values.clientName.trim(),
        domain: values.domain?.trim() || null,
        contactName: values.contactName?.trim() || null,
        contactEmail: values.contactEmail?.trim() || null,
        contactPhone: values.contactPhone?.trim() || null,
        notes: values.notes?.trim() || null,
        currentStage: values.currentStage,
        priority: values.priority,
        dealValue: values.dealValue ? Number(values.dealValue) : null,
        probability: values.probability ? Number(values.probability) : null,
        expectedCloseAt: values.expectedCloseAt || null,
        leadSource: values.leadSource || null,
        nextFollowUpAt: values.nextFollowUpAt || null,
        assignedToId: values.assignedToId || null,
      };

      let result: SalesLead;
      if (isEditing) {
        result = await updateLead({ id: existingLead!.id, body: payload }).unwrap();
        toast.success("Lead updated successfully");
      } else {
        result = await createLead(payload).unwrap();
        toast.success("Lead created successfully");
      }

      onSuccess?.(result);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save lead"));
    }
  };

  const currentStage = watch("currentStage");
  const priority = watch("priority");
  const dealValue = watch("dealValue");
  const probability = watch("probability");
  const leadSource = watch("leadSource");
  const assignedToId = watch("assignedToId");
  const expectedCloseAt = watch("expectedCloseAt");
  const nextFollowUpAt = watch("nextFollowUpAt");
  const notesValue = watch("notes");

  // ==========================================
  // 1. DEDICATED FULL-PAGE LAYOUT (2:1 SPLIT)
  // ==========================================
  if (layout === "page") {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS: Company Profile & Discovery Notes */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Card 1: Company Profile */}
            <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Company & Account Details</h2>
                    <p className="text-xs text-muted-foreground">
                      Company name, web domain, and primary business contact channels.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label
                    htmlFor="clientName"
                    className="text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>
                      Company Name <span className="text-destructive font-bold">*</span>
                    </span>
                    {errors.clientName && (
                      <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="clientName"
                      {...register("clientName")}
                      placeholder="e.g. BioPharma Solutions GmbH"
                      className={cn(
                        "h-9.5 text-xs rounded-lg pl-9.5",
                        errors.clientName &&
                          "border-destructive focus-visible:ring-destructive/20 bg-destructive/5"
                      )}
                    />
                  </div>
                  {errors.clientName && (
                    <p className="text-[11px] text-destructive font-medium mt-0.5">
                      {errors.clientName.message}
                    </p>
                  )}
                </div>

                {/* Web Domain */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="domain" className="text-xs font-semibold text-foreground">
                    Website / Domain
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="domain"
                      {...register("domain")}
                      placeholder="e.g. biopharma-solutions.com"
                      className="h-9.5 text-xs rounded-lg pl-9.5"
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contactName" className="text-xs font-semibold text-foreground">
                    Primary Contact Person
                  </Label>
                  <div className="relative">
                    <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="contactName"
                      {...register("contactName")}
                      placeholder="e.g. Dr. Marlene Weber"
                      className="h-9.5 text-xs rounded-lg pl-9.5"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contactPhone" className="text-xs font-semibold text-foreground">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="contactPhone"
                      {...register("contactPhone")}
                      placeholder="+49 30 1234567"
                      className="h-9.5 text-xs rounded-lg pl-9.5"
                    />
                  </div>
                </div>

                {/* Contact Email */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="contactEmail" className="text-xs font-semibold text-foreground">
                    Contact Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register("contactEmail")}
                      placeholder="marlene.weber@biopharma.de"
                      className="h-9.5 text-xs rounded-lg pl-9.5"
                    />
                  </div>
                  {errors.contactEmail && (
                    <p className="text-[11px] text-destructive font-medium mt-0.5">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Discovery Notes & Context */}
            <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Internal Notes & Context</h2>
                    <p className="text-xs text-muted-foreground">
                      Document customer requirements, key pain points, and discovery takeaways.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Record initial conversation takeaways, tech stack requirements, evaluation timeline, decision makers, and scope..."
                  className="text-xs rounded-lg resize-none min-h-[110px] leading-relaxed p-3.5"
                  rows={4}
                />

                {/* Quick Note Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                    <Tag className="w-3 h-3 text-muted-foreground/80" /> Quick Add:
                  </span>
                  {NOTE_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const current = notesValue?.trim() ? `${notesValue}\n• ${sug}` : `• ${sug}`;
                        setValue("notes", current, { shouldDirty: true });
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded border border-border/70 bg-surface-subtle hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {sug.split(";")[0]}...
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: Deal Metrics & Scheduling Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Card 1: Pipeline & Deal Value */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Deal Configuration</h3>
                  <p className="text-[11px] text-muted-foreground">Stage and monetary projections</p>
                </div>
              </div>

              {/* Stage Selection */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Pipeline Stage</Label>
                <Select
                  value={currentStage}
                  onValueChange={(v) =>
                    setValue("currentStage", v as SalesStage, { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="h-9.5 text-xs rounded-lg font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: SALES_STAGE_COLORS[s] }}
                          />
                          <span>{SALES_STAGE_LABELS[s]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selection */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Deal Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setValue("priority", v as SalesPriority, { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="h-9.5 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <KanbanPriorityBadge priority={p} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Deal Value (€) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dealValue" className="text-xs font-semibold text-foreground">
                    Deal Value (€)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">EUR</span>
                </div>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="dealValue"
                    {...register("dealValue")}
                    type="number"
                    placeholder="25000"
                    className="h-9.5 text-xs rounded-lg pl-9.5 font-mono font-bold"
                  />
                </div>

                {/* Deal Value Quick Presets */}
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  {VALUE_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setValue("dealValue", String(val), { shouldDirty: true })}
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer",
                        dealValue === String(val)
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "border-border/70 bg-surface-subtle hover:bg-muted text-muted-foreground"
                      )}
                    >
                      €{val / 1000}K
                    </button>
                  ))}
                </div>
              </div>

              {/* Win Probability (%) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="probability" className="text-xs font-semibold text-foreground">
                    Win Probability (%)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {probability ? `${probability}%` : "Estimated"}
                  </span>
                </div>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="probability"
                    {...register("probability")}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="60"
                    className="h-9.5 text-xs rounded-lg pl-9.5 font-mono"
                  />
                </div>

                {/* Probability Quick Presets */}
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  {PROBABILITY_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setValue("probability", String(pct), { shouldDirty: true })}
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer",
                        probability === String(pct)
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "border-border/70 bg-surface-subtle hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Schedule & Ownership */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Timeline & Assignment</h3>
                  <p className="text-[11px] text-muted-foreground">Touchpoints & salesperson</p>
                </div>
              </div>

              {/* Assigned Salesperson */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Assigned Salesperson
                </Label>
                <Select
                  value={assignedToId || "UNASSIGNED"}
                  onValueChange={(v) =>
                    setValue("assignedToId", v === "UNASSIGNED" ? "" : v, { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="h-9.5 text-xs rounded-lg">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED">
                      <span className="text-muted-foreground">Unassigned</span>
                    </SelectItem>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={u} size="xs" />
                          <span className="text-xs font-medium">{u.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lead Source */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Lead Source</Label>
                <Select
                  value={leadSource || "UNSPECIFIED"}
                  onValueChange={(v) =>
                    setValue("leadSource", v === "UNSPECIFIED" ? "" : v, { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="h-9.5 text-xs rounded-lg">
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNSPECIFIED">Select lead source</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expected Close Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Expected Close Date
                </Label>
                <DatePicker
                  value={expectedCloseAt || null}
                  onChange={(val) => setValue("expectedCloseAt", val, { shouldDirty: true })}
                  placeholder="Select close date"
                  className="h-9.5 text-xs rounded-lg"
                />
              </div>

              {/* Next Follow-up Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Next Follow-up</Label>
                <DatePicker
                  value={nextFollowUpAt || null}
                  onChange={(val) => setValue("nextFollowUpAt", val, { shouldDirty: true })}
                  placeholder="Select follow-up date"
                  className="h-9.5 text-xs rounded-lg"
                />
              </div>
            </div>

            {/* Card 3: Action Buttons */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                size="default"
                className="w-full h-10 text-xs font-bold rounded-lg shadow-xs gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Sales Lead</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Sales Lead</span>
                  </>
                )}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full h-9 text-xs font-semibold rounded-lg border-border/80 hover:bg-surface-subtle"
                >
                  Cancel
                </Button>
              )}

              <p className="text-[11px] text-muted-foreground text-center leading-relaxed mt-1">
                New leads appear in the Sales Pipeline and Kanban board immediately.
              </p>
            </div>
          </div>
        </div>
      </form>
    );
  }

  // ==========================================
  // 2. MODAL COMPACT LAYOUT (FOR EDIT MODALS)
  // ==========================================
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
      {/* 1. Client Information */}
      <div className="rounded-xl border border-border/80 bg-surface-subtle/30 p-4 flex flex-col gap-3.5 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-2.5">
          <span className="w-6 h-6 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-foreground">Client Information</h3>
            <p className="text-[11px] text-muted-foreground">
              Company name, primary contact person, and communication channels.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label
              htmlFor="modalClientName"
              className="text-xs font-semibold text-foreground flex items-center justify-between"
            >
              <span>
                Company Name <span className="text-destructive font-bold">*</span>
              </span>
              {errors.clientName && (
                <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                  Required
                </span>
              )}
            </Label>
            <Input
              id="modalClientName"
              {...register("clientName")}
              placeholder="e.g. Acme Health Corp"
              className={cn(
                "h-9 text-xs rounded-lg",
                errors.clientName && "border-destructive focus-visible:ring-destructive/20 bg-destructive/5"
              )}
            />
            {errors.clientName && (
              <p className="text-[11px] text-destructive font-medium mt-0.5">
                {errors.clientName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="modalDomain" className="text-xs font-semibold text-foreground">
              Website / Domain
            </Label>
            <Input
              id="modalDomain"
              {...register("domain")}
              placeholder="e.g. acmehealth.com"
              className="h-9 text-xs rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modalContactName" className="text-xs font-semibold text-foreground">
              Contact Person
            </Label>
            <div className="relative">
              <User2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="modalContactName"
                {...register("contactName")}
                placeholder="e.g. Dr. John Smith"
                className="h-9 text-xs rounded-lg pl-8.5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modalContactPhone" className="text-xs font-semibold text-foreground">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="modalContactPhone"
                {...register("contactPhone")}
                placeholder="+49 123 456789"
                className="h-9 text-xs rounded-lg pl-8.5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="modalContactEmail" className="text-xs font-semibold text-foreground">
              Contact Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="modalContactEmail"
                type="email"
                {...register("contactEmail")}
                placeholder="contact@acmehealth.com"
                className="h-9 text-xs rounded-lg pl-8.5"
              />
            </div>
            {errors.contactEmail && (
              <p className="text-[11px] text-destructive font-medium mt-0.5">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Deal & Pipeline */}
      <div className="rounded-xl border border-border/80 bg-surface-subtle/30 p-4 flex flex-col gap-3.5 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-2.5">
          <span className="w-6 h-6 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-foreground">Deal & Pipeline</h3>
            <p className="text-[11px] text-muted-foreground">
              Stage progression, expected deal revenue, and target closing dates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">Stage</Label>
            <Select
              value={currentStage}
              onValueChange={(v) =>
                setValue("currentStage", v as SalesStage, { shouldDirty: true })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: SALES_STAGE_COLORS[s] }}
                      />
                      <span>{SALES_STAGE_LABELS[s]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) =>
                setValue("priority", v as SalesPriority, { shouldDirty: true })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {SALES_PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modalDealValue" className="text-xs font-semibold text-foreground">
              Deal Value (€)
            </Label>
            <div className="relative">
              <Euro className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="modalDealValue"
                {...register("dealValue")}
                type="number"
                placeholder="25000"
                className="h-9 text-xs rounded-lg pl-8.5 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modalProbability" className="text-xs font-semibold text-foreground">
              Win Probability (%)
            </Label>
            <div className="relative">
              <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="modalProbability"
                {...register("probability")}
                type="number"
                min="0"
                max="100"
                placeholder="60"
                className="h-9 text-xs rounded-lg pl-8.5 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">Expected Close</Label>
            <DatePicker
              value={expectedCloseAt || null}
              onChange={(val) => setValue("expectedCloseAt", val, { shouldDirty: true })}
              placeholder="Select close date"
              className="h-9 text-xs rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">Next Follow-up</Label>
            <DatePicker
              value={nextFollowUpAt || null}
              onChange={(val) => setValue("nextFollowUpAt", val, { shouldDirty: true })}
              placeholder="Select follow-up date"
              className="h-9 text-xs rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">Lead Source</Label>
            <Select
              value={leadSource || "UNSPECIFIED"}
              onValueChange={(v) =>
                setValue("leadSource", v === "UNSPECIFIED" ? "" : v, { shouldDirty: true })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg">
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNSPECIFIED">Select lead source</SelectItem>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">Assigned Salesperson</Label>
            <Select
              value={assignedToId || "UNASSIGNED"}
              onValueChange={(v) =>
                setValue("assignedToId", v === "UNASSIGNED" ? "" : v, { shouldDirty: true })
              }
            >
              <SelectTrigger className="h-9 text-xs rounded-lg">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                {users?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. Internal Notes */}
      <div className="rounded-xl border border-border/80 bg-surface-subtle/30 p-4 flex flex-col gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-2">
          <span className="w-6 h-6 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-foreground">Internal Notes</h3>
            <p className="text-[11px] text-muted-foreground">
              Context, initial customer requirements, and meeting takeaways.
            </p>
          </div>
        </div>
        <Textarea
          id="modalNotes"
          {...register("notes")}
          placeholder="Write any relevant background information, key pain points, or timeline expectations..."
          className="text-xs rounded-lg resize-none min-h-[80px] leading-relaxed"
          rows={3}
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-9 px-4 text-xs font-semibold rounded-lg"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-9 px-5 text-xs font-semibold rounded-lg shadow-xs gap-1.5 min-w-[120px]"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isEditing ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Update Lead</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Create Lead</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
