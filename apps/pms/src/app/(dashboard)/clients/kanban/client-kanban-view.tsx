"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGetClientsQuery } from "@/store/api/clientsApi";
import { useGetDashboardNotesQuery } from "@/store/api/dashboardNotesApi";
import { ClientKanbanBoard } from "@/components/clients/kanban/ClientKanbanBoard";
import { PageHeader, KpiCard } from "@/components/shared";
import { Button } from "@zsyio/ui";
import { can, type Role } from "@zsyio/auth/permissions";
import {
  Columns3,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  PauseCircle,
  StickyNote,
} from "lucide-react";

interface ClientKanbanViewProps {
  role: Role | string;
  permissions?: string[] | null;
}

export function ClientKanbanView({ role, permissions }: ClientKanbanViewProps) {
  const canCreateClient = can(role, "client:create", permissions);
  const canEditClient = can(role, "client:edit", permissions);
  const canDeleteClient = can(role, "client:delete", permissions);

  const { data: clientsData } = useGetClientsQuery({ pageSize: 100 });
  const { data: notesData } = useGetDashboardNotesQuery();

  const clients = useMemo(() => clientsData?.items ?? [], [clientsData]);
  const total = clients.length;

  const stats = useMemo(() => {
    let intake = 0;
    let onboarding = 0;
    let active = 0;
    let paused = 0;
    let churned = 0;

    clients.forEach((c) => {
      if (c.status === "INTAKE") intake++;
      else if (c.status === "ONBOARDING") onboarding++;
      else if (c.status === "ACTIVE") active++;
      else if (c.status === "PAUSED") paused++;
      else if (c.status === "CHURNED") churned++;
    });

    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;

    return { intake, onboarding, active, paused, churned, activeRate };
  }, [clients, total]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <PageHeader
        title="Client Tracking & Pipeline"
        titleIcon={<Columns3 className="w-5 h-5 text-primary" />}
        description="Visual Kanban board to track enterprise clients across intake, onboarding, active delivery, and paused stages with real-time admin notes."
        actions={
          canCreateClient ? (
            <Button asChild className="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs">
              <Link href="/clients/new">
                <Plus className="w-3.5 h-3.5" />
                <span>New Client</span>
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          label="Total Clients"
          value={total}
          subtext="Tracked in workspace"
          icon={<Building2 className="w-4 h-4 text-primary" />}
        />
        <KpiCard
          label="Intake"
          value={stats.intake}
          subtext="Discovery & intake"
          icon={<Clock className="w-4 h-4 text-notion-purple-fg" />}
        />
        <KpiCard
          label="Onboarding"
          value={stats.onboarding}
          subtext="In setup phase"
          icon={<Clock className="w-4 h-4 text-notion-blue-fg" />}
        />
        <KpiCard
          label="Active Clients"
          value={stats.active}
          subtext={`${stats.activeRate}% of portfolio`}
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
        />
        <KpiCard
          label="Paused / Stalled"
          value={stats.paused}
          subtext="Requires follow-up"
          icon={<PauseCircle className="w-4 h-4 text-warning" />}
        />
        <KpiCard
          label="Admin Notes"
          value={notesData?.length ?? 0}
          subtext="Short notes logged"
          icon={<StickyNote className="w-4 h-4 text-notion-purple-fg" />}
        />
      </div>

      {/* The Kanban Board */}
      <ClientKanbanBoard
        canEdit={canEditClient}
        canCreate={canCreateClient}
        canDelete={canDeleteClient}
      />
    </div>
  );
}
