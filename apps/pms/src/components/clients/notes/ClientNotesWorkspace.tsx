"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useGetClientQuery, useUpdateClientMutation } from "@/store/api/clientsApi";
import { FormattedText } from "@zsyio/editor";

const RichTextEditor = dynamic(
  () => import("@zsyio/editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-lg border border-border/80 bg-surface-muted/30 animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading editor...
      </div>
    ),
  }
);
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { Button, SegmentedTabs, formatRelativeTime, Modal } from "@zsyio/ui";
import { can } from "@zsyio/auth/permissions";
import { toast } from "sonner";
import {
  Building2,
  StickyNote,
  Globe,
  Users,
  ArrowLeft,
  Save,
  Check,
  Loader2,
  ExternalLink,
  Lock,
  Sparkles,
  Eye,
  Edit3,
  Columns,
  Copy,
  FileText,
  ChevronRight,
} from "lucide-react";
import { CLIENT_DOC_TEMPLATES, type ClientDocTemplate } from "./client-notes-templates";
import type { Client } from "@zsyio/types";

interface ClientNotesWorkspaceProps {
  clientId: string;
  initialClient: Client;
  canEdit: boolean;
}

export function ClientNotesWorkspace({
  clientId,
  initialClient,
  canEdit,
}: ClientNotesWorkspaceProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = session?.user?.permissions;

  // Determine if the user has permission to edit this document
  const isEditable =
    canEdit ||
    can(userRole, "client:edit", userPermissions) ||
    can(userRole, "note:edit", userPermissions);

  // RTK Queries & Mutations
  const { data: client = initialClient } = useGetClientQuery(clientId);
  const [updateClient, { isLoading: isSavingManual }] = useUpdateClientMutation();

  // Document state
  const [documentContent, setDocumentContent] = useState(initialClient.notes || "");
  const [lastSavedContent, setLastSavedContent] = useState(initialClient.notes || "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [templateToApply, setTemplateToApply] = useState<ClientDocTemplate | null>(null);

  const hasUnsavedChanges = documentContent !== lastSavedContent;

  // Sync client notes if fetched client changes (e.g. a background refetch).
  // Only resync when there are no unsaved local edits, so an in-progress edit
  // is never silently overwritten by a cache update.
  useEffect(() => {
    if (
      client?.notes !== undefined &&
      client.notes !== lastSavedContent &&
      !hasUnsavedChanges
    ) {
      setDocumentContent(client.notes || "");
      setLastSavedContent(client.notes || "");
      setSaveStatus("saved");
    }
  }, [client?.notes, lastSavedContent, hasUnsavedChanges]);

  const handleContentChange = (newVal: string) => {
    setDocumentContent(newVal);
    if (!isEditable) return;

    if (newVal === lastSavedContent) {
      setSaveStatus("saved");
    } else {
      setSaveStatus("unsaved");
    }
  };

  const handleManualSave = useCallback(async () => {
    if (!isEditable) {
      toast.error("You do not have permission to edit this document");
      return;
    }
    try {
      setSaveStatus("saving");
      await updateClient({
        id: clientId,
        body: { notes: documentContent },
      }).unwrap();
      setLastSavedContent(documentContent);
      setSaveStatus("saved");
      setLastSavedAt(new Date());
      toast.success("Client documentation saved successfully");
    } catch (err: unknown) {
      setSaveStatus("unsaved");
      const msg = err instanceof Error ? err.message : "Failed to save document";
      toast.error(msg);
    }
  }, [isEditable, updateClient, clientId, documentContent]);

  // Keyboard shortcut: Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isEditable && hasUnsavedChanges && !isSavingManual) {
          handleManualSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditable, hasUnsavedChanges, isSavingManual, handleManualSave]);

  const handleTemplateClick = (tmpl: ClientDocTemplate) => {
    if (!documentContent.trim()) {
      handleContentChange(tmpl.content);
      toast.success(`"${tmpl.label}" template applied`);
      return;
    }
    setTemplateToApply(tmpl);
  };

  const handleAppendTemplate = () => {
    if (!templateToApply) return;
    const merged = `${documentContent.trim()}\n\n---\n\n${templateToApply.content}`;
    handleContentChange(merged);
    toast.success(`"${templateToApply.label}" template appended`);
    setTemplateToApply(null);
  };

  const handleReplaceTemplate = () => {
    if (!templateToApply) return;
    handleContentChange(templateToApply.content);
    toast.success(`"${templateToApply.label}" template applied`);
    setTemplateToApply(null);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(documentContent);
    toast.success("Markdown copied to clipboard");
  };

  const wordCount = useMemo(() => {
    const text = documentContent.trim();
    return text ? text.split(/\s+/).length : 0;
  }, [documentContent]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 max-w-7xl mx-auto w-full">
      {/* ── Top Header & Breadcrumbs ── */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/clients"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Clients</span>
            </Link>
            <ChevronRight className="w-3 h-3 opacity-50" />
            <Link
              href={`/clients/${clientId}`}
              className="hover:text-foreground transition-colors font-medium truncate max-w-[160px]"
            >
              {client.name}
            </Link>
            <ChevronRight className="w-3 h-3 opacity-50" />
            <span className="text-foreground font-semibold flex items-center gap-1.5 bg-primary-light text-primary px-2.5 py-0.5 rounded-md border border-primary/20">
              <StickyNote className="w-3.5 h-3.5" />
              <span>Primary Documentation</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <Link href={`/clients/${clientId}`}>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Client Profile</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <Link href="/clients/kanban">
                <Columns className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Client identity bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg border border-primary/30 flex items-center justify-center shadow-xs bg-primary/20">
              {client.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={client.logoUrl}
                  alt={client.name}
                  className="w-full h-full object-contain p-1 rounded-lg"
                />
              ) : (
                <StickyNote className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{client.name}</h1>
                <ClientStatusBadge status={client.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                {client.domain && (
                  <a
                    href={client.domain.startsWith("http") ? client.domain : `https://${client.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Globe className="w-3 h-3 opacity-70" />
                    <span>{client.domain.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                  </a>
                )}
                {client.contactName && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3 opacity-70" />
                    <span>Contact: <strong className="text-foreground">{client.contactName}</strong></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Save status badge */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-lg bg-surface-subtle border border-border/60">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  <span className="text-warning font-medium">Unsaved changes</span>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono px-2">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{documentContent.length} chars</span>
              {lastSavedAt && (
                <>
                  <span>•</span>
                  <span>Saved {formatRelativeTime(lastSavedAt)}</span>
                </>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="h-8 text-xs font-semibold gap-1.5"
              title="Copy markdown content"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Markdown</span>
            </Button>

            {isEditable && (
              <Button
                type="button"
                size="sm"
                onClick={handleManualSave}
                disabled={!hasUnsavedChanges || isSavingManual || saveStatus === "saving"}
                className={`h-8 text-xs font-semibold gap-1.5 shadow-xs transition-all ${
                  hasUnsavedChanges
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    : "opacity-60 bg-surface-subtle border border-border/60 text-muted-foreground hover:bg-surface-subtle"
                }`}
                title="Save changes (⌘+S)"
              >
                {isSavingManual || saveStatus === "saving" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Documentation</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Primary Documentation Editor Card ── */}
      <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-7 shadow-xs flex flex-col gap-5">
        {/* Header inside editor card */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shadow-2xs">
              <StickyNote className="w-4.5 h-4.5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>Client Documentation & Knowledge Base</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                Structured SLA, tech stack specifications, architecture, and account intelligence
              </span>
            </div>
          </div>

          {/* Editor / Preview Mode toggle */}
          <SegmentedTabs<"edit" | "preview">
            value={editorMode}
            onChange={setEditorMode}
            size="sm"
            tabs={[
              {
                id: "edit",
                label: "Editor",
                icon: <Edit3 className="w-3.5 h-3.5" />,
              },
              {
                id: "preview",
                label: "Preview",
                icon: <Eye className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>

        {/* Template quick pills */}
        {isEditable && (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-surface-subtle/50 p-3 rounded-lg border border-border/50">
            <span className="text-xs font-semibold   text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Insert Template:
            </span>
            {CLIENT_DOC_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleTemplateClick(tmpl)}
                title={tmpl.description}
                className="px-2.5 py-1 rounded-lg bg-card hover:bg-primary-light hover:text-primary text-muted-foreground border border-border/60 transition-colors text-xs font-medium shadow-2xs cursor-pointer"
              >
                + {tmpl.label}
              </button>
            ))}
          </div>
        )}

        {/* Rich Text Editor or Live Formatted Preview */}
        {editorMode === "edit" ? (
          <div className="relative">
            <RichTextEditor
              value={documentContent}
              onChange={handleContentChange}
              placeholder="Write detailed specifications, SLA details, tech stack notes, architectural diagrams, or account requirements..."
              minHeight="min-h-[520px]"
              editable={isEditable}
              hideReviewButton={true}
              className="border border-border/70 rounded-lg focus-within:border-primary/50 transition-all bg-card/80"
            />
            {!isEditable && (
              <div className="mt-3 p-3 rounded-lg bg-surface-subtle/60 border border-border/60 text-xs text-muted-foreground flex items-center gap-2 italic">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Read-only view. You do not have permissions to edit client documentation.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[520px] p-6 rounded-lg border border-border/70 bg-surface-subtle/30 overflow-y-auto">
            {documentContent.trim() ? (
              <FormattedText content={documentContent} />
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-muted-foreground gap-2.5">
                <FileText className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">No documentation written yet.</p>
                {isEditable ? (
                  <p className="text-xs text-muted-foreground/80 max-w-sm text-center">
                    Switch to the Editor tab or use one of the templates above to write client documentation.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/80">
                    No documentation has been published for this client.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── In-App Template Insertion Modal ── */}
      {templateToApply && (
        <Modal
          open={!!templateToApply}
          onOpenChange={(open) => {
            if (!open) setTemplateToApply(null);
          }}
          title={`Insert "${templateToApply.label}" Template`}
          description="Your document already contains content. How would you like to apply this template?"
          icon={<Sparkles className="w-4.5 h-4.5 text-primary" />}
          iconVariant="primary"
          size="md"
          footer={
            <div className="flex items-center justify-between gap-2 w-full flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTemplateToApply(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReplaceTemplate}
                  className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                >
                  Replace All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAppendTemplate}
                  className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                >
                  Append to Bottom
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="p-3.5 rounded-lg bg-surface-subtle border border-border/60 text-xs flex flex-col gap-1.5">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                {templateToApply.label}
              </span>
              <p className="text-muted-foreground leading-relaxed">{templateToApply.description}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose <strong className="text-foreground font-semibold">Append to Bottom</strong> to keep your current notes and add the template at the end, or <strong className="text-foreground font-semibold">Replace All</strong> to overwrite the current document.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
