"use client";

import Link from "next/link";
import { UserAvatar } from "@zsyio/ui";
import { ProductEnvironmentBadge } from "@/components/products/ProductEnvironmentBadge";
import { GitBranchCard } from "../GitBranchCard";
import { TeamBadge } from "../TaskBadges";
import type { User, Team, Client, Product } from "@zsyio/types";
import {
  Users2,
  UserCheck,
  Building2,
  Package,
  ExternalLink,
} from "lucide-react";

export interface GitSuggestionInfo {
  prefix: string;
  branchName: string;
  checkoutCmd: string;
}

export interface TaskModalSidebarProps {
  gitSuggestion: GitSuggestionInfo | null;
  isAiGenerated: boolean;
  isGeneratingAi: boolean;
  onGenerateAi?: (forceRegen?: boolean) => void;
  assignedUsers: User[];
  reviewer?: User | null;
  reviewers?: User[];
  assignedTeams: Team[];
  currentClient?: Client | null;
  product?: Product | null;
  creator?: User | null;
  createdAt: string;
  updatedAt: string;
  timeAgo: (date?: string | null) => string;
  onClose: () => void;
}

export function TaskModalSidebar({
  gitSuggestion,
  isAiGenerated,
  isGeneratingAi,
  onGenerateAi,
  assignedUsers,
  reviewer,
  reviewers,
  assignedTeams,
  currentClient,
  product,
  creator,
  createdAt,
  updatedAt,
  timeAgo,
  onClose,
}: TaskModalSidebarProps) {
  const allReviewers = reviewers && reviewers.length > 0
    ? reviewers
    : reviewer
    ? [reviewer]
    : [];

  return (
    <div className="flex flex-col gap-4">
      {gitSuggestion && (
        <GitBranchCard
          branchName={gitSuggestion.branchName}
          checkoutCmd={gitSuggestion.checkoutCmd}
          prefix={gitSuggestion.prefix}
          isAiGenerated={isAiGenerated}
          isGenerating={isGeneratingAi}
          onRegenerate={onGenerateAi ? () => onGenerateAi(true) : undefined}
        />
      )}

      {allReviewers.length > 0 && (
      <div className="rounded-md border border-success/20 bg-card p-3.5 shadow-2xs hover:border-success/40 transition-all flex flex-col gap-3">
          <span className="text-xs font-semibold   text-muted-foreground flex items-center justify-between border-b border-border/60 pb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-sm bg-success/10 text-success flex items-center justify-center shrink-0">
                <UserCheck className="w-3 h-3" />
              </span>
              {allReviewers.length > 1 ? "Reviewers" : "Reviewer"}
            </span>
            <span className="text-xs font-semibold font-mono text-success bg-success/10 px-1.5 py-0.5 rounded-sm border border-success/20">
              {allReviewers.length > 1 ? `${allReviewers.length} assigned` : "assigned"}
            </span>
          </span>

          <div className="flex flex-col gap-2">
            {allReviewers.map((rev) => (
              <div key={rev.id} className="flex items-center gap-2">
                <UserAvatar user={rev} size="sm" />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-foreground text-xs truncate">
                    {rev.name}
                  </span>
                  <span className="text-xs text-muted-foreground  font-mono ">
                    {rev.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-md border border-border/80 bg-card p-3.5 shadow-2xs hover:border-border transition-all flex flex-col gap-3">
        <span className="text-xs font-semibold   text-muted-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
          <span className="w-5 h-5 rounded-sm bg-notion-blue-fg/10 text-notion-blue-fg flex items-center justify-center shrink-0">
            <Users2 className="w-3 h-3" />
          </span>
          Assigned Team &amp; Roles
        </span>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {assignedUsers.length > 0 ? (
              assignedUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/70 px-2 py-1 rounded-sm border border-border/50 text-xs transition-colors"
                >
                  <UserAvatar user={u} size="xs" />
                  <span className="font-semibold text-foreground truncate max-w-[130px]">
                    {u.name}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground/60 italic flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-sm border border-border/40">
                <UserCheck className="w-3.5 h-3.5 opacity-50" /> Unassigned
              </span>
            )}
          </div>

          {assignedTeams.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-border/40">
              {assignedTeams.map((t) => (
                <TeamBadge key={t.id} name={t.name} color={t.color} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border/80 bg-card p-3.5 shadow-2xs hover:border-border transition-all flex flex-col gap-3">
        <span className="text-xs font-semibold   text-muted-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
          <span className="w-5 h-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-3 h-3" />
          </span>
          Client &amp; Product
        </span>

        <div className="flex flex-col gap-2">
          {currentClient ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                {currentClient.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold tracking-tight text-foreground truncate">
                  {currentClient.name}
                </span>
                {currentClient.domain && (
                  <span className="text-xs text-muted-foreground truncate font-mono">
                    {currentClient.domain}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60 italic">No client assigned</span>
          )}

          {product && (
            <div className="flex items-center justify-between gap-2 bg-muted/40 p-2 rounded-sm border border-border/50 text-xs mt-0.5 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <Package className="w-3.5 h-3.5 text-notion-orange-fg shrink-0" />
                <span className="font-semibold text-foreground truncate text-xs">
                  {product.name}
                </span>
              </div>
              {product.environment && (
                <ProductEnvironmentBadge environment={product.environment} />
              )}
            </div>
          )}

          {currentClient && (
            <Link
              href={`/clients/${currentClient.id}`}
              onClick={onClose}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1.5 border-t border-border/40"
            >
              <span>View client profile</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border/80 bg-card p-3.5 shadow-2xs text-xs text-muted-foreground flex flex-col gap-2">
        {creator ? (
          <div className="flex items-center justify-between">
            <span>Reported by</span>
            <span className="font-semibold text-foreground">{creator.name}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span>Created</span>
          <span className="font-medium text-foreground">{timeAgo(createdAt)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
          <span>Last Updated</span>
          <span className="font-medium text-foreground">{timeAgo(updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
