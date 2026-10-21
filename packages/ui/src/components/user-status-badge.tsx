import React from "react";
import { Badge } from "./badge";
import { cn } from "../lib/utils";
import { Clock, XCircle, Ban } from "lucide-react";

export interface UserStatusBadgeProps {
  active: boolean;
  invitationStatus?: string | null;
  className?: string;
}

export function UserStatusBadge({
  active,
  invitationStatus,
  className,
}: UserStatusBadgeProps) {
  if (invitationStatus === "PENDING") {
    return (
      <Badge
        variant="warning"
        className={cn("gap-1 font-semibold   text-xs", className)}
      >
        <Clock className="w-3 h-3 animate-spin-slow" />
        <span>Pending Invite</span>
      </Badge>
    );
  }

  if (invitationStatus === "REJECTED") {
    return (
      <Badge
        variant="destructive"
        className={cn("gap-1 font-semibold   text-xs", className)}
      >
        <XCircle className="w-3 h-3" />
        <span>Declined</span>
      </Badge>
    );
  }

  if (!active) {
    return (
      <Badge
        variant="secondary"
        className={cn("gap-1 font-semibold   text-xs", className)}
      >
        <Ban className="w-3 h-3" />
        <span>Deactivated</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="success"
      className={cn("gap-1 font-semibold   text-xs", className)}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      <span>Active</span>
    </Badge>
  );
}
