"use client";

import React from "react";
import Link from "next/link";
import { Building2, ArrowRight, Layers } from "lucide-react";
import { Button } from "@zsyio/ui";

import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";

export interface DashboardClientItem {
  id: string;
  name: string;
  status: string;
  domain: string | null;
  productCount: number;
  openTaskCount: number;
}

interface ClientPortfolioCardProps {
  clients: DashboardClientItem[];
  canViewClients: boolean;
}

export function ClientPortfolioCard({ clients, canViewClients }: ClientPortfolioCardProps) {
  if (!canViewClients) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-md bg-success/10 text-success border border-success/20 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Client Portfolio</h2>
            <p className="text-xs text-muted-foreground">Active client suites and load.</p>
          </div>
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs font-semibold gap-1 text-primary hover:text-primary h-8 px-2 rounded-md"
        >
          <Link href="/clients">
            <span>All Clients</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="py-6 text-center flex flex-col items-center justify-center gap-2 rounded-md bg-surface-subtle/40 border border-dashed border-border/70 p-4">
          <Building2 className="w-6 h-6 text-muted-foreground/60" />
          <p className="text-xs font-semibold text-foreground">No Active Clients Yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Add your first client account to track products and delivery workloads.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-1 text-xs h-7.5 rounded-md font-semibold">
            <Link href="/clients/new">Create Client</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
        {clients.map((client) => {
          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="py-3 px-2 -mx-2 rounded-md flex items-center justify-between gap-3 group hover:bg-surface-subtle/70 transition-all"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {client.name}
                  </span>
                  <ClientStatusBadge
                    status={client.status}
                    className="text-xs px-1.5 py-0 font-semibold  "
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-muted-foreground" />
                    <span>
                      {client.productCount} product{client.productCount !== 1 ? "s" : ""}
                    </span>
                  </span>
                  {client.domain && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{client.domain}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-semibold text-foreground">
                    {client.openTaskCount}
                  </span>
                  <span className="text-xs text-muted-foreground block -mt-0.5">
                    open
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      )}
    </div>
  );
}
