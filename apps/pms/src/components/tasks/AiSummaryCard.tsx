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
        "w-full rounded-lg border border-notion-purple-fg/30 bg-card transition-all duration-150 overflow-hidden shadow-2xs min-h-[90px] flex flex-col",
        isStreaming
          ? "ring-2 ring-notion-purple-fg/40 border-notion-purple-fg/60 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
          : "hover:border-notion-purple-fg/40",
        className
      )}
    >
      <div className="flex items-center justify-between px-4.5 py-3 border-b border-notion-purple-fg/20 bg-notion-purple-fg/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-notion-purple-fg/15 border border-notion-purple-fg/25 text-notion-purple-fg flex items-center justify-center shrink-0">
            <Sparkles
              className={cn(
                "w-3.5 h-3.5",
                isStreaming && "animate-spin text-notion-purple-fg"
              )}
            />
          </span>
          <span className="text-xs font-semibold   text-notion-purple-fg">
            AI Summary
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-notion-purple-fg bg-notion-purple-fg/10 border border-notion-purple-fg/20 px-2 py-0.5 rounded-full">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full bg-notion-purple-fg",
                isStreaming ? "" : "animate-pulse"
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
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 border border-border/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Copy summary text"
            >
              {hasCopied ? (
                <Check className="w-3 h-3 text-success" />
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
              className="h-7 text-xs font-semibold text-notion-purple-fg bg-notion-purple-fg/10 hover:bg-notion-purple-fg/20 border-notion-purple-fg/30 gap-1.5 rounded-lg transition-all"
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
              <span className="inline-block w-2 h-4 ml-1 bg-notion-purple-fg animate-pulse align-middle rounded-xs" />
            </p>
            {!displayText && (
              <span className="text-xs text-muted-foreground italic flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-notion-purple-fg animate-spin" />
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
              <div className="w-9 h-9 rounded-lg bg-notion-purple-fg/10 border border-notion-purple-fg/20 flex items-center justify-center text-notion-purple-fg shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  AI Management Summary
                </span>
                <span className="text-xs text-muted-foreground">
                  Stream a clear executive-level summary tailored for stakeholders in real time.
                </span>
              </div>
            </div>

            {canRegenerate && (
              <Button
                type="button"
                size="sm"
                onClick={handleStartStream}
                className="h-8 text-xs font-semibold bg-notion-purple-fg hover:bg-notion-purple-fg text-white rounded-lg shadow-xs gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stream Summary</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {hasText && !isStreaming && (
        <div className="px-4.5 pb-3 pt-0 flex items-center justify-between text-xs text-muted-foreground/60 border-t border-border/30 pt-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-2.5 h-2.5 text-notion-purple-fg/60" />
            <span>AI Management Briefing · Focuses on business context &amp; purpose</span>
          </div>
          <span className="font-mono text-xs">Gemini 2.5 Flash</span>
        </div>
      )}
    </div>
  );
}
