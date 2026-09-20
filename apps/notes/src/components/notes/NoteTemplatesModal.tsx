"use client";

import React, { useState, useMemo } from "react";
import { Modal, Badge, Input, motion, AnimatePresence, SegmentedTabs } from "@zsyio/ui";
import { useGetNoteTemplatesQuery, useCreateNoteMutation, type NoteItem } from "@/store/api/notesApi";
import { FormattedText, NoteIcon } from "@zsyio/editor";
import { LayoutTemplate, ArrowRight, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@zsyio/ui";

interface NoteTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | null;
  onNoteCreated: (note: NoteItem) => void;
}

const CATEGORIES = ["All", "Clinical", "Product", "Engineering", "Operations"] as const;

export function NoteTemplatesModal({
  open,
  onOpenChange,
  folderId,
  onNoteCreated,
}: NoteTemplatesModalProps) {
  const { data: templatesData, isLoading } = useGetNoteTemplatesQuery(undefined, { skip: !open });
  const templates = useMemo(() => templatesData?.templates ?? [], [templatesData?.templates]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("clinical-protocol");
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = selectedCategory === "All" || t.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const selectedTemplate = useMemo(() => {
    return (
      templates.find((t) => t.id === selectedTemplateId) ||
      filteredTemplates[0] ||
      templates[0]
    );
  }, [templates, selectedTemplateId, filteredTemplates]);

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const created = await createNote({
        title: selectedTemplate.title,
        content: selectedTemplate.content,
        icon: selectedTemplate.icon,
        coverImage: selectedTemplate.coverImage,
        folderId: folderId || null,
        templateId: selectedTemplate.id,
      }).unwrap();

      toast.success(`Created note from "${selectedTemplate.title}"`);
      onNoteCreated(created);
      onOpenChange(false);
    } catch {
      toast.error("Failed to create note from template");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Template Gallery"
      description="Jumpstart your documentation with battle-tested team and clinical protocols"
      icon={<LayoutTemplate className="w-4 h-4" />}
      iconVariant="primary"
      className="sm:max-w-4xl lg:max-w-5xl"
      bodyClassName="p-0 flex flex-col md:flex-row h-[580px] max-h-[82vh] overflow-hidden"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              Category:
            </span>
            <Badge variant="outline" className="text-[11px] font-mono border-primary/20 text-primary bg-primary/5">
              {selectedTemplate?.category || "General"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleUseTemplate}
              disabled={isCreating || !selectedTemplate}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 shadow-xs shadow-primary/20"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Instantiate Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      }
    >
      {/* Left Sidebar: Filters + Template list */}
      <div className="w-full md:w-80 border-r border-border/80 bg-surface-subtle/30 p-3.5 overflow-y-auto flex flex-col gap-3 shrink-0 custom-scrollbar">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/70" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="h-8 pl-8 pr-7 text-xs rounded-md bg-surface-subtle/80 hover:bg-surface-subtle focus:bg-card border-border/60 focus:border-primary/50 transition-all shadow-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="overflow-x-auto pb-0.5 no-scrollbar">
          <SegmentedTabs
            tabs={CATEGORIES.map((cat) => ({
              id: cat,
              label: cat,
            }))}
            value={selectedCategory}
            onChange={setSelectedCategory}
            size="sm"
          />
        </div>

        {/* Template Cards */}
        <div className="flex flex-col gap-1.5 pt-1">
          {isLoading && (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {filteredTemplates.map((t) => {
            const isSelected = t.id === selectedTemplate?.id;
            return (
              <motion.button
                whileHover={{ x: 2 }}
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplateId(t.id)}
                className={cn(
                  "w-full flex items-start gap-2.5 p-2.5 rounded-md text-left transition-all duration-150 cursor-pointer border select-none",
                  isSelected
                    ? "bg-surface-elevated text-foreground border-primary/30 shadow-xs ring-1 ring-primary/20"
                    : "border-transparent hover:bg-surface-elevated/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                    isSelected
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "bg-surface-subtle border border-border/70 text-muted-foreground"
                  )}
                >
                  <NoteIcon icon={t.icon} size="sm" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={cn("text-xs truncate leading-tight", isSelected ? "font-bold text-foreground" : "font-medium")}>
                    {t.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1 mt-1 leading-snug">
                    {t.description}
                  </span>
                </div>
              </motion.button>
            );
          })}

          {filteredTemplates.length === 0 && !isLoading && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No matching templates found
            </div>
          )}
        </div>
      </div>

      {/* Right Preview Canvas with smooth transition */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-card p-6 sm:p-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          {selectedTemplate ? (
            <motion.div
              key={selectedTemplate.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5 max-w-2xl mx-auto w-full"
            >
              {selectedTemplate.coverImage && (
                <div
                  className="h-28 sm:h-36 rounded-lg w-full shrink-0 shadow-xs border border-border/60"
                  style={{ background: selectedTemplate.coverImage }}
                />
              )}

              {/* Document Icon */}
              <div className={cn("flex items-center", selectedTemplate.coverImage ? "-mt-10 sm:-mt-12 ml-4 relative z-10 w-fit" : "w-fit")}>
                <div className="inline-flex items-center justify-center p-2 rounded-lg bg-card border border-border/60 shadow-md select-none">
                  <NoteIcon icon={selectedTemplate.icon} size="xl" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground font-display tracking-tight leading-tight">
                  {selectedTemplate.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedTemplate.description}</p>
              </div>

              {/* Template Markdown Content Preview */}
              <div className="p-6 rounded-lg border border-border/80 bg-surface-subtle/30 shadow-2xs">
                <FormattedText content={selectedTemplate.content} />
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Select a template from the gallery
            </div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
