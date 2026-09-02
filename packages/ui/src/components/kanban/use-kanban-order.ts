"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";

export interface UseKanbanOrderOptions<T> {
  initialColumns: T[];
  getStatus?: (col: T) => string;
  storageKey?: string;
  onOrderChange?: (columns: T[]) => void | Promise<void>;
}

export interface UseKanbanOrderReturn<T> {
  columns: T[];
  setColumns: React.Dispatch<React.SetStateAction<T[]>>;
  draggedColumnStatus: string | null;
  handleColumnDragStart: (status: string) => void;
  handleColumnDragEnd: () => void;
  handleReorderColumns: (sourceStatus: string, targetStatus: string) => void;
  handleMoveColumnLeft: (status: string) => void;
  handleMoveColumnRight: (status: string) => void;
  handleResetColumns: () => void;
  isPending: boolean;
}

export function useKanbanOrder<T extends { status?: string; id?: string; stageKey?: string }>({
  initialColumns,
  getStatus = (col) => col.status ?? col.stageKey ?? col.id ?? "",
  storageKey,
  onOrderChange,
}: UseKanbanOrderOptions<T>): UseKanbanOrderReturn<T> {
  const [columns, setColumns] = useState<T[]>(initialColumns);
  const [draggedColumnStatus, setDraggedColumnStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const orderRef = useRef<string[] | null>(null);
  const getStatusRef = useRef(getStatus);
  const prevInitialColumnsRef = useRef<T[]>(initialColumns);

  useEffect(() => {
    getStatusRef.current = getStatus;
  });

  // Load saved order from localStorage on mount
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedKeys = JSON.parse(saved) as string[];
        if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
          orderRef.current = parsedKeys;
          // If columns already loaded, sort them right away
          setColumns((prev) => {
            if (!prev || prev.length === 0) return prev;
            const columnMap = new Map(prev.map((col) => [getStatusRef.current(col), col]));
            const reordered: T[] = [];
            for (const key of parsedKeys) {
              const col = columnMap.get(key);
              if (col) {
                reordered.push(col);
                columnMap.delete(key);
              }
            }
            for (const col of columnMap.values()) {
              reordered.push(col);
            }
            return reordered;
          });
        }
      }
    } catch {
      // Ignore corrupted localStorage
    }
  }, [storageKey]);

  // Sync columns when initialColumns changes, respecting active/saved custom order
  useEffect(() => {
    if (!initialColumns || initialColumns.length === 0) return;

    // Check if initialColumns structurally changed
    const prevInit = prevInitialColumnsRef.current;
    const isSameInitial =
      prevInit.length === initialColumns.length &&
      prevInit.every((col, idx) => getStatusRef.current(col) === getStatusRef.current(initialColumns[idx]));

    if (isSameInitial && columns.length > 0) return;
    prevInitialColumnsRef.current = initialColumns;

    setColumns((prev) => {
      // Check if we have an active custom order
      const keysToRespect =
        orderRef.current ??
        (prev.length > 0 && prev.length === initialColumns.length ? prev.map(getStatusRef.current) : null);

      if (keysToRespect && keysToRespect.length > 0) {
        const columnMap = new Map(initialColumns.map((col) => [getStatusRef.current(col), col]));
        const reordered: T[] = [];

        for (const key of keysToRespect) {
          const col = columnMap.get(key);
          if (col) {
            reordered.push(col);
            columnMap.delete(key);
          }
        }

        // Append any newly added columns from server
        for (const col of columnMap.values()) {
          reordered.push(col);
        }

        return reordered;
      }

      return initialColumns;
    });
  }, [initialColumns, columns.length]);

  const persistOrder = useCallback(
    (nextCols: T[]) => {
      const keys = nextCols.map(getStatusRef.current);
      orderRef.current = keys;

      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(keys));
        } catch {
          // Ignore write error
        }
      }
      if (onOrderChange) {
        startTransition(() => {
          onOrderChange(nextCols);
        });
      }
    },
    [storageKey, onOrderChange]
  );

  const handleColumnDragStart = useCallback((status: string) => {
    setDraggedColumnStatus(status);
  }, []);

  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumnStatus(null);
  }, []);

  const handleReorderColumns = useCallback(
    (sourceStatus: string, targetStatus: string) => {
      if (sourceStatus === targetStatus) return;

      setColumns((prev) => {
        const sourceIndex = prev.findIndex((c) => getStatusRef.current(c) === sourceStatus);
        const targetIndex = prev.findIndex((c) => getStatusRef.current(c) === targetStatus);
        if (sourceIndex === -1 || targetIndex === -1) return prev;

        const next = [...prev];
        const [movedColumn] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, movedColumn);

        queueMicrotask(() => persistOrder(next));
        return next;
      });
    },
    [persistOrder]
  );

  const handleMoveColumnLeft = useCallback(
    (statusToMove: string) => {
      setColumns((prev) => {
        const currentIndex = prev.findIndex((c) => getStatusRef.current(c) === statusToMove);
        if (currentIndex <= 0) return prev;

        const next = [...prev];
        const [movedColumn] = next.splice(currentIndex, 1);
        next.splice(currentIndex - 1, 0, movedColumn);

        queueMicrotask(() => persistOrder(next));
        return next;
      });
    },
    [persistOrder]
  );

  const handleMoveColumnRight = useCallback(
    (statusToMove: string) => {
      setColumns((prev) => {
        const currentIndex = prev.findIndex((c) => getStatusRef.current(c) === statusToMove);
        if (currentIndex === -1 || currentIndex >= prev.length - 1) return prev;

        const next = [...prev];
        const [movedColumn] = next.splice(currentIndex, 1);
        next.splice(currentIndex + 1, 0, movedColumn);

        queueMicrotask(() => persistOrder(next));
        return next;
      });
    },
    [persistOrder]
  );

  const handleResetColumns = useCallback(() => {
    orderRef.current = null;
    if (storageKey && typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    setColumns(initialColumns);
    if (onOrderChange) {
      startTransition(() => {
        onOrderChange(initialColumns);
      });
    }
  }, [initialColumns, storageKey, onOrderChange]);

  return {
    columns,
    setColumns,
    draggedColumnStatus,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleReorderColumns,
    handleMoveColumnLeft,
    handleMoveColumnRight,
    handleResetColumns,
    isPending,
  };
}
