"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Label } from "@zsyio/ui";
import dynamic from "next/dynamic";
import { ProductEnvironmentBadge } from "@/components/products/ProductEnvironmentBadge";

const RichTextEditor = dynamic(
  () => import("@zsyio/editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 w-full rounded-lg border border-border/80 bg-surface-muted/30 animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading editor...
      </div>
    ),
  }
);

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import { TaskConfigurationCard } from "@/components/tasks/TaskConfigurationCard";
import { useGetClientsLiteQuery } from "@/store/api/clientsApi";
import { useGetProductsQuery } from "@/store/api/productsApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { useCreateTaskMutation } from "@/store/api/tasksApi";
import type { Role } from "@zsyio/auth/permissions";
import type { Priority } from "@prisma/client";
import type { TaskStatus } from "@zsyio/types";
import { can } from "@zsyio/auth/permissions";
import { useGetCustomTaskTypesQuery, useCreateCustomTaskTypeMutation } from "@/store/api/taskTypesApi";
import { getImagesFromClipboard, optimizeImage } from "@zsyio/editor/clipboard-helper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@zsyio/ui";
import {
  Building2,
  Package,
  Plus,
  Loader2,
  Tag,
  AlertCircle,
  Paperclip,
  Upload,
  X,
  FileText,
  Clock,
} from "lucide-react";
import { useGetTeamsQuery } from "@/store/api/teamsApi";

export function TaskForm({ role, permissions }: { role: Role | string; permissions?: string[] | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultStatus = (searchParams.get("status") as TaskStatus) || "TODO";
  const initialProductId = searchParams.get("productId") || "";
  const initialClientId = searchParams.get("clientId") || "";

  const { data: clients = [] } = useGetClientsLiteQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: customTaskTypes = [] } = useGetCustomTaskTypesQuery();
  const [createCustomType, { isLoading: isCreatingType }] = useCreateCustomTaskTypeMutation();

  const [clientId, setClientId] = useState(initialClientId);
  const [productId, setProductId] = useState(initialProductId);
  const { data: products = [], isFetching: isFetchingProducts } = useGetProductsQuery(
    clientId ? { clientId } : undefined,
    { skip: !clientId }
  );
  const [createTask] = useCreateTaskMutation();

  const defaultType =
    can(role, "task:create", permissions) || can(role, "task:create:any", permissions)
      ? "FEATURE"
      : "SUPPORT_REQUEST";

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [type, setType] = useState<string>(defaultType);
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [attachments, setAttachments] = useState<
    Array<{ fileName: string; fileUrl: string; fileSize: number }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [isCustomTypeOpen, setIsCustomTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    try {
      const newAtts: Array<{ fileName: string; fileUrl: string; fileSize: number }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`File "${file.name}" exceeds 15MB limit.`);
          continue;
        }
        const data = await optimizeImage(file);
        newAtts.push(data);
      }
      setAttachments((prev) => [...prev, ...newAtts]);
      toast.success(`Attached ${newAtts.length} ${newAtts.length === 1 ? "file" : "files"}`);
    } catch {
      toast.error("Failed to read selected files");
    } finally {
      setIsUploadingFile(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // If pasting directly inside ProseMirror, RichTextEditor's handlePaste handles it
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(".ProseMirror")) {
        return;
      }

      const images = getImagesFromClipboard(e);
      if (images.length === 0) return;

      setIsUploadingFile(true);
      try {
        const newAtts = await Promise.all(images.map((f) => optimizeImage(f)));
        setAttachments((prev) => [...prev, ...newAtts]);
        toast.success(
          `Pasted ${newAtts.length} screenshot${newAtts.length === 1 ? "" : "s"}: ${newAtts[0].fileName}`
        );
      } catch {
        toast.error("Failed to process pasted screenshot");
      } finally {
        setIsUploadingFile(false);
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateCustomType = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTypeName.trim()) return;

    try {
      await createCustomType({ name: newTypeName.trim() }).unwrap();
      setType(newTypeName.trim().toUpperCase());
      setIsCustomTypeOpen(false);
      setNewTypeName("");
      toast.success("Custom task type added!");
    } catch {
      toast.error("Failed to create task type");
    }
  };

  useEffect(() => {
    if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
  }, [products, productId]);

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedClient = clients.find((c) => c.id === clientId);

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleReviewer = (userId: string) => {
    setSelectedReviewerIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleTeam = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
    } else {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!clientId || !productId || !title.trim()) {
      toast.error("Please fill in all mandatory fields highlighted in red.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productId,
        title: title.trim(),
        description: description.trim() || null,
        status,
        type,
        priority,
        assignedToId: selectedAssigneeIds[0] ?? null,
        reviewerId: selectedReviewerIds[0] ?? null,
        reviewerIds: selectedReviewerIds,
        assignedTeamId: selectedTeamIds[0] ?? null,
        assigneeIds: selectedAssigneeIds,
        teamIds: selectedTeamIds,
        tags: tags.length ? tags : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        estimatedHours: estimatedHours.trim() ? parseFloat(estimatedHours) : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const created = await createTask(payload as never).unwrap();
      toast.success("Ticket created successfully!");
      router.push(`/tasks?taskId=${created.id}`);
    } catch {
      toast.error("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 shadow-xs">
          <h2 className="text-xs font-semibold   text-muted-foreground border-b border-border pb-3">
            Client & Product Assignment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Client selection */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Client <span className="text-destructive font-semibold">*</span></span>
                {attemptedSubmit && !clientId && <span className="text-xs font-semibold text-destructive ">Mandatory</span>}
              </Label>
              <Select
                value={clientId}
                onValueChange={(v) => {
                  setClientId(v);
                  setProductId("");
                }}
              >
                <SelectTrigger className={cn("h-10 text-xs font-semibold rounded-lg transition-colors", attemptedSubmit && !clientId && "border-destructive ring-1 ring-destructive bg-destructive/5")}>
                  <SelectValue placeholder="Select client account..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attemptedSubmit && !clientId && (
                <p className="text-xs font-semibold text-destructive mt-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Client selection is mandatory.</span>
                </p>
              )}
            </div>

            {/* 2. Product selection (Loads after client is chosen) */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Product <span className="text-destructive font-semibold">*</span></span>
                {attemptedSubmit && !productId && <span className="text-xs font-semibold text-destructive ">Mandatory</span>}
              </Label>
              <Select
                value={productId}
                onValueChange={setProductId}
                disabled={!clientId}
              >
                <SelectTrigger className={cn("h-10 text-xs font-semibold rounded-lg transition-colors", attemptedSubmit && !productId && "border-destructive ring-1 ring-destructive bg-destructive/5")}>
                  <SelectValue placeholder={clientId ? (isFetchingProducts ? "Loading products..." : "Select product...") : "Select client first"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="inline-flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-notion-orange-fg shrink-0" />
                          <span>{p.name}</span>
                        </span>
                        <span className="text-xs font-mono  text-muted-foreground/80 bg-surface-subtle px-1.5 py-0.5 rounded border border-border/50 ml-auto shrink-0">
                          {p.environment}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attemptedSubmit && !productId && (
                <p className="text-xs font-semibold text-destructive mt-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{clientId ? "Product selection is mandatory." : "Please select a client first."}</span>
                </p>
              )}
            </div>
          </div>

          {selectedProduct && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-subtle p-2.5 rounded-lg border border-border/60">
              <span className="font-semibold text-foreground">Product Selected:</span>
              <span className="text-foreground font-medium">{selectedProduct.name}</span>
              {selectedClient && (
                <span className="text-muted-foreground">({selectedClient.name})</span>
              )}
              <div className="ml-auto">
                <ProductEnvironmentBadge environment={selectedProduct.environment} />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 shadow-xs">
          <h2 className="text-xs font-semibold   text-muted-foreground border-b border-border pb-3">
            Task Overview
          </h2>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Task Title <span className="text-destructive font-semibold">*</span></span>
              {attemptedSubmit && !title.trim() && <span className="text-xs font-semibold text-destructive ">Mandatory</span>}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add export-to-PDF for visit summaries"
              className={cn("h-10 text-sm font-semibold transition-colors", attemptedSubmit && !title.trim() && "border-destructive ring-1 ring-destructive bg-destructive/5")}
              autoFocus
            />
            {attemptedSubmit && !title.trim() && (
              <p className="text-xs font-semibold text-destructive mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Task title is mandatory.</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-xs font-semibold text-foreground">
                Description <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
              </Label>
              <span className="text-xs text-muted-foreground font-medium">Rich visual editor</span>
            </div>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add task context, requirements, acceptance criteria, or links..."
              minHeight="min-h-[180px]"
              className="border border-border/80 bg-card"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Paperclip className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-xs font-semibold   text-muted-foreground">
                Attachments & Screenshots
              </h2>
            </div>
            {attachments.length > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                {attachments.length} {attachments.length === 1 ? "file attached" : "files attached"}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="file"
              id="task-file-upload"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.json,.log,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="task-file-upload"
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-border/80 hover:border-primary/50 hover:bg-surface-subtle/50 transition-all cursor-pointer text-center group bg-surface-subtle/20"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary  transition-transform mb-2">
                {isUploadingFile ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                {isUploadingFile ? "Processing files..." : "Click, drag & drop, or paste (⌘V / Ctrl+V) screenshots"}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Paste screenshots directly or attach PNG, JPG, WebP, PDF, Docs up to 10MB
              </span>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {attachments.map((att, index) => {
                const isImage =
                  att.fileUrl.startsWith("data:image/") ||
                  /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(att.fileName);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-border/80 bg-surface-subtle/60 hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isImage ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/60 shrink-0 bg-background flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border/60 shrink-0 flex items-center justify-center text-muted-foreground">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate" title={att.fileName}>
                          {att.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {att.fileSize >= 1024 * 1024
                            ? `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.round(att.fileSize / 1024)} KB`}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <TaskConfigurationCard
          statusLabel="Initial Status"
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          type={type}
          onTypeChange={setType}
          customTaskTypes={customTaskTypes}
          onOpenCustomTypeModal={() => setIsCustomTypeOpen(true)}
          canCreateCustomType={can(role, "task:create:any", permissions)}
          selectedAssigneeIds={selectedAssigneeIds}
          onToggleAssignee={toggleAssignee}
          allUsers={users}
          selectedReviewerIds={selectedReviewerIds}
          onToggleReviewer={toggleReviewer}
          selectedTeamIds={selectedTeamIds}
          onToggleTeam={toggleTeam}
          allTeams={teams}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          tags={tags}
          onTagsChange={setTags}
        />

        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col gap-2.5 shadow-xs">
          <Label className="text-xs font-semibold   text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Estimated Effort (Hours)</span>
          </Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 4.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            className="text-xs font-mono"
          />
          <span className="text-xs text-muted-foreground">
            Optional initial estimate for velocity & budget tracking.
          </span>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-3 shadow-xs">
          <Button
            type="submit"
            disabled={submitting}
            size="lg"
            className="w-full font-semibold shadow-xs gap-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Task...
              </span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </>
            )}
          </Button>

        </div>
      </div>

      <Dialog open={isCustomTypeOpen} onOpenChange={setIsCustomTypeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Tag className="w-4 h-4 text-primary" /> Create Custom Task Type
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <Label className="text-xs font-semibold text-muted-foreground">Type Name</Label>
            <Input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Security Audit, DB Migration, UX Research"
              className="text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateCustomType();
                }
              }}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomTypeOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCustomType}
              disabled={!newTypeName.trim() || isCreatingType}
              className="text-xs font-semibold gap-1.5"
            >
              {isCreatingType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Save & Select</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
