"use client";

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
  getErrorMessage,
} from "@zsyio/ui";
import {
  Loader2,
  PhoneCall,
  Mail,
  Users2,
  Clock,
  CheckSquare,
  FileText,
  Plus,
} from "lucide-react";
import { SALES_ACTIVITY_LABELS, SALES_PRIORITY_LABELS } from "@zsyio/types";
import type { SalesActivityType, SalesPriority } from "@zsyio/types";
import { useCreateSalesActivityMutation } from "@/store/api/salesActivitiesApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { useGetSalesLeadsQuery } from "@/store/api/salesLeadsApi";
import { cn } from "@/lib/utils";

const ACTIVITY_TYPES: SalesActivityType[] = [
  "CALL",
  "EMAIL",
  "MEETING",
  "FOLLOWUP",
  "TASK",
  "NOTE",
];
const PRIORITIES: SalesPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const ACTIVITY_TYPE_ICONS: Record<SalesActivityType, typeof PhoneCall> = {
  CALL: PhoneCall,
  EMAIL: Mail,
  MEETING: Users2,
  FOLLOWUP: Clock,
  TASK: CheckSquare,
  NOTE: FileText,
  STAGE_CHANGE: PhoneCall,
  SYSTEM: PhoneCall,
};

const formSchema = z.object({
  leadId: z.string().optional(),
  type: z.enum(["CALL", "EMAIL", "MEETING", "FOLLOWUP", "TASK", "NOTE"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueAt: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

type FormValues = z.infer<typeof formSchema>;

interface ActivityFormProps {
  leadId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ActivityForm({ leadId: propLeadId, onSuccess, onCancel }: ActivityFormProps) {
  const { data: users } = useGetUsersQuery();
  const { data: leadsData } = useGetSalesLeadsQuery({ pageSize: 100 }, { skip: !!propLeadId });
  const [createActivity, { isLoading }] = useCreateSalesActivityMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leadId: propLeadId ?? "",
      type: "NOTE",
      priority: "MEDIUM",
      dueAt: "",
    },
  });

  const selectedLeadId = propLeadId || watch("leadId");
  const type = watch("type");
  const priority = watch("priority");
  const assignedToId = watch("assignedToId");
  const dueAt = watch("dueAt");

  const onSubmit = async (values: FormValues) => {
    const targetLeadId = propLeadId || values.leadId;
    if (!targetLeadId) {
      toast.error("Please select a sales lead");
      return;
    }
    try {
      await createActivity({
        leadId: targetLeadId,
        type: values.type,
        title: values.title.trim(),
        description: values.description?.trim() || null,
        dueAt: values.dueAt || null,
        assignedToId: values.assignedToId || null,
        priority: values.priority,
      }).unwrap();
      toast.success("Activity logged successfully");
      onSuccess?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create activity"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5 animate-fade-in">
      {!propLeadId && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Sales Lead *</Label>
          <Select value={selectedLeadId} onValueChange={(v) => setValue("leadId", v)}>
            <SelectTrigger className="h-9.5 text-xs rounded-lg">
              <SelectValue placeholder="Select a sales lead..." />
            </SelectTrigger>
            <SelectContent>
              {leadsData?.items?.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.client?.name} ({lead.stage?.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Activity Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setValue("type", v as FormValues["type"], { shouldDirty: true })}
          >
            <SelectTrigger className="h-9.5 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((t) => {
                const Icon = ACTIVITY_TYPE_ICONS[t];
                return (
                  <SelectItem key={t} value={t}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span>{SALES_ACTIVITY_LABELS[t]}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) =>
              setValue("priority", v as FormValues["priority"], { shouldDirty: true })
            }
          >
            <SelectTrigger className="h-9.5 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {SALES_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="act-title"
          className="text-xs font-semibold text-foreground flex items-center justify-between"
        >
          <span>
            Activity Title <span className="text-destructive">*</span>
          </span>
          {errors.title && (
            <span className="text-xs font-semibold text-destructive  ">
              Required
            </span>
          )}
        </Label>
        <Input
          id="act-title"
          {...register("title")}
          placeholder="e.g. Discovery call with Chief Medical Officer"
          className={cn(
            "h-9.5 text-xs rounded-lg",
            errors.title && "border-destructive focus-visible:ring-destructive/20 bg-destructive/5"
          )}
        />
        {errors.title && (
          <p className="text-xs text-destructive font-medium mt-0.5">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="act-description" className="text-xs font-semibold text-foreground">
          Notes & Key Takeaways
        </Label>
        <Textarea
          id="act-description"
          {...register("description")}
          placeholder="Record call summary, client expectations, pain points, or next steps…"
          className="text-xs rounded-lg resize-none min-h-[85px] leading-relaxed"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Due Date</Label>
          <DatePicker
            value={dueAt || null}
            onChange={(val) => setValue("dueAt", val, { shouldDirty: true })}
            placeholder="Select due date"
            className="h-9.5 text-xs rounded-lg"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Assign To</Label>
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
              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              {users?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <div className="flex items-center gap-2">
                    <UserAvatar user={u} name={u.name} size="xs" />
                    <span>{u.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 px-5 text-xs font-semibold rounded-lg"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 px-6 text-xs font-semibold rounded-lg shadow-xs gap-2 min-w-[130px]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Log Activity</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
