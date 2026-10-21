"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { formatDateMonthYear, getDaysDifference } from "@zsyio/ui";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  Package,
  StickyNote,
  ExternalLink,
  MoreVertical,
  Calendar,
  AlertTriangle,
  GripVertical,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import { Badge } from "@zsyio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zsyio/ui";
import type { Client, ClientStatus } from "@zsyio/types";

interface ClientKanbanCardProps {
  client: Client;
  onOpenNotesModal?: (client: Client) => void;
  onStatusChange: (client: Client, newStatus: ClientStatus) => void;
  onDeleteClient?: (client: Client) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const STATUS_TRANSITIONS: { status: ClientStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { status: "INTAKE", label: "Move to Intake", icon: Clock },
  { status: "ONBOARDING", label: "Move to Onboarding", icon: Clock },
  { status: "ACTIVE", label: "Move to Active", icon: CheckCircle2 },
  { status: "PAUSED", label: "Move to Paused", icon: PauseCircle },
  { status: "CHURNED", label: "Move to Churned", icon: XCircle },
];

function ClientKanbanCardImpl({
  client,
  onOpenNotesModal,
  onStatusChange,
  onDeleteClient,
  canEdit = true,
  canDelete = false,
}: ClientKanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const products = client.products ?? [];

  // Contract expiry calculation
  let contractExpiryWarning: { text: string; isUrgent: boolean } | null = null;
  if (client.contractEnd) {
    const daysLeft = getDaysDifference(client.contractEnd);
    if (daysLeft < 0) {
      contractExpiryWarning = { text: "Contract Expired", isUrgent: true };
    } else if (daysLeft <= 30) {
      contractExpiryWarning = {
        text: `Renews in ${daysLeft}d`,
        isUrgent: daysLeft <= 14,
      };
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/client-id", client.id);
    e.dataTransfer.setData("application/json", JSON.stringify({ clientId: client.id, currentStatus: client.status }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={canEdit}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative flex flex-col rounded-lg border bg-card p-4 transition-all duration-200 select-none shadow-2xs hover:shadow-md hover:border-primary/40 ${
        isDragging
          ? "opacity-40 scale-[0.98] border-primary shadow-md ring-2 ring-primary/20"
          : "border-border/80"
      } ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
    >
      {/* Top row: Client Logo/Avatar + Name + Status & Actions */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Avatar / Monogram */}
          <div className="relative w-9 h-9 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shrink-0 font-semibold text-xs  group-hover:border-primary/50 transition-all overflow-hidden shadow-2xs">
            {client.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={client.logoUrl}
                alt={client.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Link
              href={`/clients/${client.id}`}
              className="font-semibold text-foreground text-xs leading-snug hover:text-primary transition-colors truncate block"
              title={client.name}
            >
              {client.name}
            </Link>

            {client.domain ? (
              <a
                href={client.domain.startsWith("http") ? client.domain : `https://${client.domain}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-primary truncate max-w-[150px] transition-colors"
              >
                <Globe className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{client.domain.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            ) : (
              <span className="text-xs text-muted-foreground/50">No domain</span>
            )}
          </div>
        </div>

        {/* Dropdown Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuLabel className="text-xs  text-muted-foreground">
                Client Options
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/clients/${client.id}`} className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>View Full Profile</span>
                </Link>
              </DropdownMenuItem>
              {onOpenNotesModal ? (
                <DropdownMenuItem
                  onClick={() => onOpenNotesModal(client)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <StickyNote className="w-3.5 h-3.5 text-primary" />
                  <span>Notes & Documentation</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={`/clients/${client.id}/notes`} className="flex items-center gap-2 cursor-pointer">
                    <StickyNote className="w-3.5 h-3.5 text-primary" />
                    <span>Notes & Documentation</span>
                  </Link>
                </DropdownMenuItem>
              )}

              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs  text-muted-foreground">
                    Move Status
                  </DropdownMenuLabel>
                  {STATUS_TRANSITIONS.filter((t) => {
                    if (t.status === client.status) return false;
                    // Clients cannot go back to INTAKE once in onboarding or active stages
                    if (t.status === "INTAKE" && client.status !== "INTAKE") return false;
                    return true;
                  }).map((t) => {
                    const IconComp = t.icon;
                    return (
                      <DropdownMenuItem
                        key={t.status}
                        onClick={() => onStatusChange(client, t.status)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <IconComp className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{t.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}

              {canDelete && onDeleteClient && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteClient(client)}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{client.status === "INTAKE" ? "Delete Intake Lead" : "Delete Client"}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contract & Expiry Badges */}
      {(client.contractStart || client.contractEnd || contractExpiryWarning) && (
        <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
          {client.contractEnd && (
            <Badge variant="secondary" className="text-xs font-medium gap-1 py-0 h-5">
              <Calendar className="w-3 h-3 text-muted-foreground/70" />
              <span>{formatDateMonthYear(client.contractEnd)}</span>
            </Badge>
          )}

          {contractExpiryWarning && (
            <Badge
              variant={contractExpiryWarning.isUrgent ? "destructive" : "warning"}
              className="text-xs font-semibold gap-1 py-0 h-5"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{contractExpiryWarning.text}</span>
            </Badge>
          )}
        </div>
      )}

      {/* Products & Portfolio count */}
      {products.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <Badge variant="default" className="text-xs font-semibold gap-1 py-0 h-5">
            <Package className="w-3 h-3 text-primary/80" />
            <span>
              {products.length} {products.length === 1 ? "Product" : "Products"}
            </span>
          </Badge>
          {products.slice(0, 2).map((p) => (
            <Badge
              key={p.id}
              variant="outline"
              className="text-xs text-muted-foreground/80 py-0 h-5 max-w-[100px] truncate"
              title={p.name}
            >
              {p.name}
            </Badge>
          ))}
          {products.length > 2 && (
            <span className="text-xs text-muted-foreground/60 font-medium">
              +{products.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Primary Contact Row */}
      {(client.contactName || client.contactEmail || client.contactPhone) && (
        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground gap-2">
          <span className="truncate font-medium text-foreground/80">
            {client.contactName || "Contact"}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {client.contactEmail && (
              <a
                href={`mailto:${client.contactEmail}`}
                title={client.contactEmail}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-primary-light hover:text-primary text-muted-foreground/70 transition-colors"
              >
                <Mail className="w-3 h-3" />
              </a>
            )}
            {client.contactPhone && (
              <a
                href={`tel:${client.contactPhone}`}
                title={client.contactPhone}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-primary-light hover:text-primary text-muted-foreground/70 transition-colors"
              >
                <Phone className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Notes & Documentation Preview / Navigation */}
      <div className="mt-2.5 pt-2 border-t border-border/40">
        {client.notes ? (
          <Link
            href={`/clients/${client.id}/notes`}
            className="block group/note cursor-pointer rounded-lg bg-muted/40 hover:bg-primary-light/40 border border-border/50 hover:border-primary/30 p-2 transition-all space-y-1 text-left"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground group-hover/note:text-primary">
              <span className="font-semibold flex items-center gap-1">
                <StickyNote className="w-3 h-3 text-primary" />
                Notes & Specs
              </span>
              <span className="text-xs opacity-60 group-hover/note:opacity-100">Open Editor →</span>
            </div>
            <p className="text-xs text-foreground/90 leading-tight line-clamp-2 italic">
              &ldquo;{client.notes}&rdquo;
            </p>
          </Link>
        ) : (
          <Link
            href={`/clients/${client.id}/notes`}
            className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary-light/30 rounded-lg border border-dashed border-border/70 transition-colors"
          >
            <StickyNote className="w-3 h-3 text-primary" />
            <span>+ Notes & Specs</span>
          </Link>
        )}
      </div>

      {/* Subtle Drag Grip in footer */}
      {canEdit && (
        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export const ClientKanbanCard = memo(ClientKanbanCardImpl);
