"use client";

import { useState } from "react";
import { useGetAnalyticsReportQuery } from "@/store/api/reportsApi";
import { Skeleton } from "@zsyio/ui";
import { SegmentedTabs } from "@zsyio/ui";
import { PageHeader, KpiCard } from "@/components/shared";

import {
  BarChart3,
  Building2,
  Users,
  CheckCircle2,
  Zap,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { ReportsFilterBar } from "@/components/reports/ReportsFilterBar";
import { AllClientsOverviewGrid } from "@/components/reports/AllClientsOverviewGrid";
import { AnalyticsChartsSection } from "@/components/reports/AnalyticsChartsSection";
import { TeamCapacitySection } from "@/components/reports/TeamCapacitySection";
import { ClientReportModal } from "@/components/reports/ClientReportModal";

export function ReportsView() {
  // Modal State for Per-Client Analytics Report Modal
  const [modalClientId, setModalClientId] = useState<string | null>(null);
  const [modalClientName, setModalClientName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"clients" | "analytics" | "workload">("clients");


  const { data, isLoading, isFetching, refetch } = useGetAnalyticsReportQuery();

  const handleOpenClientModal = (clientId: string, clientName: string) => {
    setModalClientId(clientId);
    setModalClientName(clientName);
  };

  const handleCloseClientModal = () => {
    setModalClientId(null);
    setModalClientName("");
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-border/60">
          <div>
            <Skeleton className="h-7 w-56 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded-md mt-1.5" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-surface-subtle/70 rounded-2xl border border-border/70 w-fit">
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/80 bg-card p-4.5 flex flex-col gap-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="w-8 h-8 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-sm" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-8 h-8 rounded-xl" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-3 w-10 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <Skeleton className="h-3.5 w-32 rounded-md" />
                <Skeleton className="w-4 h-4 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const {
    clientSummaries,
    productsBreakdown,
    stats,
    byStatus,
    byPriority,
    byType,
    workload,
  } = data;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <PageHeader
        title="Reports & Analytics"
        titleIcon={<BarChart3 className="w-5 h-5 text-primary" />}
        description="Real-time client delivery matrix, SLA status, and team capacity insights."
      />

      <ReportsFilterBar
        onRefresh={() => refetch()}
        isFetching={isFetching}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Overall Completion"
          value={`${stats.completionRate}%`}
          subtext={`${stats.doneTasks}/${stats.totalTasks} completed`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />

        <KpiCard
          label="Active Workload"
          value={stats.activeTasks}
          subtext={`${stats.totalTasks} total tickets`}
          icon={<Zap className="w-5 h-5" />}
          variant="sky"
        />

        <KpiCard
          label="Overdue Tasks"
          value={stats.overdueTasks}
          subtext={stats.overdueTasks > 0 ? "requires action" : "all clear"}
          icon={<Clock className="w-5 h-5" />}
          variant={stats.overdueTasks > 0 ? "rose" : "default"}
        />

        <KpiCard
          label="Blocked Issues"
          value={stats.blockedTasks}
          subtext={stats.blockedTasks > 0 ? "requires unblocking" : "none blocked"}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={stats.blockedTasks > 0 ? "amber" : "default"}
        />
      </div>


      <div className="flex flex-col gap-6 w-full">
        <div className="overflow-x-auto pb-1 sm:pb-0">
          <SegmentedTabs<"clients" | "analytics" | "workload">
            value={activeTab}
            onChange={setActiveTab}
            size="md"
            tabs={[
              {
                id: "clients",
                label: "All Clients Matrix",
                icon: <Building2 className="w-3.5 h-3.5" />,
                count: clientSummaries.length,
              },
              {
                id: "analytics",
                label: "Visual Analytics",
                icon: <BarChart3 className="w-3.5 h-3.5" />,
              },
              {
                id: "workload",
                label: "Team Capacity",
                icon: <Users className="w-3.5 h-3.5" />,
                count: workload.length,
              },
            ]}
          />
        </div>

        {activeTab === "clients" && (
          <AllClientsOverviewGrid
            clients={clientSummaries}
            onOpenClientModal={handleOpenClientModal}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsChartsSection
            byStatus={byStatus}
            byPriority={byPriority}
            byType={byType}
            productsBreakdown={productsBreakdown}
            totalTasks={stats.totalTasks}
          />
        )}

        {activeTab === "workload" && (
          <TeamCapacitySection workload={workload} />
        )}

      </div>

      <ClientReportModal
        clientId={modalClientId}
        clientName={modalClientName}
        isOpen={Boolean(modalClientId)}
        onClose={handleCloseClientModal}
      />
    </div>
  );
}
