"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useResetDefaultRolesMutation,
} from "@/store/api/rolesApi";
import {
  Button,
  PageHeader,
  ConfirmDialog,
  SearchInput,
  KpiCard,
  SegmentedTabs,
} from "@zsyio/ui";

const CATEGORY_FILTERS: { id: string; label: string; groupIds?: string[] }[] = [
  { id: "all", label: "All Modules" },
  { id: "apps", label: "App Access", groupIds: ["apps"] },
  { id: "tasks", label: "Tasks & Workflows", groupIds: ["tasks"] },
  { id: "notes", label: "Notes & Docs", groupIds: ["notes"] },
  { id: "timesheet", label: "HRMS & Timesheet", groupIds: ["timesheet"] },
  { id: "business", label: "Clients & Products", groupIds: ["clients", "products"] },
  { id: "admin", label: "Workspace & Admin", groupIds: ["dashboard", "reports", "teams", "users", "roles"] },
];
import { getErrorMessage } from "@zsyio/ui";
import {
  ACTION_GROUPS,
  ALL_ACTIONS,
  type Action,
} from "@zsyio/auth/permissions";
import type { CustomRole } from "@zsyio/types";
import { RoleFormModal } from "@/components/roles/RoleFormModal";
import { roleFormSchema, type RoleFormValues } from "@/components/roles/role-form-schema";
import { RolesCardGrid } from "@/components/roles/RolesCardGrid";
import { RolesMatrixView } from "@/components/roles/RolesMatrixView";
import {
  ShieldCheck,
  Shield,
  Plus,
  RotateCcw,
  Sparkles,
  Sliders,
} from "lucide-react";

export function RolesView() {
  const { data: rawRoles = [] } = useGetRolesQuery();
  const roles = useMemo(() => {
    return rawRoles.filter((r) => r.name !== "SUPER_ADMIN");
  }, [rawRoles]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [resetDefaults, { isLoading: isResetting }] = useResetDefaultRolesMutation();

  const [viewMode, setViewMode] = useState<string>("matrix");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      label: "",
      description: "",
      color: "purple",
      icon: "shield",
    },
  });

  const [color, setColor] = useState("purple");
  const [icon, setIcon] = useState("shield");

  const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  const systemRolesCount = useMemo(() => roles.filter((r) => r.isSystem).length, [roles]);
  const customRolesCount = useMemo(() => roles.filter((r) => !r.isSystem).length, [roles]);

  const filteredActionGroups = useMemo(() => {
    let groups = ACTION_GROUPS;

    // Filter by selected category tab
    if (selectedCategoryTab !== "all") {
      const activeFilter = CATEGORY_FILTERS.find((f) => f.id === selectedCategoryTab);
      if (activeFilter?.groupIds) {
        groups = groups.filter((g) => activeFilter.groupIds!.includes(g.id));
      }
    }

    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map((group) => {
        const matchGroupTitle = group.title.toLowerCase().includes(q);
        const filteredActions = group.actions.filter(
          (a) =>
            matchGroupTitle ||
            a.label.toLowerCase().includes(q) ||
            a.id.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q)
        );
        return { ...group, actions: filteredActions };
      })
      .filter((g) => g.actions.length > 0);
  }, [searchQuery, selectedCategoryTab]);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    reset({
      name: "",
      label: "",
      description: "",
      color: "purple",
      icon: "shield",
    });
    setColor("purple");
    setIcon("shield");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: CustomRole) => {
    setEditingRole(role);
    reset({
      label: role.label,
      description: role.description || "",
      color: role.color || "purple",
      icon: role.icon || "shield",
    });
    setColor(role.color || "purple");
    setIcon(role.icon || "shield");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values: RoleFormValues) => {
    try {
      if (editingRole) {
        await updateRole({
          id: editingRole.id,
          body: {
            label: values.label,
            description: values.description || null,
            color,
            icon,
          },
        }).unwrap();
        toast.success(`Role "${values.label}" updated successfully.`);
      } else {
        if (!values.name) {
          toast.error("Role identifier is required when creating a custom role.");
          return;
        }
        await createRole({
          name: values.name,
          label: values.label,
          description: values.description || null,
          permissions: [],
          color,
          icon,
        }).unwrap();
        toast.success(`Custom role "${values.label}" created. You can now toggle permissions.`);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save role."));
    }
  };

  const handleToggleMatrix = async (role: CustomRole, actionId: Action) => {
    const key = `${role.id}:${actionId}`;
    if (savingKeys[key]) return;

    if (
      role.name === "ADMIN" &&
      (actionId === "user:manage" ||
        actionId === "role:manage" ||
        actionId === "dashboard:view" ||
        actionId === "app:access:admin")
    ) {
      toast.error("This permission is mandatory for Administrator clearance.");
      return;
    }

    const currentPerms = (role.permissions as Action[]) || [];
    const hasPerm = currentPerms.includes(actionId);
    const newPerms = hasPerm
      ? currentPerms.filter((p) => p !== actionId)
      : [...currentPerms, actionId];

    setSavingKeys((prev) => ({ ...prev, [key]: true }));

    try {
      await updateRole({
        id: role.id,
        body: { permissions: newPerms },
      }).unwrap();

      toast.success(
        hasPerm
          ? `Revoked "${actionId}" from ${role.label}`
          : `Granted "${actionId}" to ${role.label}`,
        { duration: 2000 }
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update permission."));
    } finally {
      setSavingKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleToggleCategory = async (
    role: CustomRole,
    groupActionIds: Action[],
    categoryId: string
  ) => {
    const key = `${role.id}:cat:${categoryId}`;
    if (savingKeys[key]) return;

    const currentPerms = (role.permissions as Action[]) || [];
    const activeInGroup = groupActionIds.filter((a) => currentPerms.includes(a)).length;
    const allSelected = activeInGroup === groupActionIds.length;

    let newPerms: Action[];
    if (allSelected) {
      newPerms = currentPerms.filter((p) => {
        if (
          role.name === "ADMIN" &&
          (p === "user:manage" ||
            p === "role:manage" ||
            p === "dashboard:view" ||
            p === "app:access:admin")
        ) {
          return true;
        }
        return !groupActionIds.includes(p);
      });
    } else {
      const set = new Set([...currentPerms, ...groupActionIds]);
      newPerms = Array.from(set);
    }

    setSavingKeys((prev) => ({ ...prev, [key]: true }));

    try {
      await updateRole({
        id: role.id,
        body: { permissions: newPerms },
      }).unwrap();

      toast.success(
        allSelected
          ? `Cleared category capabilities for ${role.label}`
          : `Granted all category capabilities to ${role.label}`
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update category permissions."));
    } finally {
      setSavingKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole(roleToDelete.id).unwrap();
      toast.success(`Role "${roleToDelete.label}" deleted.`);
      setRoleToDelete(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete role."));
    }
  };

  const handleResetDefaultsConfirm = async () => {
    try {
      await resetDefaults().unwrap();
      toast.success("Standard system roles reset to default configurations.");
      setIsResetConfirmOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to reset roles."));
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Roles &amp; Access Permissions"
        description="Manage system roles, create custom authorization levels, and configure resource access matrices."
        eyebrow="Access Control"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              className="gap-1.5 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Reset Defaults</span>
            </Button>
            <Button
              onClick={handleOpenCreateModal}
              size="sm"
              className="gap-1.5 rounded-lg font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </Button>
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <KpiCard
          label="Configured Roles"
          value={roles.length}
          icon={<Shield className="w-5 h-5" />}
          variant="primary"
        />
        <KpiCard
          label="System Roles"
          value={systemRolesCount}
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="purple"
        />
        <KpiCard
          label="Custom Roles"
          value={customRolesCount}
          icon={<Sparkles className="w-5 h-5" />}
          variant="sky"
        />
        <KpiCard
          label="Granular Actions"
          value={ALL_ACTIONS.length}
          icon={<Sliders className="w-5 h-5" />}
          variant="primary"
        />
      </div>

      {/* Non-Technical Quick Guide Banner */}
      <div className="rounded-lg border border-border/80 bg-surface-subtle/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 text-xs shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-xs">
              Simple Access Management
            </span>
            <span className="text-muted-foreground text-xs leading-relaxed">
              Use <strong>App Access</strong> to select which apps team members can open (PMS, Notes, HRMS, Admin). Click any module&apos;s summary button (e.g. <em>Full</em> or <em>No Access</em>) to toggle all permissions in that module in one click.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "matrix" ? "cards" : "matrix")}
            className="text-primary hover:text-primary-hover hover:underline text-xs font-semibold cursor-pointer"
          >
            {viewMode === "matrix" ? "Switch to Role Cards view →" : "Switch to Permission Matrix →"}
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <SegmentedTabs
          tabs={[
            { id: "matrix", label: "Permission Matrix" },
            { id: "cards", label: "Role Cards" },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />

        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search permissions or modules..."
          />
        </div>
      </div>

      {/* Category Filter Tabs (When in Matrix Mode) */}
      {viewMode === "matrix" && (
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <SegmentedTabs
            tabs={CATEGORY_FILTERS.map((cat) => ({
              id: cat.id,
              label: cat.label,
            }))}
            value={selectedCategoryTab}
            onChange={setSelectedCategoryTab}
            size="sm"
          />
        </div>
      )}

      {/* Main View */}
      {viewMode === "matrix" ? (
        <RolesMatrixView
          roles={roles}
          filteredActionGroups={filteredActionGroups}
          savingKeys={savingKeys}
          onEdit={handleOpenEditModal}
          onToggleMatrix={handleToggleMatrix}
          onToggleCategory={handleToggleCategory}
        />
      ) : (
        <RolesCardGrid
          roles={roles}
          onEdit={handleOpenEditModal}
          onDelete={(r) => setRoleToDelete(r)}
          onConfigureInMatrix={() => setViewMode("matrix")}
        />
      )}

      {/* Role Create / Edit Modal */}
      <RoleFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingRole={editingRole}
        register={register}
        errors={errors}
        color={color}
        setColor={setColor}
        icon={icon}
        setIcon={setIcon}
        isSaving={isCreating || isUpdating}
        onSubmit={handleSubmit(handleFormSubmit)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(roleToDelete)}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
        title={`Delete Role: ${roleToDelete?.label}?`}
        description="Are you sure you want to delete this custom role? This action cannot be undone."
        confirmLabel="Delete Role"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Reset Defaults Confirmation */}
      <ConfirmDialog
        open={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title="Reset System Roles to Default?"
        description="This will restore all built-in roles (Admin, Manager, Developer, Support) to their default permissions and colors. Custom roles will remain unaffected."
        confirmLabel={isResetting ? "Resetting..." : "Reset to Defaults"}
        variant="primary"
        onConfirm={handleResetDefaultsConfirm}
      />
    </div>
  );
}
