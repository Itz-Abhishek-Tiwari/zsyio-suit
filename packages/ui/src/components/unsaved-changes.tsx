"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { AlertTriangle, Save } from "lucide-react";

export interface UnsavedChangesContextType {
  setUnsavedState: (hasChanges: boolean, saveHandler?: () => Promise<boolean>) => void;
  confirmNavigation: (action: () => void) => boolean;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasChanges, setHasChanges] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const saveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);
  const hasChangesRef = useRef(false);

  hasChangesRef.current = hasChanges;

  const setUnsavedState = useCallback(
    (dirty: boolean, saveHandler?: () => Promise<boolean>) => {
      setHasChanges(dirty);
      hasChangesRef.current = dirty;
      saveHandlerRef.current = saveHandler || null;
    },
    []
  );

  const confirmNavigation = useCallback((action: () => void): boolean => {
    if (hasChangesRef.current) {
      setPendingAction(() => action);
      setModalOpen(true);
      return false;
    }
    action();
    return true;
  }, []);

  // Intercept all internal <a> and Next.js Link clicks globally during capture phase
  useEffect(() => {
    const handleCaptureClick = (e: MouseEvent) => {
      if (!hasChangesRef.current) return;

      const target = (e.target as HTMLElement | null)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        return;
      }

      // Anything that doesn't resolve to this app's own origin (an external
      // https:// link, or a non-http(s) scheme like mailto:/tel: whose
      // resolved `.origin` is the string "null") can't be handled by the
      // client-side router — let the browser navigate it natively instead
      // of calling router.push() on a URL it can't understand.
      if (target.origin !== window.location.origin) return;

      // Check if it's pointing to the same exact URL
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      setPendingAction(() => () => {
        router.push(href);
      });
      setModalOpen(true);
    };

    document.addEventListener("click", handleCaptureClick, true);
    return () => document.removeEventListener("click", handleCaptureClick, true);
  }, [router]);

  // Intercept browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (hasChangesRef.current) {
        window.history.pushState(null, "", window.location.href);
        setPendingAction(() => () => {
          window.history.back();
        });
        setModalOpen(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Intercept browser tab close / refresh (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleDiscardAndProceed = () => {
    setHasChanges(false);
    hasChangesRef.current = false;
    setModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleSaveAndProceed = async () => {
    if (saveHandlerRef.current) {
      const success = await saveHandlerRef.current();
      if (!success) return;
    }
    setHasChanges(false);
    hasChangesRef.current = false;
    setModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  return (
    <UnsavedChangesContext.Provider value={{ setUnsavedState, confirmNavigation }}>
      {children}

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setModalOpen(false);
            setPendingAction(null);
          }
        }}
        title="Unsaved Changes"
        description="You have unsaved changes. Do you want to save them before leaving?"
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
        iconVariant="warning"
        size="md"
        bodyClassName="p-5 flex flex-col gap-3 text-xs text-muted-foreground"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setPendingAction(null);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-surface-elevated text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Keep Editing
            </button>
            <button
              type="button"
              onClick={handleDiscardAndProceed}
              className="px-3.5 py-1.5 rounded-lg border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveAndProceed}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer shadow-xs "
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Continue</span>
            </button>
          </div>
        }
      >
        <p className="leading-relaxed">
          If you navigate to another page without saving, your recent edits will be lost permanently. You can save your work now, discard changes, or stay on this page to continue editing.
        </p>
      </Modal>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error("useUnsavedChanges must be used within an UnsavedChangesProvider");
  }
  return context;
}
