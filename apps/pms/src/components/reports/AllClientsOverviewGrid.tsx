"use client";

import React from "react";
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  Globe,
  Mail,
  BarChart2,
} from "lucide-react";
import { reportsApi, type ClientSummaryItem } from "@/store/api/reportsApi";

interface AllClientsOverviewGridProps {
  clients: ClientSummaryItem[];
  onSelectClient?: (clientId: string) => void;
  onOpenClientModal?: (clientId: string, clientName: string) => void;
}

export function AllClientsOverviewGrid({
  clients,
  onSelectClient,
  onOpenClientModal,
}: AllClientsOverviewGridProps) {
  const prefetchClientReport = reportsApi.usePrefetch("getClientReport");

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 text-center flex flex-col items-center justify-center gap-2">
        <Building2 className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">No Client Accounts Found</p>
        <p className="text-xs text-muted-foreground">Add clients to view account performance reports.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-foreground tracking-tight">
              Client Accounts Health Matrix
            </h2>
            <p className="text-xs text-muted-foreground">
              Overview delivery stats across all active client organizations.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-surface-subtle px-3 py-1 rounded-full border border-border/60">
          {clients.length} Client Accounts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => {
          const isOverdue = client.overdueTasks > 0;

          const handleCardClick = () => {
            if (onOpenClientModal) {
              onOpenClientModal(client.id, client.name);
            } else {
              onSelectClient?.(client.id);
            }
          };

          return (
            <div
              key={client.id}
              onClick={handleCardClick}
              onMouseEnter={() => prefetchClientReport(client.id)}
              className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col justify-between gap-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-surface-subtle border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0 group-hover:border-primary/40 transition-colors overflow-hidden">
                      {client.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={client.logoUrl}
                          alt={client.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        client.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {client.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                      client.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                  {client.domain && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      {client.domain}
                    </span>
                  )}
                  {client.contactName && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {client.contactName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Completion
                  </span>
                  <span className="text-foreground font-extrabold">
                    {client.completionRate}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${client.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-surface-subtle p-2 rounded-xl border border-border/60 flex flex-col">
                  <span className="text-[10px] font-semibold text-muted-foreground">Products</span>
                  <span className="font-extrabold text-foreground">{client.productsCount}</span>
                </div>

                <div className="bg-surface-subtle p-2 rounded-xl border border-border/60 flex flex-col">
                  <span className="text-[10px] font-semibold text-muted-foreground">Total Tasks</span>
                  <span className="font-extrabold text-foreground">{client.totalTasks}</span>
                </div>

                <div
                  className={`p-2 rounded-xl border flex flex-col ${
                    isOverdue
                      ? "bg-red-500/10 border-red-500/20 text-red-600"
                      : "bg-surface-subtle border-border/60 text-foreground"
                  }`}
                >
                  <span className="text-[10px] font-semibold opacity-80">Overdue</span>
                  <span className="font-extrabold">{client.overdueTasks}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-bold text-primary">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenClientModal) {
                      onOpenClientModal(client.id, client.name);
                    } else {
                      onSelectClient?.(client.id);
                    }
                  }}
                  className="flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>View Client Analytics</span>
                </button>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
