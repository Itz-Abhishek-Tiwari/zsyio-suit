"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@zsyio/ui";
import { toast } from "sonner";
import {
  Network,
  Code2,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Eye,
  Download,
  Workflow,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  X,
} from "lucide-react";
// @xyflow/react is large; load it only when the interactive view is opened.
const InteractiveFlowDiagram = React.lazy(() =>
  import("./InteractiveFlowDiagram").then((module) => ({ default: module.InteractiveFlowDiagram }))
);
import { parseMermaidToFlow } from "./mermaid-to-flow";
import { cleanMermaidCode, getMermaidDiagramType } from "./mermaid-utils";

export interface MermaidDiagramProps {
  code: string;
  className?: string;
  initialSizeMode?: "readable" | "fit";
  bare?: boolean;
}

export function MermaidDiagram({
  code,
  className,
  initialSizeMode = "fit",
  bare = false,
}: MermaidDiagramProps) {
  const cleanedCode = React.useMemo(() => cleanMermaidCode(code), [code]);

  const [svgContent, setSvgContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Parse if it can be represented in XYFlow (no subgraphs, simple graph/flowchart)
  const canUseFlow = React.useMemo(() => {
    if (!cleanedCode || cleanedCode.includes("subgraph")) return false;
    return Boolean(parseMermaidToFlow(cleanedCode));
  }, [cleanedCode]);

  // Default to the official vector diagram view for 100% faithful syntax and subgraphs
  const [viewMode, setViewMode] = useState<"diagram" | "interactive" | "code">("diagram");
  const [sizeMode, setSizeMode] = useState<"readable" | "fit">(initialSizeMode);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Generate a stable base ID for this instance
  const instanceIdRef = useRef<string>(
    `mermaid-${Math.random().toString(36).substring(2, 9)}`
  );
  const renderCounterRef = useRef<number>(0);

  // Detect diagram type for badge (e.g. "GRAPH LR", "FLOWCHART TD", "SEQUENCE")
  const diagramType = React.useMemo(() => getMermaidDiagramType(cleanedCode), [cleanedCode]);

  const renderDiagram = useCallback(async () => {
    if (typeof window === "undefined" || !cleanedCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const mermaidModule = await import("mermaid");
      const mermaid = mermaidModule.default;

      // Detect dark theme from document class or data-theme
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";

      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "neutral",
        securityLevel: "strict",
        fontFamily: "var(--font-sans, Inter, system-ui, -apple-system, sans-serif)",
        fontSize: 14,
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: "basis",
          nodeSpacing: 50,
          rankSpacing: 60,
          padding: 18,
        },
        sequence: {
          useMaxWidth: false,
          actorFontSize: 14,
          messageFontSize: 13,
          noteFontSize: 13,
        },
        gantt: {
          useMaxWidth: false,
          fontSize: 13,
        },
        er: {
          useMaxWidth: false,
          fontSize: 13,
        },
        themeVariables: {
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
          fontSize: "14px",
        },
      });

      const uniqueRenderId = `${instanceIdRef.current}-${++renderCounterRef.current}`;
      const { svg } = await mermaid.render(uniqueRenderId, cleanedCode);

      setSvgContent(svg);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to parse and render Mermaid diagram";
      console.warn("Mermaid rendering warning:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [cleanedCode]);

  useEffect(() => {
    renderDiagram();

    // Re-render when theme class changes on <html>
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "class" || mutation.attributeName === "data-theme")
        ) {
          renderDiagram();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      observer.disconnect();
    };
  }, [renderDiagram]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanedCode);
    setCopied(true);
    toast.success("Mermaid code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgContent) return;
    try {
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `diagram-${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      toast.success("Diagram SVG downloaded");
    } catch {
      toast.error("Failed to export diagram SVG");
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 3.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(Number((prev - 0.2).toFixed(2)), 0.4));
  const handleZoomReset = () => setZoomLevel(1);

  // Mouse pan/drag handlers for comfortable panning across large architecture graphs
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (sizeMode === "fit" && zoomLevel === 1) return;
    if (!containerRef.current) return;
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) return;

    isDraggingRef.current = true;
    dragStartPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    };
    containerRef.current.style.cursor = "grabbing";
    containerRef.current.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    containerRef.current.scrollLeft = dragStartPosRef.current.scrollLeft - dx;
    containerRef.current.scrollTop = dragStartPosRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = "";
      containerRef.current.style.userSelect = "";
    }
  };

  const renderedControls = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Zoom Controls */}
      {viewMode === "diagram" && !error && !isLoading && (
        <div className="flex items-center gap-0.5 bg-background/80 dark:bg-card/80 p-0.5 rounded-lg border border-border/70 shadow-2xs">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.45}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="px-1.5 py-0.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer rounded"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.95}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* View Mode Toggle (Diagram vs Interactive vs Source) */}
      <div className="flex items-center bg-background/80 dark:bg-card/80 p-0.5 rounded-lg border border-border/70 shadow-2xs">
        <button
          type="button"
          onClick={() => setViewMode("diagram")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
            viewMode === "diagram"
              ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
          title="View Vector Diagram"
        >
          <Eye className="w-3 h-3" />
          <span>Diagram</span>
        </button>

        {canUseFlow && (
          <button
            type="button"
            onClick={() => setViewMode("interactive")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
              viewMode === "interactive"
                ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
            title="Interactive Drag & Pan Canvas"
          >
            <Workflow className="w-3 h-3 text-current" />
            <span>Interactive</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setViewMode("code")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
            viewMode === "code"
              ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
          title="View Mermaid Syntax"
        >
          <Code2 className="w-3 h-3" />
          <span>Code</span>
        </button>
      </div>

      {/* Download SVG */}
      {viewMode === "diagram" && svgContent && !error && (
        <button
          type="button"
          onClick={handleDownloadSvg}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground bg-background/80 hover:bg-muted/80 border border-border/70 transition-colors shadow-2xs cursor-pointer"
          title="Download Diagram as SVG"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Copy Mermaid Code */}
      <button
        type="button"
        onClick={handleCopyCode}
        className="p-1 rounded-lg text-muted-foreground hover:text-foreground bg-background/80 hover:bg-muted/80 border border-border/70 transition-colors shadow-2xs cursor-pointer"
        title="Copy Mermaid Syntax"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* Fullscreen Expand / Exit */}
      <button
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className={cn(
          "p-1 rounded-lg border transition-colors shadow-2xs cursor-pointer",
          isFullscreen
            ? "bg-primary text-primary-foreground border-primary"
            : "text-muted-foreground hover:text-foreground bg-background/80 hover:bg-muted/80 border-border/70"
        )}
        title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Fullscreen View"}
      >
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  const renderFullscreenModal = () => {
    if (!isFullscreen) return null;
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fade-in">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card rounded-lg border border-border/80 shadow-md mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <span>Architecture Canvas</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {diagramType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderedControls}
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/60"
              title="Close Fullscreen (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fullscreen Body */}
        <div
          className="flex-1 w-full rounded-lg border border-border/80 bg-surface-subtle/40 dark:bg-muted/10 overflow-auto p-8 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="transition-transform duration-150 ease-out origin-center inline-block text-foreground max-w-full w-full [&_svg]:max-w-full [&_svg]:w-auto [&_svg]:h-auto [&_svg]:mx-auto"
            style={{ transform: `scale(${zoomLevel})` }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      </div>
    );
  };

  if (bare) {
    return (
      <div className={cn("relative w-full group overflow-hidden", className)}>
        {/* Floating Controls Overlay (Visible on Hover) */}
        {!isLoading && !error && (
          <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card/90 dark:bg-card/90 backdrop-blur-md border border-border/70 rounded-lg p-1 shadow-sm">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.45}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="px-1.5 py-0.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer rounded"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.95}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <div className="w-px h-3 bg-border/60 mx-0.5" />
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              title="Download SVG"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              title="Fullscreen Canvas"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8 min-h-[220px] text-muted-foreground gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Rendering architecture diagram...</span>
          </div>
        )}

        {/* Error Fallback Banner */}
        {error && (
          <div className="p-4 m-3 bg-warning/10 border border-warning/30 rounded-lg text-warning text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Mermaid Syntax Warning</span>
              <span className="opacity-90 leading-relaxed">{error}</span>
            </div>
          </div>
        )}

        {/* Rendered Diagram View */}
        {!isLoading && !error && (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={cn(
              "w-full overflow-auto bg-surface-subtle/30 dark:bg-card/40 p-4 sm:p-8 flex items-center justify-center min-h-[260px] select-none",
              zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : ""
            )}
          >
            <div
              className="transition-transform duration-150 ease-out origin-center inline-block text-foreground max-w-full w-full [&_svg]:max-w-full [&_svg]:w-auto [&_svg]:h-auto [&_svg]:mx-auto"
              style={{ transform: `scale(${zoomLevel})` }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        )}

        {renderFullscreenModal()}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "my-5 overflow-hidden rounded-lg border border-border/80 bg-card shadow-xs transition-all",
          className
        )}
      >
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-subtle/80 dark:bg-card/80 border-b border-border/60 text-xs select-none flex-wrap gap-2">
          {/* Left: Title & Type badge */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Network className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-foreground tracking-tight text-xs">
              <span>Architecture Diagram</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-subtle text-muted-foreground border border-border/60 font-medium">
                {diagramType}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          {renderedControls}
        </div>

        {/* Main Content Area */}
        <div className="relative">
          {/* Interactive React Flow Canvas View */}
          {viewMode === "interactive" && canUseFlow && (
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[500px] text-sm text-muted-foreground">
                  Loading interactive view…
                </div>
              }
            >
              <InteractiveFlowDiagram code={cleanedCode} height={500} />
            </React.Suspense>
          )}

          {/* Loading State */}
          {isLoading && viewMode === "diagram" && (
            <div className="flex flex-col items-center justify-center p-10 min-h-[300px] text-muted-foreground gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <span className="text-xs font-medium">Rendering architecture diagram...</span>
            </div>
          )}

          {/* Error Fallback Banner */}
          {error && (
            <div className="p-4 m-4 bg-warning/10 border border-warning/30 rounded-lg text-warning text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Mermaid Syntax Warning</span>
                <span className="opacity-90 leading-relaxed">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className="text-xs font-semibold underline underline-offset-2 ml-auto cursor-pointer"
              >
                View Code
              </button>
            </div>
          )}

          {/* Rendered Diagram View */}
          {viewMode === "diagram" && !isLoading && !error && (
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={cn(
                "w-full overflow-auto bg-surface-subtle/30 dark:bg-card/40 p-6 sm:p-10 flex items-center justify-center min-h-[320px] select-none",
                zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : ""
              )}
            >
              <div
                className="transition-transform duration-150 ease-out origin-center inline-block text-foreground max-w-full w-full [&_svg]:max-w-full [&_svg]:w-auto [&_svg]:h-auto [&_svg]:mx-auto"
                style={{ transform: `scale(${zoomLevel})` }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          )}

          {/* Raw Code View */}
          {(viewMode === "code" || (error && viewMode === "diagram")) && (
            <div className="bg-foreground p-4 sm:p-5 text-muted-foreground font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px]">
              <pre>
                <code>{cleanedCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {renderFullscreenModal()}
    </>
  );
}
