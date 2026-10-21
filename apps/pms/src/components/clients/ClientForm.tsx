"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Label } from "@zsyio/ui";
import { Textarea } from "@zsyio/ui";
import { DatePicker } from "@zsyio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import {
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "@/store/api/clientsApi";
import type { Client } from "@zsyio/types";
import { toast } from "sonner";
import {
  Building2,
  Globe,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  FileText,
  Loader2,
  Plus,
  Save,
  Shield,
  AlertCircle,
  Trash2,
} from "lucide-react";

import { ImageUploader } from "@zsyio/ui";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import { ClientStatusBadge } from "./ClientStatusBadge";
import { useDeleteWithConfirm } from "@zsyio/ui";
import { getErrorMessage } from "@zsyio/ui";

const formSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  logoUrl: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  status: z.enum(["INTAKE", "ONBOARDING", "ACTIVE", "PAUSED", "CHURNED"]),
  clientType: z.enum(["DEVELOPMENT", "SALES"]),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),
  contactPhone: z.string().optional().nullable(),
  contractStart: z.string().optional().nullable(),
  contractEnd: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const STATUS_DESCRIPTIONS: Record<FormValues["status"], { label: string; desc: string }> = {
  INTAKE: {
    label: "Intake",
    desc: "Initial in-taking stage; discovery, proposal & requirements gathering",
  },
  ACTIVE: {
    label: "Active",
    desc: "Fully active client with production services deployed",
  },
  ONBOARDING: {
    label: "Onboarding",
    desc: "Currently being set up; environments in development",
  },
  PAUSED: {
    label: "Paused",
    desc: "Temporarily inactive; maintenance hold in effect",
  },
  CHURNED: {
    label: "Churned",
    desc: "Contract terminated or inactive client",
  },
};

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();
  const [submitting, setSubmitting] = useState(false);

  const {
    confirmOpen: confirmDeleteOpen,
    setConfirmOpen: setConfirmDeleteOpen,
    handleDelete: handleDeleteClient,
  } = useDeleteWithConfirm({
    deleteTrigger: () => deleteClient(client!.id),
    successMessage: `Client "${client?.name}" has been deleted.`,
    errorFallback: "Failed to delete client.",
    onSuccess: () => router.push("/clients"),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name ?? "",
      logoUrl: client?.logoUrl ?? null,
      domain: client?.domain ?? "",
      status: (client?.status as FormValues["status"]) ?? "ACTIVE",
      clientType: (client?.clientType as "DEVELOPMENT" | "SALES") ?? "DEVELOPMENT",
      contactName: client?.contactName ?? "",
      contactEmail: client?.contactEmail ?? "",
      contactPhone: client?.contactPhone ?? "",
      contractStart: client?.contractStart
        ? new Date(client.contractStart).toISOString().slice(0, 10)
        : null,
      contractEnd: client?.contractEnd
        ? new Date(client.contractEnd).toISOString().slice(0, 10)
        : null,
      notes: client?.notes ?? "",
    },
  });

  const logoUrl = watch("logoUrl");
  const currentStatus = watch("status");
  const currentClientType = watch("clientType");
  const contractStart = watch("contractStart");
  const contractEnd = watch("contractEnd");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        logoUrl: values.logoUrl || null,
        domain: values.domain?.trim() || null,
        status: values.status,
        clientType: values.clientType,
        contactName: values.contactName?.trim() || null,
        contactEmail: values.contactEmail?.trim() || null,
        contactPhone: values.contactPhone?.trim() || null,
        contractStart: values.contractStart ? new Date(values.contractStart).toISOString() : null,
        contractEnd: values.contractEnd ? new Date(values.contractEnd).toISOString() : null,
        notes: values.notes?.trim() || null,
      };

      if (client) {
        await updateClient({ id: client.id, body: payload }).unwrap();
        toast.success("Client updated successfully");
        router.push(`/clients/${client.id}`);
      } else {
        const created = await createClient(payload).unwrap();
        toast.success("Client created successfully");
        router.push(`/clients/${created.id}`);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save client details"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        title={client ? `Edit ${client.name}` : "Create New Client"}
        titleIcon={<Building2 className="w-5 h-5" />}
        description={
          client
            ? "Update organization parameters, primary point of contact, and contract terms."
            : "Provision a white-label client account to manage products and tasks."
        }
        borderBottom
        breadcrumbs={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/clients" className="hover:text-foreground transition-colors">
              Clients
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">
              {client ? "Edit" : "New Client"}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(client ? `/clients/${client.id}` : "/clients")}
              className="h-9 px-4 font-semibold"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              size="sm"
              className="h-9 px-5 font-semibold shadow-xs gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : client ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Client</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-5 shadow-xs transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
              <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Organization Details</h2>
                <p className="text-xs text-muted-foreground">Client brand name, website domain, and account status.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  Client Brand Logo <span className="text-muted-foreground font-normal ml-1.5">(Optional)</span>
                </Label>
                <ImageUploader
                  value={logoUrl}
                  onChange={(val) => setValue("logoUrl", val, { shouldDirty: true })}
                  label="Upload Client Logo"
                  description="Upload a high-res company logo (PNG, JPG, WebP, SVG). Automatically stored as Base64."
                  aspectRatio="square"
                  maxDimension={800}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>
                    Client Name <span className="text-destructive font-semibold">*</span>
                  </span>
                  {errors.name && (
                    <span className="text-xs font-semibold text-destructive  ">
                      Required
                    </span>
                  )}
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Health Corp"
                  {...register("name")}
                  className={cn(
                    "text-xs h-9.5 rounded-lg transition-colors",
                    errors.name && "border-destructive focus-visible:ring-destructive/20 bg-destructive/5"
                  )}
                />
                {errors.name && (
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.name.message}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="domain" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary/70" />
                  <span>Domain / Host <span className="text-muted-foreground font-normal ml-1">(Optional)</span></span>
                </Label>
                <Input
                  id="domain"
                  placeholder="e.g. acmehealth.com"
                  {...register("domain")}
                  className="text-xs h-9.5 rounded-lg"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary/70" />
                  <span>Account Status <span className="text-destructive font-semibold">*</span></span>
                </Label>
                <Select
                  value={currentStatus}
                  onValueChange={(v) => setValue("status", v as FormValues["status"])}
                >
                  <SelectTrigger className="h-9.5 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_DESCRIPTIONS) as FormValues["status"][])
                      .filter((st) => {
                        // Clients cannot go back to INTAKE once onboarding has started
                        if (client && client.status !== "INTAKE" && st === "INTAKE") return false;
                        return true;
                      })
                      .map((st) => {
                        const info = STATUS_DESCRIPTIONS[st];
                        return (
                          <SelectItem key={st} value={st} className="text-xs">
                            <div className="flex items-center gap-2">
                              <ClientStatusBadge status={st} />
                              <span className="text-xs text-muted-foreground hidden sm:inline">- {info.desc}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary/70" />
                  <span>Client Purpose &amp; Classification <span className="text-destructive font-semibold">*</span></span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setValue("clientType", "DEVELOPMENT", { shouldDirty: true })}
                    className={cn(
                      "p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 text-left",
                      currentClientType === "DEVELOPMENT"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Development Client</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-notion-blue-fg/10 text-notion-blue-fg font-semibold border border-notion-blue-fg/20">
                        PMS &amp; Engineering
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Active client with provisioned products, engineering deliverables, sprint tickets, and SLA support.
                    </p>
                  </div>

                  <div
                    onClick={() => setValue("clientType", "SALES", { shouldDirty: true })}
                    className={cn(
                      "p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 text-left",
                      currentClientType === "SALES"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Sales Client</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-notion-purple-fg/10 text-notion-purple-fg font-semibold border border-notion-purple-fg/20">
                        Sales CRM &amp; Leads
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Prospect or pipeline lead managed by the Sales team. Can be converted to Development client once won.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-5 shadow-xs transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
              <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <UserCheck className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Primary Contact Person</h2>
                <p className="text-xs text-muted-foreground">Main stakeholder or admin for communication.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contactName" className="text-xs font-semibold text-foreground">
                  Contact Name <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                </Label>
                <Input
                  id="contactName"
                  placeholder="e.g. Sarah Jenkins"
                  {...register("contactName")}
                  className="text-xs h-9.5 rounded-lg"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contactPhone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary/70" />
                  <span>Contact Phone <span className="text-muted-foreground font-normal ml-1">(Optional)</span></span>
                </Label>
                <Input
                  id="contactPhone"
                  placeholder="e.g. +1 (555) 234-5678"
                  {...register("contactPhone")}
                  className="text-xs h-9.5 rounded-lg"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="contactEmail" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary/70" />
                  <span>Contact Email <span className="text-muted-foreground font-normal ml-1">(Optional)</span></span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="e.g. sarah.jenkins@acmehealth.com"
                  {...register("contactEmail")}
                  className={cn(
                    "text-xs h-9.5 rounded-lg",
                    errors.contactEmail && "border-destructive focus-visible:ring-destructive/20 bg-destructive/5"
                  )}
                />
                {errors.contactEmail && (
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.contactEmail.message}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-5 shadow-xs transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
              <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Contract Term</h2>
                <p className="text-xs text-muted-foreground">Start and end dates for active service agreements.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Contract Start Date <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                </Label>
                <DatePicker
                  value={contractStart}
                  onChange={(val) => setValue("contractStart", val)}
                  placeholder="Select start date..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Contract End Date <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                </Label>
                <DatePicker
                  value={contractEnd}
                  onChange={(val) => setValue("contractEnd", val)}
                  placeholder="Select end date..."
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-5 shadow-xs transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
              <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Internal Notes</h2>
                <p className="text-xs text-muted-foreground">Private company remarks or SLA details.</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
                Account Notes <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Add internal notes, custom agreement terms, or account owner instructions..."
                {...register("notes")}
                className="min-h-[120px] text-xs rounded-lg"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-subtle p-5 flex flex-col gap-3">
            <Button
              type="submit"
              disabled={submitting || isDeleting}
              size="lg"
              className="w-full font-semibold shadow-xs gap-2 h-10 text-xs rounded-lg"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : client ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{client ? "Save Client Changes" : "Create Client Account"}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push(client ? `/clients/${client.id}` : "/clients")}
              className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel and Return
            </Button>

            {client && (
              <div className="pt-3 border-t border-border/80 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={isDeleting || submitting}
                  className="w-full text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40 transition-colors gap-1.5 h-9 rounded-lg"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete Client Account</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {client && (
        <ConfirmDialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          title={`Delete "${client.name}"?`}
          description="Are you sure you want to delete this client account? All associated products and tasks will be archived."
          confirmText={isDeleting ? "Deleting..." : "Delete Client"}
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDeleteClient}
        />
      )}
    </form>
  );
}
