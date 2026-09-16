"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@zsyio/ui";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { tasksApi } from "@/store/api/tasksApi";

interface AiSummaryCardProps {
  taskId: string;
  summary?: string | null;
  /** Whether the task has a non-empty description */
  hasDescription?: boolean;
  /** If true, shows the Regenerate button */
  canRegenerate?: boolean;
  className?: string;
}

/**
 * AiSummaryCard
 *
 * Displays the AI-generated management-friendly ticket summary with
 * real-time token-by-token streaming from Google Gemini.
 */
export function AiSummaryCard({
  taskId,
  summary,
  hasDescription = true,
  canRegenerate = true,
  className,
}: AiSummaryCardProps) {
  const dispatch = useAppDispatch();
  const [streamedText, setStreamedText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoStreamTriggeredRef = useRef<string | null>(null);

  // Sync external summary when not actively streaming
  useEffect(() => {
    if (!isStreaming) {
      setStreamedText(summary ?? "");
    }
  }, [summary, isStreaming]);

  // Clean up any ongoing stream on unmount or task switch
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [taskId]);

  const handleStartStream = useCallback(async () => {
    if (isStreaming) return;

    if (!hasDescription) {
      toast.error("Please add a ticket description first before generating an AI summary.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsStreaming(true);
    setStreamedText("");

    try {
      const response = await fetch(`/api/tasks/${taskId}/ai-summary?stream=true`, {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
        },
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to stream summary: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, "");
          if (jsonStr === "[DONE]") continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.done) {
              if (data.fullText) {
                accumulated = data.fullText;
                setStreamedText(data.fullText);
              }
            } else if (data.token) {
              accumulated += data.token;
              setStreamedText((prev) => prev + data.token);
            }
          } catch {
            // Ignore non-JSON stream chunks
          }
        }
      }

      const finalSummary = accumulated.trim();
      if (finalSummary) {
        setStreamedText(finalSummary);
        // Update RTK Query cache so all open views stay synchronized without refetch
        dispatch(
          tasksApi.util.updateQueryData("getTask", taskId, (draft) => {
            draft.aiSummary = finalSummary;
          })
        );
        toast.success("AI summary generated ✨");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("Streaming error:", err);
      toast.error("Failed to generate AI summary");
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [taskId, hasDescription, isStreaming, dispatch]);

  // Automatically start streaming when modal/details is opened if summary is not yet generated
  useEffect(() => {
    if (
      !summary &&
      hasDescription &&
      !isStreaming &&
      autoStreamTriggeredRef.current !== taskId
    ) {
      autoStreamTriggeredRef.current = taskId;
      // Slight delay (100ms) to ensure smooth modal entrance animation
      const timer = setTimeout(() => {
        handleStartStream();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [taskId, summary, hasDescription, isStreaming, handleStartStream]);

  const displayText = isStreaming ? streamedText : (streamedText || summary || "");
  const hasText = Boolean(displayText && displayText.trim());

  if (!hasDescription) {
    return null;
  }

  const handleCopy = () => {
    if (!displayText) return;
    navigator.clipboard.writeText(displayText);
    setHasCopied(true);
    toast.success("Summary copied to clipboard");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-purple-500/30 bg-card transition-all duration-300 overflow-hidden shadow-2xs min-h-[90px] flex flex-col",
        isStreaming
          ? "ring-2 ring-purple-500/40 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
          : "hover:border-purple-500/40",
        className
      )}
    >
      <div className="flex items-center justify-between px-4.5 py-3 border-b border-purple-500/20 bg-purple-500/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles
              className={cn(
                "w-3.5 h-3.5",
                isStreaming && "animate-spin text-purple-500"
              )}
            />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            AI Summary
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full bg-purple-500",
                isStreaming ? "animate-ping" : "animate-pulse"
              )}
            />
            {isStreaming
              ? "Streaming live..."
              : hasText
              ? "Management View"
              : "Live Stream Ready"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasText && !isStreaming && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 border border-border/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Copy summary text"
            >
              {hasCopied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{hasCopied ? "Copied" : "Copy"}</span>
            </button>
          )}

          {canRegenerate && hasText && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartStream}
              disabled={isStreaming}
              className="h-7 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 gap-1.5 rounded-lg transition-all"
            >
              <RefreshCw className={cn("w-3 h-3", isStreaming && "animate-spin")} />
              <span>{isStreaming ? "Streaming..." : "Regenerate AI"}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-4.5 sm:p-5">
        {isStreaming ? (
          <div className="relative">
            <p className="text-sm leading-relaxed text-foreground font-[450] whitespace-pre-wrap">
              {displayText}
              <span className="inline-block w-2 h-4 ml-1 bg-purple-500 animate-pulse align-middle rounded-xs" />
            </p>
            {!displayText && (
              <span className="text-xs text-muted-foreground italic flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                Connecting to Gemini AI stream...
              </span>
            )}
          </div>
        ) : hasText ? (
          <p className="text-sm leading-relaxed text-foreground/90 font-[450] whitespace-pre-wrap">
            {displayText}
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  AI Management Summary
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Stream a clear executive-level summary tailored for stakeholders in real time.
                </span>
              </div>
            </div>

            {canRegenerate && (
              <Button
                type="button"
                size="sm"
                onClick={handleStartStream}
                className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stream Summary</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {hasText && !isStreaming && (
        <div className="px-4.5 pb-3 pt-0 flex items-center justify-between text-[10px] text-muted-foreground/60 border-t border-border/30 pt-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-2.5 h-2.5 text-purple-500/60" />
            <span>AI Management Briefing · Focuses on business context &amp; purpose</span>
          </div>
          <span className="font-mono text-[9px]">Gemini 2.5 Flash</span>
        </div>
      )}
    </div>
  );
}
