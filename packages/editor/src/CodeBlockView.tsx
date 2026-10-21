"use client";

import React, { useState, useMemo } from "react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { MermaidDiagram } from "./MermaidDiagram";
import { Code2, Network, Eye, Edit3, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cleanMermaidCode, isMermaidCode, getMermaidDiagramType } from "./mermaid-utils";
import { cn } from "@zsyio/ui";

export function CodeBlockView({ node }: NodeViewProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const textContent = node.textContent || "";
  const language = (node.attrs?.language || "").toLowerCase();

  const isMermaid = useMemo(() => {
    return isMermaidCode(textContent, language);
  }, [language, textContent]);

  const cleanedMermaid = useMemo(() => {
    return cleanMermaidCode(textContent);
  }, [textContent]);

  const diagramType = useMemo(() => {
    return getMermaidDiagramType(textContent);
  }, [textContent]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isMermaid) {
    return (
      <NodeViewWrapper className="my-5 not-prose">
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs transition-all">
          {/* Unified Single Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-subtle/80 dark:bg-card/80 border-b border-border/60 text-xs select-none gap-2 flex-wrap">
            {/* Left: Icon + Title + Diagram Type */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                <Network className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-foreground text-xs">Architecture Diagram</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-subtle text-muted-foreground border border-border/60 font-medium">
                {diagramType}
              </span>
            </div>

            {/* Right: Mode Toggle [Diagram | Edit Syntax] + Copy */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-background/80 dark:bg-muted/40 p-0.5 rounded-lg border border-border/70 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowCode(false)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                    !showCode
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="View Diagram"
                >
                  <Eye className="w-3 h-3" />
                  <span>Diagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCode(true)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                    showCode
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Edit Mermaid Code"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Syntax</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground bg-background/80 hover:bg-muted/80 border border-border/70 transition-colors shadow-2xs cursor-pointer"
                title="Copy Mermaid Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Editable Code View (expanded when editing syntax) */}
          <div className={showCode ? "p-3 bg-foreground text-muted-foreground border-b border-border/60" : "hidden"}>
            <pre className="font-mono text-xs leading-relaxed overflow-x-auto selection:bg-primary/30 p-2">
              <NodeViewContent className="outline-none" />
            </pre>
          </div>

          {/* Live Diagram Displayed Directly (Bare mode, no inner card, no nested header) */}
          <div className={!showCode ? "block" : "hidden"}>
            {cleanedMermaid ? (
              <MermaidDiagram code={cleanedMermaid} bare={true} initialSizeMode="fit" />
            ) : (
              <div className="text-xs text-muted-foreground italic text-center py-8">
                Empty diagram. Click &quot;Edit Syntax&quot; to write Mermaid code.
              </div>
            )}
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Standard non-mermaid code block
  return (
    <NodeViewWrapper className="my-3.5 not-prose">
      <div className="overflow-hidden rounded-lg border border-border/80 bg-foreground shadow-md group">
        <div className="flex items-center justify-between px-3.5 py-2 bg-foreground/90 border-b border-border/40 text-xs select-none">
          <span className="text-muted-foreground font-mono text-xs font-semibold  flex items-center gap-1.5">
            <Code2 className="w-3 h-3 text-primary" />
            {(language || "CODE").toUpperCase()}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-muted-foreground bg-foreground/80 hover:bg-foreground/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
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
          <NodeViewContent className="outline-none" />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
