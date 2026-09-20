"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useGetNotesTreeQuery,
  useCreateNoteMutation,
  type NoteItem,
  type FolderItem,
} from "@/store/api/notesApi";
import dynamic from "next/dynamic";
import { NoteSidebarTree } from "./NoteSidebarTree";
import { NoteEditor } from "./NoteEditor";

const NoteShareModal = dynamic(() => import("./NoteShareModal").then((m) => m.NoteShareModal), { ssr: false });
const FolderShareModal = dynamic(() => import("./FolderShareModal").then((m) => m.FolderShareModal), { ssr: false });
const FolderModal = dynamic(() => import("./FolderModal").then((m) => m.FolderModal), { ssr: false });
const NoteTemplatesModal = dynamic(() => import("./NoteTemplatesModal").then((m) => m.NoteTemplatesModal), { ssr: false });
import { useUnsavedChanges, Button, DashboardHero } from "@zsyio/ui";
import { NOTE_TEMPLATES, NoteIcon } from "@zsyio/editor";
import {
  Plus,
  LayoutTemplate,
  Loader2,
  FolderPlus,
  Command,
  ArrowRight,
  BookOpen,
  FileText,
  FolderOpen,
} from "lucide-react";
import { motion, AnimatePresence, FadeIn, Stagger, StaggerItem, AnimatedCard } from "@zsyio/ui";
import { toast } from "sonner";

export function NoteWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirmNavigation } = useUnsavedChanges();

  const noteIdParam = searchParams.get("id");

  const { data: treeData, isLoading: isTreeLoading } = useGetNotesTreeQuery();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(noteIdParam);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareNoteModal, setShareNoteModal] = useState<NoteItem | null>(null);
  const [shareFolderModal, setShareFolderModal] = useState<FolderItem | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [templatesFolderId, setTemplatesFolderId] = useState<string | null>(null);

  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();

  // Sync URL search params
  useEffect(() => {
    if (noteIdParam) {
      setActiveNoteId(noteIdParam);
    } else if (treeData && !activeNoteId && treeData.notes.length > 0) {
      const firstNote = treeData.notes[0];
      if (firstNote) {
        setActiveNoteId(firstNote.id);
        router.replace(`/notes?id=${firstNote.id}`, { scroll: false });
      }
    }
  }, [noteIdParam, treeData, activeNoteId, router]);

  const handleSelectNote = (id: string) => {
    if (id === activeNoteId) return;
    confirmNavigation(() => {
      setActiveNoteId(id);
      router.push(`/notes?id=${id}`, { scroll: false });
    });
  };

  const handleOpenNewFolder = (parentId?: string | null) => {
    setEditingFolder(null);
    setNewFolderParentId(parentId || null);
    setFolderModalOpen(true);
  };

  const handleOpenEditFolder = (folder: FolderItem) => {
    setEditingFolder(folder);
    setFolderModalOpen(true);
  };

  const handleOpenShareFolder = (folder: FolderItem) => {
    setShareFolderModal(folder);
  };

  const handleOpenShareNote = (note: NoteItem) => {
    setShareNoteModal(note);
  };

  const handleOpenTemplates = (folderId?: string | null) => {
    confirmNavigation(() => {
      setTemplatesFolderId(folderId || null);
      setTemplatesModalOpen(true);
    });
  };

  const handleCreateBlankNote = async (folderId?: string | null) => {
    confirmNavigation(async () => {
      try {
        const created = await createNote({
          title: "Untitled",
          content: "",
          folderId: folderId || null,
        }).unwrap();
        setActiveNoteId(created.id);
        router.push(`/notes?id=${created.id}`, { scroll: false });
        toast.success("New document created");
      } catch {
        toast.error("Failed to create document");
      }
    });
  };

  const handleQuickInstantiateTemplate = async (templateId: string) => {
    const template = NOTE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    confirmNavigation(async () => {
      try {
        const created = await createNote({
          title: template.title,
          content: template.content,
          icon: template.icon,
          coverImage: template.coverImage,
          templateId: template.id,
        }).unwrap();
        setActiveNoteId(created.id);
        router.push(`/notes?id=${created.id}`, { scroll: false });
        toast.success(`Created "${template.title}" from template`);
      } catch {
        toast.error("Failed to create document from template");
      }
    });
  };

  if (isTreeLoading && !treeData) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-card">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-semibold text-muted-foreground animate-pulse">
            Loading your notes workspace...
          </span>
        </motion.div>
      </div>
    );
  }

  const defaultTree: typeof treeData = treeData || {
    folders: [],
    archivedFolders: [],
    notes: [],
    archivedNotes: [],
    starredNotes: [],
    sharedWithMeNotes: [],
    myRootNotes: [],
    otherRootNotes: [],
  };

  const featuredTemplates = NOTE_TEMPLATES.slice(0, 4);

  return (
    <div className="w-full h-full flex overflow-hidden bg-background">
      {/* 1. Left Hierarchical Navigation Sidebar */}
      <NoteSidebarTree
        tree={defaultTree}
        activeNoteId={activeNoteId}
        onSelectNote={handleSelectNote}
        onOpenNewFolder={handleOpenNewFolder}
        onOpenEditFolder={handleOpenEditFolder}
        onOpenShareFolder={handleOpenShareFolder}
        onOpenTemplates={handleOpenTemplates}
        onOpenShareNote={handleOpenShareNote}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 2. Main Editor Canvas or Welcome Dashboard with Smooth Animated Transition */}
      <div className="flex-1 h-full overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeNoteId ? (
            <motion.div
              key={activeNoteId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <NoteEditor
                noteId={activeNoteId}
                onOpenShareModal={(n) => setShareNoteModal(n)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="welcome-dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full overflow-y-auto bg-background p-6 sm:p-12 custom-scrollbar"
            >
              <div className="max-w-4xl mx-auto flex flex-col gap-10 py-6">
                {/* Executive Command Hero Deck */}
                <FadeIn direction="up" delay={0.05} className="w-full">
                  <DashboardHero
                    badge={{
                      label: "Canvas Knowledge Hub",
                      icon: BookOpen,
                      variant: "cyan",
                    }}
                    systemStatus={{
                      label: "CANVAS WORKSPACE READY",
                    }}
                    accentTone="cyan"
                    title={
                      <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
                        Knowledge Hub &amp; Workspaces
                      </h1>
                    }
                    description="Structured team documentation, clinical protocols, engineering RFCs, and collaborative wikis."
                    metrics={[
                      {
                        label: "Documents",
                        value: (defaultTree.notes?.length ?? 0) + (defaultTree.myRootNotes?.length ?? 0),
                        icon: FileText,
                        subtext: "Workspace notes",
                      },
                      {
                        label: "Folders",
                        value: defaultTree.folders?.length ?? 0,
                        icon: FolderOpen,
                        subtext: "Categories",
                      },
                      {
                        label: "Templates",
                        value: NOTE_TEMPLATES.length,
                        icon: LayoutTemplate,
                        subtext: "Ready to use",
                      },
                    ]}
                    actions={
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleCreateBlankNote()}
                          disabled={isCreating}
                          className="font-semibold text-xs h-8.5 px-3.5 gap-1.5 rounded-md shadow-xs bg-primary hover:bg-primary-hover text-primary-foreground"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Blank Page</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTemplates()}
                          className="font-semibold text-xs h-8.5 px-3.5 gap-1.5 rounded-md border-border/80 bg-surface-subtle/80 hover:bg-surface-subtle shadow-xs"
                        >
                          <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                          <span>Templates</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenNewFolder(null)}
                          className="font-semibold text-xs h-8.5 px-3.5 gap-1.5 rounded-md border-border/80 bg-surface-subtle/80 hover:bg-surface-subtle shadow-xs"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>New Folder</span>
                        </Button>
                      </>
                    }
                  />
                </FadeIn>

                {/* Featured Templates Grid with Staggered Cascading Entrance */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                      <span>Quick-Start Templates</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenTemplates()}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Templates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Stagger staggerInterval={0.06} delay={0.1} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {featuredTemplates.map((template) => (
                      <StaggerItem key={template.id} direction="up">
                        <AnimatedCard
                          hoverLift
                          hoverScale
                          onClick={() => handleQuickInstantiateTemplate(template.id)}
                          className="group relative p-4 rounded-lg border border-border/80 bg-card hover:border-primary/40 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between gap-3 select-none h-full"
                        >
                          <div className="flex items-start gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 4 }}
                              className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 transition-transform"
                            >
                              <NoteIcon icon={template.icon} size="md" />
                            </motion.div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {template.title}
                              </span>
                              <span className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                {template.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border/60">
                              {template.category}
                            </span>
                            <span className="text-primary font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Use Template</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </AnimatedCard>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>

                {/* Keyboard Shortcuts & Productivity Tips */}
                <FadeIn direction="up" delay={0.25}>
                  <div className="p-5 rounded-lg border border-border/80 bg-surface-subtle/50 shadow-2xs flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                      <Command className="w-3.5 h-3.5 text-primary" />
                      <span>Keyboard Shortcuts & Tips</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <motion.div whileHover={{ y: -2 }} className="flex items-center gap-2 p-2.5 rounded-md bg-card border border-border/60 shadow-2xs">
                        <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px] font-mono text-foreground font-bold">
                          ⌘ + S
                        </kbd>
                        <span className="text-muted-foreground text-[11px]">Instant Document Save</span>
                      </motion.div>
                      <motion.div whileHover={{ y: -2 }} className="flex items-center gap-2 p-2.5 rounded-md bg-card border border-border/60 shadow-2xs">
                        <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px] font-mono text-foreground font-bold">
                          ⌘ + K
                        </kbd>
                        <span className="text-muted-foreground text-[11px]">Global Command Search</span>
                      </motion.div>
                      <motion.div whileHover={{ y: -2 }} className="flex items-center gap-2 p-2.5 rounded-md bg-card border border-border/60 shadow-2xs">
                        <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px] font-mono text-foreground font-bold">
                          /
                        </kbd>
                        <span className="text-muted-foreground text-[11px]">Slash Blocks & Formatting</span>
                      </motion.div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {shareNoteModal && (
        <NoteShareModal
          note={shareNoteModal}
          open={Boolean(shareNoteModal)}
          onOpenChange={(v) => !v && setShareNoteModal(null)}
        />
      )}

      {shareFolderModal && (
        <FolderShareModal
          folder={shareFolderModal}
          open={Boolean(shareFolderModal)}
          onOpenChange={(v) => !v && setShareFolderModal(null)}
        />
      )}

      <FolderModal
        open={folderModalOpen}
        onOpenChange={setFolderModalOpen}
        folder={editingFolder}
        defaultParentId={newFolderParentId}
      />

      <NoteTemplatesModal
        open={templatesModalOpen}
        onOpenChange={setTemplatesModalOpen}
        folderId={templatesFolderId}
        onNoteCreated={(note) => handleSelectNote(note.id)}
      />
    </div>
  );
}
