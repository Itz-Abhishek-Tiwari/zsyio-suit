"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type UserStatus = "active" | "online" | "offline" | "busy" | "away";

export interface AvatarUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
}

export interface UserAvatarProps {
  user?: AvatarUser | null;
  name?: string | null;
  image?: string | null;
  size?: AvatarSize;
  colorScheme?: "primary" | "auto" | "neutral";
  showStatus?: boolean;
  status?: UserStatus;
  className?: string;
  title?: string;
  singleInitial?: boolean;
}

const SIZE_MAP: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: "w-5.5 h-5.5 min-w-[22px]", text: "text-xs", dot: "w-1.5 h-1.5 -bottom-0.5 -right-0.5" },
  sm: { container: "w-6 h-6 min-w-[24px]", text: "text-xs", dot: "w-2 h-2 -bottom-0.5 -right-0.5" },
  md: { container: "w-8 h-8 min-w-[32px]", text: "text-xs", dot: "w-2.5 h-2.5 bottom-0 right-0" },
  lg: { container: "w-10 h-10 min-w-[40px]", text: "text-sm", dot: "w-3 h-3 bottom-0 right-0" },
  xl: { container: "w-12 h-12 min-w-[48px]", text: "text-base", dot: "w-3.5 h-3.5 bottom-0.5 right-0.5" },
};

const COLOR_PALETTES = [
  "bg-primary-light text-primary border-primary/30",
  "bg-notion-purple text-notion-purple-fg border-notion-purple-fg/30",
  "bg-notion-purple text-notion-purple-fg border-notion-purple-fg/30",
  "bg-success-light text-success border-success/30",
  "bg-notion-blue text-notion-blue-fg border-notion-blue-fg/30",
  "bg-warning-light text-warning border-warning/30",
  "bg-destructive-light text-destructive border-destructive/30",
  "bg-notion-blue text-notion-blue-fg border-notion-blue-fg/30",
];

const STATUS_DOT_MAP: Record<UserStatus, string> = {
  active: "bg-success border-card",
  online: "bg-success border-card animate-pulse",
  offline: "bg-muted-foreground border-card",
  busy: "bg-destructive border-card",
  away: "bg-warning border-card",
};

export function getInitials(name?: string | null, maxChars = 2): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (maxChars === 1) {
    return parts[0][0].toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDeterministicColor(str?: string | null): string {
  if (!str) return COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

export function UserAvatar({
  user,
  name: nameProp,
  image: imageProp,
  size = "md",
  colorScheme = "auto",
  showStatus = false,
  status = "active",
  className,
  title,
  singleInitial,
}: UserAvatarProps) {
  const displayName = nameProp ?? user?.name ?? "";
  const imageUrl = imageProp ?? user?.image ?? user?.avatarUrl;
  const isSingle = singleInitial ?? (size === "xs");
  const initials = getInitials(displayName, isSingle ? 1 : 2);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const colorStyle =
    colorScheme === "primary"
      ? "bg-primary-light text-primary border-primary/30"
      : colorScheme === "neutral"
      ? "bg-muted text-muted-foreground border-border"
      : getDeterministicColor(displayName || user?.id || user?.email);

  const tooltip = title ?? displayName ?? user?.email ?? undefined;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 rounded-full",
        className
      )}
      title={tooltip}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold tracking-tight border select-none overflow-hidden shadow-2xs transition-transform bg-card",
          sizeConfig.container,
          sizeConfig.text,
          imageUrl ? "border-border" : colorStyle,
          className
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={displayName || "User avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="leading-none select-none">{initials}</span>
        )}
      </div>

      {showStatus && (
        <span
          className={cn(
            "absolute rounded-full border",
            sizeConfig.dot,
            STATUS_DOT_MAP[status] || STATUS_DOT_MAP.active
          )}
        />
      )}
    </div>
  );
}

export interface UserAvatarGroupProps {
  users?: (AvatarUser | null | undefined)[];
  max?: number;
  size?: AvatarSize;
  className?: string;
  emptyLabel?: string;
}

export function UserAvatarGroup({
  users = [],
  max = 3,
  size = "xs",
  className,
  emptyLabel = "Unassigned",
}: UserAvatarGroupProps) {
  const validUsers = users.filter((u): u is AvatarUser => Boolean(u));
  const visibleUsers = validUsers.slice(0, max);
  const remainingCount = validUsers.length - max;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.xs;

  if (validUsers.length === 0) {
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center text-muted-foreground border border-dashed border-border bg-surface-subtle shrink-0",
          sizeConfig.container,
          sizeConfig.text,
          className
        )}
        title={emptyLabel}
      >
        ?
      </div>
    );
  }

  const overlapClass = size === "xs" ? "-space-x-1" : size === "sm" ? "-space-x-1.5" : "-space-x-2";

  return (
    <div className={cn("inline-flex items-center shrink-0", overlapClass, className)}>
      {visibleUsers.map((u, i) => (
        <UserAvatar
          key={u.id ?? `${u.name}-${i}`}
          user={u}
          size={size}
          singleInitial={size === "xs"}
          className="ring-2 ring-card rounded-full transition-transform  hover:z-10 bg-card"
        />
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold text-muted-foreground bg-muted border border-border ring-2 ring-card shrink-0 select-none",
            sizeConfig.container,
            sizeConfig.text
          )}
          title={`${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
