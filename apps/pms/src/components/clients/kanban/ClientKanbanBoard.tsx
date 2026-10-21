"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useGetClientsQuery,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "@/store/api/clientsApi";
import { ClientKanbanColumn, type ColumnDef } from "./ClientKanbanColumn";
import { QuickIntakeModal } from "./QuickIntakeModal";
import { AdminNotesDrawer } from "./AdminNotesDrawer";
import { ConfirmDialog } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { SegmentedTabs } from "@zsyio/ui";
import { Skeleton } from "@zsyio/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@zsyio/ui";
import { toast } from "sonner";
import { getDaysDifference } from "@zsyio/ui";
import { getErrorMessage } from "@zsyio/ui";
import { motion, LayoutGroup } from "framer-motion";
import {
  StickyNote,
  RefreshCw,
  X,
  AlertTriangle,
  Search,
  LayoutGrid,
  List,
  UserPlus,
} from "lucide-react";
import type { Client, ClientStatus } from "@zsyio/types";

const DEFAULT_CLIENT_COLUMNS: ColumnDef[] = [
  { status: "INTAKE", label: "Intake", icon: "INTAKE" },
  { status: "ONBOARDING", label: "Onboarding", icon: "ONBOARDING" },
  { status: "ACTIVE", label: "Active", icon: "ACTIVE" },
  { status: "PAUSED", label: "Paused", icon: "PAUSED" },
  { status: "CHURNED", label: "Churned", icon: "CHURNED" },
];

interface ClientKanbanBoardProps {
  canEdit?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

export function ClientKanbanBoard({
  canEdit = true,
  canCreate = true,
  canDelete = false,
}: ClientKanbanBoardProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [contractFilter, setContractFilter] = useState<string>("ALL");
  const [notesFilter, setNotesFilter] = useState<string>("ALL");
  const [productFilter, setProductFilter] = useState<string>("ALL");

  // Modals state
  const [isQuickIntakeOpen, setIsQuickIntakeOpen] = useState(false);
  const [isAdminNotesDrawerOpen, setIsAdminNotesDrawerOpen] = useState(false);
  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const [deleteClient, { isLoading: isDeletingClient }] = useDeleteClientMutation();

  // Columns state with reordering support matching task KanbanBoard
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_CLIENT_COLUMNS);
  const [draggedColumnStatus, setDraggedColumnStatus] = useState<string | null>(null);

  const {
    data: clientsResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetClientsQuery({
    pageSize: 100,
  });

  const [updateClient] = useUpdateClientMutation();

  const allClients = useMemo(() => clientsResponse?.items ?? [], [clientsResponse]);

  // Load saved column order from localStorage
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("zsyio_client_kanban_columns_order");
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder) as ColumnDef[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingStatuses = new Set(parsed.map((c) => c.status));
          const missingDefaults = DEFAULT_CLIENT_COLUMNS.filter((c) => !existingStatuses.has(c.status));
          setColumns([...parsed, ...missingDefaults]);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to load saved client kanban column order from localStorage:", err);
      setColumns(DEFAULT_CLIENT_COLUMNS);
    }
  }, []);

  const handleReorderColumns = useCallback(
    (sourceStatus: string, targetStatus: string) => {
      if (sourceStatus === targetStatus) return;

      setColumns((prev) => {
        const sourceIndex = prev.findIndex((c) => c.status === sourceStatus);
        const targetIndex = prev.findIndex((c) => c.status === targetStatus);
        if (sourceIndex === -1 || targetIndex === -1) return prev;

        const next = [...prev];
        const [movedColumn] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, movedColumn);

        try {
          localStorage.setItem("zsyio_client_kanban_columns_order", JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const handleMoveColumnDirection = useCallback(
    (statusToMove: string, direction: "left" | "right") => {
      setColumns((prev) => {
        const currentIndex = prev.findIndex((c) => c.status === statusToMove);
        if (currentIndex === -1) return prev;

        const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;

        const next = [...prev];
        const [movedColumn] = next.splice(currentIndex, 1);
        next.splice(targetIndex, 0, movedColumn);

        try {
          localStorage.setItem("zsyio_client_kanban_columns_order", JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return allClients.filter((client) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = client.name.toLowerCase().includes(q);
        const domainMatch = client.domain?.toLowerCase().includes(q);
        const contactMatch = client.contactName?.toLowerCase().includes(q);
        const emailMatch = client.contactEmail?.toLowerCase().includes(q);
        const notesMatch = client.notes?.toLowerCase().includes(q);
        if (!nameMatch && !domainMatch && !contactMatch && !emailMatch && !notesMatch) {
          return false;
        }
      }

      // 2. Contract Expiry Filter
      if (contractFilter === "EXPIRING_SOON") {
        if (!client.contractEnd) return false;
        const days = getDaysDifference(client.contractEnd);
        if (days < 0 || days > 30) return false;
      } else if (contractFilter === "EXPIRED") {
        if (!client.contractEnd) return false;
        const days = getDaysDifference(client.contractEnd);
        if (days >= 0) return false;
      } else if (contractFilter === "ACTIVE_CONTRACT") {
        if (!client.contractEnd) return false;
        const days = getDaysDifference(client.contractEnd);
        if (days <= 0) return false;
      }

      // 3. Notes Filter
      if (notesFilter === "HAS_NOTES" && !client.notes?.trim()) {
        return false;
      }
      if (notesFilter === "NO_NOTES" && client.notes?.trim()) {
        return false;
      }

      // 4. Products Filter
      const prodCount = client.products?.length || 0;
      if (productFilter === "WITH_PRODUCTS" && prodCount === 0) {
        return false;
      }
      if (productFilter === "NO_PRODUCTS" && prodCount > 0) {
        return false;
      }

      return true;
    });
  }, [allClients, searchQuery, contractFilter, notesFilter, productFilter]);

  // Clients grouped by status
  const clientsByStatus = useMemo(() => {
    const map: Record<string, Client[]> = {
      INTAKE: [],
      ONBOARDING: [],
      ACTIVE: [],
      PAUSED: [],
      CHURNED: [],
    };
    filteredClients.forEach((client) => {
      if (map[client.status]) {
        map[client.status].push(client);
      } else {
        map.ACTIVE.push(client);
      }
    });
    return map;
  }, [filteredClients]);

  // Status transition handlers
  const handleStatusChange = useCallback(
    async (client: Client, newStatus: ClientStatus) => {
      if (client.status === newStatus) return;

      // Prevent moving back to INTAKE once onboarding has started
      if (newStatus === "INTAKE" && client.status !== "INTAKE") {
        toast.error(`"${client.name}" cannot be moved back to Intake once onboarding has started.`);
        return;
      }

      try {
        await updateClient({
          id: client.id,
          body: { status: newStatus },
        }).unwrap();
        toast.success(`Moved ${client.name} to ${newStatus}`);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to update client status"));
      }
    },
    [updateClient]
  );

  const handleDropClient = useCallback(
    async (clientId: string, targetStatus: ClientStatus) => {
      const client = allClients.find((c) => c.id === clientId);
      if (!client || client.status === targetStatus) return;

      // Prevent moving back to INTAKE once onboarding has started
      if (targetStatus === "INTAKE" && client.status !== "INTAKE") {
        toast.error(`"${client.name}" cannot be moved back to Intake once onboarding has started.`);
        return;
      }

      await handleStatusChange(client, targetStatus);
    },
    [allClients, handleStatusChange]
  );

  const handleDeleteClientConfirm = useCallback(async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id).unwrap();
      toast.success(
        clientToDelete.status === "INTAKE"
          ? `Intake lead "${clientToDelete.name}" removed.`
          : `Client "${clientToDelete.name}" deleted.`
      );
      setClientToDelete(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete client."));
    }
  }, [clientToDelete, deleteClient]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    contractFilter !== "ALL" ||
    notesFilter !== "ALL" ||
    productFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setContractFilter("ALL");
    setNotesFilter("ALL");
    setProductFilter("ALL");
  };

  const activeFilterCount = [
    Boolean(searchQuery),
    contractFilter !== "ALL",
    notesFilter !== "ALL",
    productFilter !== "ALL",
  ].filter(Boolean).length;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-destructive/20 bg-destructive/5 my-6">
        <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground">Failed to load clients</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          There was an error communicating with the database. Please try refreshing.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar matching TaskFiltersBar */}
      <div className="flex flex-col gap-2.5 bg-card p-3 rounded-lg border border-border shadow-xs">
        {/* Top Row: Search Input + Active Filter Count Badge + SegmentedTabs */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search clients by name, domain, notes, contact... (⌘K)"
              className="pl-9 pr-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
            </span>
          )}

          <div className="flex-1" />

          <SegmentedTabs<"kanban" | "table">
            value="kanban"
            onChange={(v) => {
              if (v === "table") router.push("/clients");
            }}
            size="sm"
            tabs={[
              {
                id: "kanban",
                label: "Board",
                icon: <LayoutGrid className="w-3.5 h-3.5" />,
              },
              {
                id: "table",
                label: "List",
                icon: <List className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>

        {/* Bottom Row: Filter Dropdowns + Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Contract Filter */}
          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px] border-border/80">
              <SelectValue placeholder="Contract Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Contracts</SelectItem>
              <SelectItem value="ACTIVE_CONTRACT">Active Contract</SelectItem>
              <SelectItem value="EXPIRING_SOON">Expiring Soon (≤30d)</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          {/* Notes Filter */}
          <Select value={notesFilter} onValueChange={setNotesFilter}>
            <SelectTrigger className="h-8 text-xs w-[130px] border-border/80">
              <SelectValue placeholder="Admin Notes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Notes</SelectItem>
              <SelectItem value="HAS_NOTES">Has Notes</SelectItem>
              <SelectItem value="NO_NOTES">No Notes</SelectItem>
            </SelectContent>
          </Select>

          {/* Products Filter */}
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="h-8 text-xs w-[130px] border-border/80">
              <SelectValue placeholder="Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              <SelectItem value="WITH_PRODUCTS">With Products</SelectItem>
              <SelectItem value="NO_PRODUCTS">No Products</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-2.5 text-xs gap-1.5 border-border/80 hover:bg-surface-elevated"
            title="Refresh clients data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {canCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuickIntakeOpen(true)}
              className="h-8 px-3 text-xs font-semibold gap-1.5 border-notion-purple-fg/40 text-notion-purple-fg hover:bg-notion-purple shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Intake Lead</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDrawerClientId(null);
              setIsAdminNotesDrawerOpen(true);
            }}
            className="h-8 px-3 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary-light"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Admin Notes Feed</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board Columns Container using LayoutGroup matching Task KanbanBoard */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
          {DEFAULT_CLIENT_COLUMNS.map((col) => (
            <div
              key={col.status}
              className="flex w-[280px] sm:w-[300px] shrink-0 flex-col gap-3 rounded-lg border border-border/60 bg-surface-subtle/40 p-3.5"
            >
              <div className="flex items-center gap-2 px-1 py-1">
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-6 rounded-full ml-auto" />
              </div>
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x scrollbar-thin">
          <LayoutGroup id="client-kanban-board-columns">
            {columns.map((col, index) => (
              <motion.div
                key={col.status}
                layout
                layoutId={`client-kanban-col-${col.status}`}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="snap-start"
              >
                <ClientKanbanColumn
                  status={col.status}
                  label={col.label}
                  clients={clientsByStatus[col.status] || []}
                  onDrop={handleDropClient}
                  onOpenNotesModal={(client) => router.push(`/clients/${client.id}/notes`)}
                  onStatusChange={handleStatusChange}
                  onDeleteClient={(client) => setClientToDelete(client)}
                  onOpenQuickIntake={() => setIsQuickIntakeOpen(true)}
                  onReorderColumn={handleReorderColumns}
                  draggedColumnStatus={draggedColumnStatus}
                  onColumnDragStart={(s) => setDraggedColumnStatus(s)}
                  onColumnDragEnd={() => setDraggedColumnStatus(null)}
                  onMoveColumnLeft={() => handleMoveColumnDirection(col.status, "left")}
                  onMoveColumnRight={() => handleMoveColumnDirection(col.status, "right")}
                  isFirst={index === 0}
                  isLast={index === columns.length - 1}
                  canEdit={canEdit}
                  canCreate={canCreate}
                  canDelete={canDelete}
                />
              </motion.div>
            ))}
          </LayoutGroup>
        </div>
      )}

      {/* Quick Intake Modal for leads in pipeline */}
      <QuickIntakeModal
        isOpen={isQuickIntakeOpen}
        onClose={() => setIsQuickIntakeOpen(false)}
      />

      {/* Full Admin Short Notes Drawer */}
      <AdminNotesDrawer
        isOpen={isAdminNotesDrawerOpen}
        onClose={() => setIsAdminNotesDrawerOpen(false)}
        selectedClientId={drawerClientId}
        onSelectClient={(cId) => setDrawerClientId(cId)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(clientToDelete)}
        onOpenChange={(open) => {
          if (!open) setClientToDelete(null);
        }}
        title={
          clientToDelete?.status === "INTAKE"
            ? `Delete Intake Lead "${clientToDelete?.name}"?`
            : `Delete Client "${clientToDelete?.name}"?`
        }
        description={
          clientToDelete?.status === "INTAKE"
            ? "Are you sure you want to remove this lead from the intake pipeline?"
            : "Are you sure you want to delete this client? All registered products, tasks, and historical activity will be archived."
        }
        confirmText={
          isDeletingClient
            ? "Deleting..."
            : clientToDelete?.status === "INTAKE"
            ? "Remove Lead"
            : "Delete Client"
        }
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeletingClient}
        onConfirm={handleDeleteClientConfirm}
      />
    </div>
  );
}
