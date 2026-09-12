"use client";

import { useMemo } from "react";
import { useGetRolesQuery } from "@/store/api/rolesApi";
import { USER_ROLE_CONFIG } from "@zsyio/ui";
import type { Role, User } from "@zsyio/types";

export interface AvailableRoleEntry {
  id?: string;
  name: string;
  label: string;
  color?: string | null;
  isSystem?: boolean;
}

const STANDARD_ROLES: Array<{ name: Role; label: string; color: string }> = [
  { name: "ADMIN", label: "Admin", color: "purple" },
  { name: "MANAGER", label: "Manager", color: "amber" },
  { name: "DEVELOPER", label: "Developer", color: "blue" },
  { name: "SUPPORT", label: "Support", color: "emerald" },
];

function standardRoleColor(roleName: string): string {
  if (roleName === "ADMIN") return "purple";
  if (roleName === "MANAGER") return "amber";
  if (roleName === "DEVELOPER") return "blue";
  return "emerald";
}

type UserLike = Pick<User, "role" | "customRole">;

export function useAvailableRoles(users?: UserLike | UserLike[] | null): AvailableRoleEntry[] {
  const { data: roles = [] } = useGetRolesQuery();
  const userList = useMemo(() => (Array.isArray(users) ? users : users ? [users] : []), [users]);

  return useMemo(() => {
    const roleMap = new Map<string, AvailableRoleEntry>();

    for (const sys of STANDARD_ROLES) {
      roleMap.set(sys.name, {
        id: sys.name,
        name: sys.name,
        label: sys.label,
        color: sys.color,
        isSystem: true,
      });
    }

    for (const r of roles) {
      if (r.name !== "SUPER_ADMIN") {
        roleMap.set(r.name, {
          id: r.id,
          name: r.name,
          label: r.label || r.name,
          color: r.color || "purple",
          isSystem: r.isSystem,
        });
      }
    }

    for (const u of userList) {
      if (u.customRole && u.customRole.name !== "SUPER_ADMIN") {
        if (!roleMap.has(u.customRole.name)) {
          roleMap.set(u.customRole.name, {
            id: u.customRole.id,
            name: u.customRole.name,
            label: u.customRole.label || u.customRole.name,
            color: u.customRole.color || "purple",
            isSystem: false,
          });
        }
      } else if (u.role && u.role !== "SUPER_ADMIN") {
        const roleKey = String(u.role);
        if (!roleMap.has(roleKey)) {
          const cfg = USER_ROLE_CONFIG[roleKey];
          roleMap.set(roleKey, {
            id: roleKey,
            name: roleKey,
            label: cfg?.label || roleKey,
            color: standardRoleColor(roleKey),
            isSystem: true,
          });
        }
      }
    }

    return Array.from(roleMap.values());
  }, [roles, userList]);
}
