"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@zsyio/ui";
import { cn } from "@/lib/utils";
import {
  GitBranch,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export interface GitBranchCardProps {
  branchName?: string | null;
  checkoutCmd?: string | null;
  prefix?: string;
  isAiGenerated?: boolean;
  isGenerating?: boolean;
  onRegenerate?: () => void;
  className?: string;
  emptyMessage?: string;
}

export function GitBranchCard({
  branchName,
  checkoutCmd,
  prefix = "feature",
  isAiGenerated = false,
  isGenerating = false,
  onRegenerate,
  className,
  emptyMessage = "Enter a task title to generate a Git branch workflow",
}: GitBranchCardProps) {
  const [copiedField, setCopiedField] = useState<"branch" | "cmd" | null>(null);

  const handleCopy = (text: string, field: "branch" | "cmd", label: string) => {
    if (!text || isGenerating) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasContent = Boolean(branchName || checkoutCmd);

  return (
    <div
      className={cn(
        "rounded-md border border-border/80 bg-card p-3.5 shadow-2xs hover:border-border transition-all flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <GitBranch className="w-3 h-3" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Git Branch
          </span>
          {isAiGenerated && !isGenerating && (
            <span className="text-[9px] font-bold font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-sm">
              AI
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isGenerating || !hasContent}
              className={cn(
                "text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-md cursor-pointer transition-colors flex items-center gap-1",
                (isGenerating || !hasContent) && "opacity-50 cursor-not-allowed"
              )}
              title="Regenerate branch name with Gemini AI"
            >
              <RefreshCw className={cn("w-2.5 h-2.5", isGenerating && "animate-spin")} />
              <span>{isGenerating ? "Generating..." : "Regen"}</span>
            </button>
          )}
          <Badge
            variant="outline"
            className="font-mono text-[10px] font-bold text-primary bg-primary/10 border-primary/20 px-1.5 py-0.5"
          >
            {prefix}/
          </Badge>
        </div>
      </div>

      {!hasContent && !isGenerating ? (
        <div className="py-4 text-center text-xs text-muted-foreground/60 italic bg-muted/20 rounded-xl border border-border/40 px-3">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-semibold">Branch Name</span>
              {!isGenerating && branchName && (
                <button
                  type="button"
                  onClick={() => handleCopy(branchName, "branch", "Branch name")}
                  className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copiedField === "branch" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === "branch" ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>

            {isGenerating ? (
              <div className="flex items-center gap-2 font-mono text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-2 rounded-md border border-purple-500/30 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-500 shrink-0" />
                <span className="truncate">Generating clean Git branch slug with AI...</span>
              </div>
            ) : (
              <div className="font-mono text-xs text-foreground bg-muted/50 px-3 py-2 rounded-md border border-border/60 overflow-x-auto whitespace-nowrap scrollbar-none font-medium select-all">
                {branchName}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-semibold flex items-center gap-1 font-mono">
                <Terminal className="w-3 h-3 text-emerald-400" /> Checkout
              </span>
              {!isGenerating && checkoutCmd && (
                <button
                  type="button"
                  onClick={() => handleCopy(checkoutCmd, "cmd", "Checkout command")}
                  className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium font-mono"
                >
                  {copiedField === "cmd" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === "cmd" ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>

            {isGenerating ? (
              <div className="rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 px-3 py-2 flex items-center justify-between gap-2 shadow-inner">
                <div className="font-mono text-xs text-purple-400 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none select-all leading-tight flex-1 min-w-0 animate-pulse">
                  <span className="text-zinc-500 select-none shrink-0">$</span>
                  <span className="text-purple-400 font-semibold shrink-0">git checkout -b</span>
                  <span className="text-purple-300 italic">generating-branch-slug...</span>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 px-3 py-2 flex items-center justify-between gap-2 shadow-inner">
                <div className="font-mono text-xs text-emerald-400 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none select-all leading-tight flex-1 min-w-0">
                  <span className="text-zinc-500 select-none shrink-0">$</span>
                  <span className="text-emerald-400 font-semibold shrink-0">git checkout -b</span>
                  <span className="text-emerald-300">{branchName}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
