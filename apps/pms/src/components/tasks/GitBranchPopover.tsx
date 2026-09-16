"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { Badge } from "@zsyio/ui";
import { generateGitBranchSuggestion } from "@/lib/git-branch-helper";
import { GitBranch, Copy, Check, Terminal, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { useGenerateAiBranchMutation } from "@/store/api/tasksApi";
import { toast } from "sonner";

interface GitBranchPopoverProps {
  task: {
    id: string;
    ticketNumber?: number | null;
    title: string;
    type?: string | null;
    gitBranchSlug?: string | null;
  };
  variant?: "outline" | "ghost" | "secondary" | "default";
  size?: "sm" | "default" | "xs";
  className?: string;
  showText?: boolean;
}

export function GitBranchPopover({
  task,
  variant = "outline",
  size = "sm",
  className = "",
  showText = true,
}: GitBranchPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<"cmd" | "branch" | "push" | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(task.gitBranchSlug || null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(Boolean(task.gitBranchSlug));

  const [generateAiBranch, { isLoading: isGeneratingAi }] = useGenerateAiBranchMutation();

  // Automatically lock branch prefix to the task's type
  const suggestion = generateGitBranchSuggestion({
    id: task.id,
    ticketNumber: task.ticketNumber,
    title: task.title,
    type: task.type,
    slugOverride: currentSlug || task.gitBranchSlug,
  });

  const handleCopy = (text: string, field: "cmd" | "branch" | "push", label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateAi = async (force = false) => {
    try {
      const res = await generateAiBranch({ id: task.id, force }).unwrap();
      setCurrentSlug(res.slug);
      setIsAiGenerated(true);
      if (res.source === "gemini" || res.source === "openai") {
        toast.success("Gemini generated a clean Git branch name! ✨");
      } else if (res.cached) {
        toast.info("Using cached branch name");
      } else {
        toast.success("Branch name generated");
      }
    } catch {
      toast.error("Failed to generate AI branch name");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !currentSlug && !task.gitBranchSlug && !isGeneratingAi) {
      handleGenerateAi(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size === "xs" ? "sm" : size}
          className={`gap-1.5 font-medium rounded-lg text-xs transition-colors cursor-pointer ${
            size === "xs" ? "h-7 px-2 text-[11px]" : "h-8"
          } ${className}`}
          title="Suggest Git branch name & checkout command"
        >
          <GitBranch className="w-3.5 h-3.5 text-primary" />
          {showText && <span>Git Branch</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[340px] sm:w-[420px] p-4.5 rounded-2xl border-border/80 bg-card shadow-2xl flex flex-col gap-3.5 z-50 text-foreground"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <GitBranch className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">Git Branch Suggestion</span>
                {isAiGenerated && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded-full">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground">{suggestion.shortId}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleGenerateAi(true)}
              disabled={isGeneratingAi}
              className="h-7 px-2.5 text-[11px] font-semibold gap-1 text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 rounded-lg cursor-pointer transition-colors"
              title="Regenerate a clean 2-4 word branch name with Gemini AI"
            >
              {isGeneratingAi ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span>{isGeneratingAi ? "Generating..." : "Regenerate AI"}</span>
            </Button>

            <Badge
              variant="outline"
              className="font-mono text-[11px] font-bold text-primary bg-primary/10 border-primary/20 px-2 py-0.5"
              title={`Branch prefix derived from ${task.type || "FEATURE"} ticket type`}
            >
              {suggestion.prefix}/
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground text-[11px]">Branch Name</span>
            <button
              type="button"
              onClick={() => handleCopy(suggestion.branchName, "branch", "Branch name")}
              className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors"
            >
              {copiedField === "branch" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-xs text-foreground bg-muted/40 px-3 py-2 rounded-xl border border-border/70 overflow-x-auto whitespace-nowrap scrollbar-none font-medium select-all">
            {suggestion.branchName}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 p-3.5 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Checkout Command
            </span>
            <button
              type="button"
              onClick={() => handleCopy(suggestion.checkoutCmd, "cmd", "Git command")}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono text-[11px] font-semibold cursor-pointer transition-colors"
            >
              {copiedField === "cmd" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="font-mono text-xs text-emerald-400 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none select-all pt-0.5 pb-0.5">
            <span className="text-zinc-500 select-none shrink-0">$</span>
            <span className="text-emerald-400 font-semibold shrink-0">git checkout -b</span>
            <span className="text-emerald-300">{suggestion.branchName}</span>
          </div>
        </div>

        <div className="pt-1 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Run in your local repository</span>
          <button
            type="button"
            onClick={() => handleCopy(suggestion.pushCmd, "push", "Git push command")}
            className="text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer flex items-center gap-1"
          >
            {copiedField === "push" ? (
              <span className="text-emerald-500 font-semibold">Copied push cmd</span>
            ) : (
              <span>Copy push cmd</span>
            )}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

