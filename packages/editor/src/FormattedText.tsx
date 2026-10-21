"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@zsyio/ui";
import {
  AtSign,
  Check,
  Copy,
  Info,
  AlertTriangle,
  AlertOctagon,
  Lightbulb,
  ShieldAlert,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { NoteCardPreview } from "./NoteCardPreview";
import { extractNoteId } from "./note-url-utils";
import { MermaidDiagram } from "./MermaidDiagram";
import { isMermaidCode, cleanMermaidCode } from "./mermaid-utils";

export interface FormattedTextProps {
  content: string;
  className?: string;
  disableNotePreviews?: boolean;
}

/**
 * Code Block Component with Header, Language Badge, Window Dots & Copy Button
 */
function CodeBlock({
  language,
  children,
}: {
  language?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = (language || "code").replace(/^language-/, "").toUpperCase();

  const isMermaid = isMermaidCode(codeString, language);

  if (isMermaid) {
    return <MermaidDiagram code={cleanMermaidCode(codeString)} />;
  }

  return (
    <div className="my-3.5 overflow-hidden rounded-lg border border-border/80 bg-foreground shadow-md group">
      <div className="flex items-center justify-between px-3.5 py-2 bg-foreground/90 border-b border-border/40 text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/80 inline-block" />
          </div>
          <span className="text-muted-foreground font-mono text-xs font-semibold  ml-1 flex items-center gap-1">
            <Code2 className="w-3 h-3 text-primary" />
            {displayLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-muted-foreground bg-foreground/80 hover:bg-foreground/80 px-2 py-0.5 rounded-md transition-colors shadow-2xs cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-success" />
              <span className="text-success font-semibold text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 text-muted-foreground font-mono text-[12px] leading-relaxed overflow-x-auto selection:bg-primary/30">
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

/**
 * Callout / Alert Box for GitHub-style [!NOTE], [!WARNING], [!IMPORTANT], etc.
 */
function CalloutBox({ text, children }: { text: string; children: React.ReactNode }) {
  const isNote = text.includes("[!NOTE]");
  const isWarning = text.includes("[!WARNING]");
  const isImportant = text.includes("[!IMPORTANT]");
  const isTip = text.includes("[!TIP]");
  const isCaution = text.includes("[!CAUTION]");

  if (isNote || isWarning || isImportant || isTip || isCaution) {
    let icon = <Info className="w-4 h-4 text-notion-blue-fg shrink-0 mt-0.5" />;
    let title = "Note";
    let bgClass = "bg-notion-blue-fg/70 border-notion-blue-fg/30 text-notion-blue-fg";

    if (isWarning) {
      icon = <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />;
      title = "Warning";
      bgClass = "bg-warning/70 border-warning/30 text-warning";
    } else if (isImportant) {
      icon = <AlertOctagon className="w-4 h-4 text-notion-purple-fg shrink-0 mt-0.5" />;
      title = "Important";
      bgClass = "bg-notion-purple-fg/70 border-notion-purple-fg/30 text-notion-purple-fg";
    } else if (isTip) {
      icon = <Lightbulb className="w-4 h-4 text-success shrink-0 mt-0.5" />;
      title = "Tip";
      bgClass = "bg-success/70 border-success/30 text-success";
    } else if (isCaution) {
      icon = <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />;
      title = "Caution";
      bgClass = "bg-destructive/70 border-destructive/30 text-destructive";
    }

    return (
      <div className={cn("my-3 p-3.5 rounded-lg border flex items-start gap-3 shadow-2xs", bgClass)}>
        {icon}
        <div className="flex flex-col gap-1 text-xs sm:text-sm leading-relaxed flex-1">
          <span className="font-semibold tracking-tight text-xs  opacity-90">{title}</span>
          <div className="[&>p]:my-0">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <blockquote className="border-l border-border pl-3.5 py-1.5 my-2.5 text-muted-foreground italic bg-surface-subtle/50 rounded-r-md">
      {children}
    </blockquote>
  );
}

/**
 * Helper to render plain text with @mentions highlighted as interactive pills/chips.
 */
function renderWithMentions(text: string) {
  if (!text || typeof text !== "string" || !text.includes("@")) {
    return text;
  }

  const mentionRegex = /@\[([^\]]+)\](?:\([^)]+\))?|@([a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)?)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const displayName = (match[1] || match[2] || "").replace(/^@/, "").trim();

    parts.push(
      <span
        key={`mention-${match.index}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-notion-purple-fg/15 text-notion-purple-fg border border-notion-purple-fg/25 font-semibold text-xs align-baseline shadow-2xs select-none hover:bg-notion-purple-fg/25 transition-colors cursor-pointer"
        title={`Mention: @${displayName}`}
      >
        <AtSign className="w-2.5 h-2.5 text-notion-purple-fg shrink-0" />
        <span>{displayName}</span>
      </span>
    );

    lastIndex = mentionRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}

function processChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderWithMentions(child);
    }
    return child;
  });
}

/**
 * Sanitizes URLs to prevent XSS (blocks javascript:, vbscript:, and unsafe data URIs).
 * data:image/ URIs are allowed except svg+xml, which can embed and execute script.
 */
function isSafeMarkdownUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("mention:")) return true;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true;
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) return true;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  if (trimmed.startsWith("data:image/") && !trimmed.startsWith("data:image/svg+xml")) return true;
  return false;
}

export function FormattedText({ content, className, disableNotePreviews = false }: FormattedTextProps) {
  if (!content) return null;

  const normalizedContent = content
    .replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "[@$1](mention:$2)")
    .replace(/@\[([^\]]+)\]/g, "[@$1](mention)")
    .replace(
      /(^|[\s\n])(\/(?:notes\?id=[a-zA-Z0-9_-]+|notes\/[a-zA-Z0-9_-]+))(?=[\s\n]|$|[.,;:)])/g,
      "$1[$2]($2)"
    );

  return (
    <div className={cn("text-xs sm:text-sm leading-relaxed text-foreground space-y-2.5", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (isSafeMarkdownUrl(url) ? url : "")}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-semibold font-display text-foreground mt-5 mb-2.5 tracking-tight border-b border-border/70 pb-1.5 flex items-center gap-2">
              {processChildren(children)}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-semibold font-display text-foreground mt-4 mb-2 tracking-tight border-b border-border/40 pb-1">
              {processChildren(children)}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-semibold font-display text-foreground mt-3.5 mb-1.5 tracking-tight flex items-center gap-1.5">
              {processChildren(children)}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold font-display text-foreground mt-2.5 mb-1 tracking-tight">
              {processChildren(children)}
            </h4>
          ),
          p: ({ children }) => <div className="my-1.5 text-foreground/90 leading-relaxed">{processChildren(children)}</div>,
          ul: ({ children }) => <ul className="list-disc list-outside pl-4 space-y-1.5 my-2.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside pl-4 space-y-1.5 my-2.5">{children}</ol>,
          li: ({ children }) => <li className="text-foreground/90 my-0.5 leading-relaxed">{processChildren(children)}</li>,
          blockquote: ({ children }) => {
            const rawText = React.Children.toArray(children)
              .map((c) => (typeof c === "string" ? c : ""))
              .join(" ");
            return <CalloutBox text={rawText}>{processChildren(children)}</CalloutBox>;
          },
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName && !String(children).includes("\n");
            if (isInline) {
              return (
                <code
                  className="font-mono text-xs px-1.5 py-0.5 rounded-md bg-muted text-foreground border border-border/80 font-semibold inline-block align-baseline mx-0.5 shadow-2xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock language={codeClassName}>{children}</CodeBlock>;
          },
          a: ({ href, children }) => {
            const isMention =
              href?.startsWith("mention:") ||
              (!href?.startsWith("http://") &&
                !href?.startsWith("https://") &&
                !href?.startsWith("mailto:") &&
                !href?.startsWith("/") &&
                !href?.startsWith("#"));

            if (isMention) {
              const label = String(children).replace(/^@/, "");
              return (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md bg-notion-purple-fg/15 text-notion-purple-fg border border-notion-purple-fg/25 font-semibold text-xs align-baseline shadow-2xs select-none hover:bg-notion-purple-fg/25 transition-colors cursor-pointer"
                  title={`Mention: @${label}`}
                >
                  <AtSign className="w-2.5 h-2.5 text-notion-purple-fg shrink-0" />
                  <span>{label}</span>
                </span>
              );
            }

            if (!isSafeMarkdownUrl(href)) {
              return <span>{children}</span>;
            }

            // If note preview is enabled and href points to a Zsyio Canvas note, render NoteCardPreview
            if (!disableNotePreviews) {
              const noteId = extractNoteId(href);
              if (noteId) {
                return (
                  <NoteCardPreview
                    noteId={noteId}
                    rawUrl={href}
                    customLabel={children}
                  />
                );
              }
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const srcUrl = typeof src === "string" ? src : undefined;
            if (!srcUrl) return null;
            return (
              <div className="my-3.5 overflow-hidden rounded-lg border border-border/80 bg-foreground/20 shadow-md group">
                <a href={srcUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden relative" title="Click to open full image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={srcUrl}
                    alt={typeof alt === "string" ? alt : "Task image"}
                    className="w-full max-h-[480px] object-contain rounded-lg  transition-transform duration-200"
                    loading="lazy"
                  />
                </a>
                {alt && (
                  <p className="text-xs text-muted-foreground text-center py-1.5 px-3 border-t border-border/40 bg-surface-subtle/50 font-medium">
                    {alt}
                  </p>
                )}
              </div>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3.5 rounded-lg border border-border/80 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-surface-subtle/80 border-b border-border/80 text-foreground font-semibold">{children}</thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-border/60">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3.5 py-2.5 text-xs font-semibold text-foreground">{children}</th>,
          td: ({ children }) => <td className="px-3.5 py-2.5 text-xs text-foreground/90">{processChildren(children)}</td>,
          hr: () => <hr className="my-5 border-border/60" />,
          input: ({ type, checked, disabled }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled ?? true}
                  className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-0 mr-2 align-middle accent-primary cursor-default"
                />
              );
            }
            return null;
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
