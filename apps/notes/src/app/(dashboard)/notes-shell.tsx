"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BrowserNotificationManager } from "@/components/notifications/BrowserNotificationManager";
import type { Role } from "@zsyio/auth/permissions";

interface NotesShellProps {
  role: Role | string;
  permissions?: string[] | null;
  name: string;
  children: React.ReactNode;
}

export function NotesShell({
  role,
  permissions,
  name,
  children,
}: NotesShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Center Main Stage (Header + Notes Workspace) */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* 1. Unified Zsyio Top Header */}
        <Header
          role={role}
          permissions={permissions}
          name={name}
          currentLabel="Knowledge Hub"
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* 2. Main Notes Workspace */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>

      {/* Background Notification Manager */}
      <BrowserNotificationManager />
    </div>
  );
}

