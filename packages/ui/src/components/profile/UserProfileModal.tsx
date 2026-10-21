"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../sheet";
import { UserProfileView } from "./UserProfileView";
import { User } from "lucide-react";

export interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl flex flex-col p-0 bg-background border-l border-border/80 shadow-md overflow-hidden h-full z-50"
      >
        <SheetHeader className="p-4 sm:p-5 border-b border-border/70 bg-card/90 backdrop-blur-xs shrink-0 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-foreground font-display">
                My Profile &amp; Account Settings
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Manage your identity, job details, timezone, and security credentials.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <UserProfileView isModal onSaved={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Export UserProfileSidePanel as alias for backwards compatibility
export { UserProfileModal as UserProfileSidePanel };
