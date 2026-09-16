"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Globe,
  Mail,
  Phone,
  Package,
  ChevronRight,
  Users,
  LayoutGrid,
  List as ListIcon,
  Building2,
  CheckCircle2,
  Clock,
  Boxes,
  X,
} from "lucide-react";

import { useGetClientsQuery } from "@/store/api/clientsApi";
import { ClientStatusBadge } from "./ClientStatusBadge";
import { Skeleton } from "@zsyio/ui";
import { EmptyState, KpiCard, SearchInput } from "@/components/shared";
import { Button } from "@zsyio/ui";
import { SegmentedTabs } from "@zsyio/ui";
import type { Client } from "@zsyio/types";

const STATUS_OPTIONS = ["ALL", "ONBOARDING", "ACTIVE", "PAUSED", "CHURNED"] as const;

export function ClientTypeBadge({ type }: { type?: string }) {
  if (type === "SALES") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
        Sales
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
      Dev
    </span>
  );
}

function ClientCard({ client }: { client: Client }) {
  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const products = client.products ?? [];

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group relative flex flex-col rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 overflow-hidden"
    >
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary-light text-primary border border-primary/20 flex items-center justify-center shrink-0 font-bold text-sm group-hover:border-primary/50 group-hover:scale-105 transition-all overflow-hidden shadow-2xs">
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
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors truncate">
                {client.name}
              </h3>
              {client.domain ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Globe className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{client.domain}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/50">No domain configured</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ClientTypeBadge type={client.clientType} />
            <ClientStatusBadge status={client.status} />
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 py-1 text-xs text-muted-foreground">
          {client.contactName ? (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
              <span className="truncate font-medium text-foreground/80">{client.contactName}</span>
            </div>
          ) : null}
          {client.contactEmail ? (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
              <span className="truncate">{client.contactEmail}</span>
            </div>
          ) : null}
          {client.contactPhone ? (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
              <span>{client.contactPhone}</span>
            </div>
          ) : null}
          {!client.contactName && !client.contactEmail && !client.contactPhone && (
            <span className="text-muted-foreground/40 italic">No contact details listed</span>
          )}
        </div>

        <div className="border-t border-border/60 pt-3 mt-auto">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Products
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {products.length} registered
            </span>
          </div>

          {products.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {products.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 text-xs py-0.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                    <span className="text-foreground/90 truncate font-medium">{p.name}</span>
                    {p.version && (
                      <span className="text-[10px] text-muted-foreground/70">v{p.version}</span>
                    )}
                  </div>
                  {p.environment && (
                    <span className="px-1.5 py-0.2 text-[10px] font-medium rounded-md bg-surface-subtle text-muted-foreground border border-border/60 uppercase tracking-wider shrink-0">
                      {p.environment}
                    </span>
                  )}
                </div>
              ))}
              {products.length > 2 && (
                <span className="text-[11px] text-muted-foreground/70 font-medium pt-0.5">
                  +{products.length - 2} more product{products.length - 2 > 1 ? "s" : ""}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50 italic">No products provisioned</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ClientTableRow({ client }: { client: Client }) {
  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const products = client.products ?? [];

  return (
    <tr className="group border-b border-border/60 hover:bg-surface-subtle/70 transition-colors">
      <td className="py-3.5 px-4">
        <Link href={`/clients/${client.id}`} className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shrink-0 font-bold text-xs group-hover:scale-105 transition-all overflow-hidden shadow-2xs">
            {client.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={client.logoUrl}
                alt={client.name}
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors block truncate">
              {client.name}
            </span>
            {client.domain ? (
              <span className="text-xs text-muted-foreground block truncate">{client.domain}</span>
            ) : (
              <span className="text-xs text-muted-foreground/40 block">-</span>
            )}
          </div>
        </Link>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap">
        <ClientStatusBadge status={client.status} />
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap">
        <ClientTypeBadge type={client.clientType} />
      </td>

      <td className="py-3.5 px-4 text-xs">
        {client.contactName ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">{client.contactName}</span>
            {client.contactEmail && (
              <span className="text-muted-foreground truncate">{client.contactEmail}</span>
            )}
          </div>
        ) : client.contactEmail ? (
          <span className="text-muted-foreground">{client.contactEmail}</span>
        ) : (
          <span className="text-muted-foreground/40">-</span>
        )}
      </td>

      <td className="py-3.5 px-4 text-xs">
        {products.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground">{products.length}</span>
            <span className="text-muted-foreground">product{products.length !== 1 ? "s" : ""}</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground truncate max-w-[160px]">
              {products.map((p) => p.name).slice(0, 2).join(", ")}
              {products.length > 2 ? ` +${products.length - 2}` : ""}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground/40">0 products</span>
        )}
      </td>

      <td className="py-3.5 px-4 text-right">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-muted-foreground group-hover:text-primary group-hover:bg-primary-light/50">
          <Link href={`/clients/${client.id}`}>
            <span>View</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs flex flex-col justify-between">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="flex flex-col gap-1.5 min-w-0">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
            <Skeleton className="h-3 w-44 rounded-md" />
          </div>
        </div>

        <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
          <Skeleton className="h-3 w-24 rounded-md" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-32 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientTable() {
  const { data, isLoading } = useGetClientsQuery({ page: 1, pageSize: 50, clientType: "DEVELOPMENT" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const clients = useMemo(() => data?.items ?? [], [data?.items]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchStatus =
        statusFilter === "ALL" ? c.status !== "INTAKE" : c.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.domain ?? "").toLowerCase().includes(q) ||
        (c.contactEmail ?? "").toLowerCase().includes(q) ||
        (c.contactName ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [clients, search, statusFilter]);

  // Counts by status for tabs (excluding INTAKE leads which live in Pipeline)
  const counts = useMemo(() => {
    const mainClients = clients.filter((c) => c.status !== "INTAKE");
    const total = mainClients.length;
    const active = clients.filter((c) => c.status === "ACTIVE").length;
    const onboarding = clients.filter((c) => c.status === "ONBOARDING").length;
    const paused = clients.filter((c) => c.status === "PAUSED").length;
    const churned = clients.filter((c) => c.status === "CHURNED").length;
    const totalProducts = mainClients.reduce((s, c) => s + (c.products?.length ?? 0), 0);
    return { total, active, onboarding, paused, churned, totalProducts };
  }, [clients]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card shadow-xs"
            >
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card shadow-xs">
          <Skeleton className="h-9 w-full sm:w-80 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!clients.length) {
    return (
      <EmptyState
        title="No clients yet"
        description="Create your first enterprise client to manage products, tasks, and contact points."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <KpiCard
          label="Total Clients"
          value={counts.total}
          icon={<Building2 className="w-5 h-5" />}
          variant="primary"
        />

        <KpiCard
          label="Active Accounts"
          value={counts.active}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />

        <KpiCard
          label="Onboarding"
          value={counts.onboarding}
          icon={<Clock className="w-5 h-5" />}
          variant="sky"
        />

        <KpiCard
          label="Managed Products"
          value={counts.totalProducts}
          icon={<Boxes className="w-5 h-5" />}
          variant="primary"
        />
      </div>


      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-2 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <SearchInput
            placeholder="Search by client name, domain, contact..."
            value={search}
            onChange={setSearch}
            size="sm"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0">
          <SegmentedTabs<typeof STATUS_OPTIONS[number]>
            value={statusFilter}
            onChange={setStatusFilter}
            size="sm"
            tabs={STATUS_OPTIONS.map((s) => ({
              id: s,
              label: s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase(),
              count:
                s === "ALL"
                  ? counts.total
                  : s === "ACTIVE"
                  ? counts.active
                  : s === "ONBOARDING"
                  ? counts.onboarding
                  : s === "PAUSED"
                  ? counts.paused
                  : counts.churned,
              badgeVariant: s === "CHURNED" ? "rose" : s === "ACTIVE" ? "emerald" : "default",
            }))}
          />

          <div className="h-5 w-px bg-border/60 hidden sm:block mx-1" />

          <SegmentedTabs<"grid" | "table">
            value={viewMode}
            onChange={setViewMode}
            size="sm"
            tabs={[
              {
                id: "grid",
                label: "",
                icon: <LayoutGrid className="w-3.5 h-3.5" />,
              },
              {
                id: "table",
                label: "",
                icon: <ListIcon className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>
      </div>


      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          Showing <strong className="text-foreground font-semibold">{filtered.length}</strong> of{" "}
          {clients.length} client{clients.length !== 1 ? "s" : ""}
          {statusFilter !== "ALL" || search ? " (filtered)" : ""}
        </span>
        {(search || statusFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1 px-2"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
          >
            <X className="w-3 h-3" />
            <span>Reset filters</span>
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No clients match your filter"
          description="Try modifying search keywords or clearing status filters."
        />
      ) : viewMode === "grid" ? (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-subtle/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Primary Contact</th>
                  <th className="py-3 px-4 font-semibold">Products</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((client) => (
                  <ClientTableRow key={client.id} client={client} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

