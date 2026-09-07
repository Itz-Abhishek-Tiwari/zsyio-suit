"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CodeBlock } from "@tiptap/extension-code-block";
import { CodeBlockView } from "./CodeBlockView";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Markdown } from "tiptap-markdown";
import {
  cn,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@zsyio/ui";
import { optimizeImage } from "./clipboard-helper";
import { FormattedText } from "./FormattedText";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Code,
  FileCode,
  Quote,
  Link as LinkIcon,
  Table as TableIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Minus,
  Eye,
  Edit3,
  Trash2,
  BetweenVerticalStart,
  BetweenVerticalEnd,
  BetweenHorizontalStart,
  BetweenHorizontalEnd,
  TableProperties,
  Workflow,
  Network,
} from "lucide-react";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  contentClassName?: string;
  editable?: boolean;
  hideReviewButton?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write detailed specifications, notes, or acceptance criteria...",
  minHeight = "min-h-[220px]",
  className,
  contentClassName,
  editable = true,
  hideReviewButton = false,
}: RichTextEditorProps) {
  const [isReview, setIsReview] = useState(false);
  const [isTableActive, setIsTableActive] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false,
        blockquote: {
          HTMLAttributes: {
            class:
              "border-l border-border pl-3.5 py-1 my-2 text-muted-foreground italic bg-surface-subtle/40 rounded-r-md",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc list-outside ml-4 space-y-1 my-2",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal list-outside ml-4 space-y-1 my-2",
          },
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-xl border border-border/80 my-3 max-h-[380px] object-contain shadow-xs",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose space-y-1.5 my-2 list-none p-0",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2 text-foreground",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "w-full border-collapse my-3 text-xs rounded-lg overflow-hidden border border-border",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-border/60 hover:bg-muted/20 transition-colors",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "bg-surface-subtle border-b border-border px-3 py-2 text-left font-bold text-foreground",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border/50 px-3 py-2 text-foreground/90",
        },
      }),
      CodeBlock.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView);
        },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: false,
        transformCopiedText: true,
      }),
    ],
    content: value || "",
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose dark:prose-invert max-w-none focus:outline-none text-xs sm:text-sm leading-relaxed font-sans text-foreground",
          contentClassName ?? "p-4",
          minHeight
        ),
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items || items.length === 0) return false;

        let hasImage = false;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            hasImage = true;
            const file = item.getAsFile();
            if (file) {
              optimizeImage(file).then(({ fileUrl, fileName }) => {
                const { state, dispatch } = view;
                const imageType = state.schema.nodes.image;
                if (imageType) {
                  const node = imageType.create({ src: fileUrl, alt: fileName });
                  const tr = state.tr.replaceSelectionWith(node).scrollIntoView();
                  dispatch(tr);
                }
              });
            }
          }
        }
        return hasImage;
      },
    },
    onSelectionUpdate: ({ editor: ed }) => {
      setIsTableActive(ed.isActive("table"));
    },
    onTransaction: ({ editor: ed }) => {
      setIsTableActive(ed.isActive("table"));
    },
    onUpdate: ({ editor: ed }) => {
      setIsTableActive(ed.isActive("table"));
      // Get output as markdown for backward compatibility with database & API
      const markdownOutput = (ed.storage as unknown as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown?.() ?? ed.getHTML();
      onChange(markdownOutput);
    },
  });

  // Sync table active state whenever editor updates
  useEffect(() => {
    if (editor) {
      setIsTableActive(editor.isActive("table"));
    }
  }, [editor]);

  // Sync external value updates to editor if changed outside
  useEffect(() => {
    if (!editor) return;
    const currentMarkdown = (editor.storage as unknown as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown?.() ?? "";
    if (value !== currentMarkdown && !editor.isFocused) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const insertTable = useCallback((rows = 3, cols = 3) => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, []);

  const insertMermaidDiagram = useCallback((type: "flow" | "sequence" | "state" | "er" | "git" = "flow") => {
    if (!editor) return;
    let snippet = "";
    switch (type) {
      case "flow":
        snippet = "\n```mermaid\ngraph LR\n  Client[Web Client] --> Gateway[API Gateway]\n  Gateway --> ServiceA[Auth Service]\n  Gateway --> ServiceB[Core API]\n  ServiceB --> DB[(PostgreSQL)]\n```\n";
        break;
      case "sequence":
        snippet = "\n```mermaid\nsequenceDiagram\n  autonumber\n  User->>Client: Perform Action\n  Client->>API: POST /api/v1/resource\n  API->>Database: Transaction\n  Database-->>API: 200 OK\n  API-->>Client: Success\n```\n";
        break;
      case "state":
        snippet = "\n```mermaid\nstateDiagram-v2\n  [*] --> Draft\n  Draft --> Review: Submit\n  Review --> Approved: Accept\n  Review --> Draft: Changes Requested\n  Approved --> Production: Deploy\n  Production --> [*]\n```\n";
        break;
      case "er":
        snippet = "\n```mermaid\nerDiagram\n  ORGANIZATION ||--o{ USER : contains\n  USER ||--o{ TASK : assigns\n  USER ||--o{ NOTE : authors\n  TASK ||--o{ ATTACHMENT : includes\n```\n";
        break;
      case "git":
        snippet = "\n```mermaid\ngitGraph\n  commit id: \"Initial\"\n  branch feature/architecture\n  checkout feature/architecture\n  commit id: \"Add RFC\"\n  checkout main\n  merge feature/architecture id: \"Release\"\n```\n";
        break;
    }
    editor.chain().focus().insertContent(snippet).run();
    toast.success("Mermaid architecture diagram template inserted");
  }, [editor]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const { fileUrl, fileName } = await optimizeImage(file);
      editor.chain().focus().setImage({ src: fileUrl, alt: fileName }).run();
    } catch {
      // ignore
    } finally {
      e.target.value = "";
    }
  };

  if (!editor) {
    return (
      <div className={cn("flex flex-col rounded-xl p-4", minHeight, className)}>
        <span className="text-xs text-muted-foreground animate-pulse">Loading visual editor...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl transition-all",
        className
      )}
    >
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />
      {editable && (
        <div className="sticky top-0 z-20 flex flex-col border border-border/70 bg-card/90 dark:bg-card/90 backdrop-blur-md rounded-xl shadow-2xs mb-2 transition-all">
          <div className="flex items-center justify-between px-3 py-2 flex-wrap gap-1.5">
            {isReview ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                  <Eye className="w-3.5 h-3.5" /> Reviewing Published View
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  title="Heading 1"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("heading", { level: 1 })
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  title="Heading 2"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("heading", { level: 2 })
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  title="Heading 3"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("heading", { level: 3 })
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-border/60 mx-1 hidden sm:block" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  title="Bold (⌘+B)"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("bold")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  title="Italic (⌘+I)"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("italic")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  title="Strikethrough"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("strike")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  title="Inline Code"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("code")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Code className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-border/60 mx-1 hidden sm:block" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  title="Bullet List"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("bulletList")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  title="Numbered List"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("orderedList")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                  title="Task Checklist"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("taskList")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-border/60 mx-1 hidden sm:block" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  title="Quote"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("blockquote")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  title="Code Block"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("codeBlock")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <FileCode className="w-3.5 h-3.5" />
                </button>

                {/* Insert Mermaid Diagram Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      title="Insert Mermaid Architecture Diagram"
                      className="p-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                    >
                      <Workflow className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-xl shadow-xl border border-border/80">
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold px-2 py-1">
                      Insert Mermaid Diagram
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() => insertMermaidDiagram("flow")}
                      className="text-xs gap-2.5 p-2 cursor-pointer rounded-lg"
                    >
                      <Workflow className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Architecture Flow</span>
                        <span className="text-[10px] text-muted-foreground">graph LR services & components</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => insertMermaidDiagram("sequence")}
                      className="text-xs gap-2.5 p-2 cursor-pointer rounded-lg"
                    >
                      <Network className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Sequence Diagram</span>
                        <span className="text-[10px] text-muted-foreground">Client-server request lifecycle</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => insertMermaidDiagram("state")}
                      className="text-xs gap-2.5 p-2 cursor-pointer rounded-lg"
                    >
                      <Workflow className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">State Machine</span>
                        <span className="text-[10px] text-muted-foreground">State transitions & lifecycle</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => insertMermaidDiagram("er")}
                      className="text-xs gap-2.5 p-2 cursor-pointer rounded-lg"
                    >
                      <TableProperties className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Entity Relationship (ER)</span>
                        <span className="text-[10px] text-muted-foreground">Database schema relationships</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => insertMermaidDiagram("git")}
                      className="text-xs gap-2.5 p-2 cursor-pointer rounded-lg"
                    >
                      <FileCode className="w-4 h-4 text-sky-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Git Branch Graph</span>
                        <span className="text-[10px] text-muted-foreground">Branching & release workflows</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={setLink}
                  title="Link"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("link")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>

                {/* Enhanced Table Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      title="Table actions & insertion"
                      className={cn(
                        "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                        isTableActive
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1.5 rounded-xl shadow-xl border border-border/80">
                    {editor.isActive("table") ? (
                      <>
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold px-2 py-1">
                          Table Column Controls
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onSelect={() => editor.chain().focus().addColumnBefore().run()}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <BetweenVerticalStart className="w-3.5 h-3.5 text-primary" />
                          <span>Add Column to Left</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => editor.chain().focus().addColumnAfter().run()}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <BetweenVerticalEnd className="w-3.5 h-3.5 text-primary" />
                          <span>Add Column to Right</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => editor.chain().focus().deleteColumn().run()}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Current Column</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1" />

                        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold px-2 py-1">
                          Table Row Controls
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onSelect={() => editor.chain().focus().addRowBefore().run()}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <BetweenHorizontalStart className="w-3.5 h-3.5 text-primary" />
                          <span>Add Row Above</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => editor.chain().focus().addRowAfter().run()}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <BetweenHorizontalEnd className="w-3.5 h-3.5 text-primary" />
                          <span>Add Row Below</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => editor.chain().focus().deleteRow().run()}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Current Row</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1" />

                        <DropdownMenuItem
                          onSelect={() => editor.chain().focus().toggleHeaderRow().run()}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <TableProperties className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Toggle Header Row</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => editor.chain().focus().deleteTable().run()}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg text-destructive hover:bg-destructive/10 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Entire Table</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold px-2 py-1">
                          Insert Table
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onSelect={() => insertTable(3, 3)}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <TableIcon className="w-3.5 h-3.5 text-primary" />
                          <span>Standard Table (3 × 3)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => insertTable(2, 2)}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <TableIcon className="w-3.5 h-3.5 text-primary" />
                          <span>Compact Table (2 × 2)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => insertTable(4, 4)}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <TableIcon className="w-3.5 h-3.5 text-primary" />
                          <span>Medium Grid (4 × 4)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => insertTable(5, 5)}
                          className="text-xs gap-2 p-2 cursor-pointer rounded-lg"
                        >
                          <TableIcon className="w-3.5 h-3.5 text-primary" />
                          <span>Large Grid (5 × 5)</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertImage}
                  title="Insert Image (or paste screenshot with ⌘V)"
                  className={cn(
                    "p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    editor.isActive("image")
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  title="Horizontal Divider"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              {!isReview && (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (⌘+Z)"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (⌘+Shift+Z)"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-border/60 mx-0.5" />
                </>
              )}

              {!hideReviewButton && (
                <button
                  type="button"
                  onClick={() => setIsReview(!isReview)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer",
                    isReview
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted/80 text-foreground hover:bg-muted hover:text-primary border border-border/70"
                  )}
                >
                  {isReview ? (
                    <>
                      <Edit3 className="w-3 h-3" /> Back to Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 text-primary" /> Review
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Contextual Table Controls Ribbon - single clean line, never wraps, auto-hides */}
          {!isReview && isTableActive && (
            <div className="flex items-center justify-between px-3 py-1 bg-surface-subtle/90 border-t border-border/60 text-xs select-none gap-2 overflow-x-auto custom-scrollbar flex-nowrap">
              <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold text-primary bg-primary/10 shrink-0">
                  <TableIcon className="w-3 h-3" />
                  <span>Table</span>
                </div>

                <div className="w-px h-3.5 bg-border/80 mx-0.5 shrink-0" />

                {/* Column controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-1">Col</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    title="Add column to left"
                    className="p-1 rounded hover:bg-card hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                  >
                    <BetweenVerticalStart className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    title="Add column to right"
                    className="p-1 rounded hover:bg-card hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                  >
                    <BetweenVerticalEnd className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    title="Delete column"
                    className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-px h-3.5 bg-border/80 mx-0.5 shrink-0" />

                {/* Row controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-1">Row</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    title="Add row above"
                    className="p-1 rounded hover:bg-card hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                  >
                    <BetweenHorizontalStart className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    title="Add row below"
                    className="p-1 rounded hover:bg-card hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                  >
                    <BetweenHorizontalEnd className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    title="Delete row"
                    className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-px h-3.5 bg-border/80 mx-0.5 shrink-0" />

                {/* Header & formatting */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                    title="Toggle header row"
                    className="px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <TableProperties className="w-3 h-3" />
                    <span>Header</span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().mergeOrSplit().run()}
                    title="Merge or split selected cells"
                    className="px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                  >
                    Merge/Split
                  </button>
                </div>
              </div>

              {/* Delete table */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Delete entire table"
                className="px-2 py-0.5 rounded text-[11px] font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer flex items-center gap-1 shrink-0 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Table</span>
              </button>
            </div>
          )}
        </div>
      )}

      {isReview ? (
        <div className={cn("p-4 bg-card/60 overflow-y-auto", minHeight)}>
          {value?.trim() ? (
            <FormattedText content={value} />
          ) : (
            <span className="text-xs text-muted-foreground/50 italic">Nothing to review yet.</span>
          )}
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

