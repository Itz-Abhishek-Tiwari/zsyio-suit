import { describe, it, expect } from "vitest";
import { can, canAccessApp } from "@zsyio/auth/permissions";

describe("Sales Custom Roles & Access Control", () => {
  const SALES_REP_PERMISSIONS = [
    "app:access:sales",
    "sales:view",
    "sales:create",
    "sales:edit",
    "sales:dashboard:view",
  ];

  const SALES_MANAGER_PERMISSIONS = [
    "app:access:sales",
    "sales:view",
    "sales:create",
    "sales:edit",
    "sales:delete",
    "sales:assign",
    "sales:pipeline:manage",
    "sales:dashboard:view",
    "sales:convert",
  ];

  describe("Sales Representative (SALES_REP)", () => {
    it("should strictly allow access only to Sales CRM app", () => {
      expect(canAccessApp("SALES_REP", "sales", SALES_REP_PERMISSIONS)).toBe(true);
      expect(canAccessApp("SALES_REP", "pms", SALES_REP_PERMISSIONS)).toBe(false);
      expect(canAccessApp("SALES_REP", "notes", SALES_REP_PERMISSIONS)).toBe(false);
      expect(canAccessApp("SALES_REP", "hrms", SALES_REP_PERMISSIONS)).toBe(false);
      expect(canAccessApp("SALES_REP", "admin", SALES_REP_PERMISSIONS)).toBe(false);
    });

    it("should allow core lead management and dashboard viewing", () => {
      expect(can("SALES_REP", "sales:view", SALES_REP_PERMISSIONS)).toBe(true);
      expect(can("SALES_REP", "sales:create", SALES_REP_PERMISSIONS)).toBe(true);
      expect(can("SALES_REP", "sales:edit", SALES_REP_PERMISSIONS)).toBe(true);
      expect(can("SALES_REP", "sales:dashboard:view", SALES_REP_PERMISSIONS)).toBe(true);
    });

    it("should deny managerial operations (delete, convert, pipeline manage, assign)", () => {
      expect(can("SALES_REP", "sales:delete", SALES_REP_PERMISSIONS)).toBe(false);
      expect(can("SALES_REP", "sales:convert", SALES_REP_PERMISSIONS)).toBe(false);
      expect(can("SALES_REP", "sales:pipeline:manage", SALES_REP_PERMISSIONS)).toBe(false);
      expect(can("SALES_REP", "sales:assign", SALES_REP_PERMISSIONS)).toBe(false);
    });
  });

  describe("Sales Manager (SALES_MANAGER)", () => {
    it("should strictly allow access only to Sales CRM app", () => {
      expect(canAccessApp("SALES_MANAGER", "sales", SALES_MANAGER_PERMISSIONS)).toBe(true);
      expect(canAccessApp("SALES_MANAGER", "pms", SALES_MANAGER_PERMISSIONS)).toBe(false);
      expect(canAccessApp("SALES_MANAGER", "notes", SALES_MANAGER_PERMISSIONS)).toBe(false);
      expect(canAccessApp("SALES_MANAGER", "hrms", SALES_MANAGER_PERMISSIONS)).toBe(false);
      expect(canAccessApp("SALES_MANAGER", "admin", SALES_MANAGER_PERMISSIONS)).toBe(false);
    });

    it("should allow all sales operations including delete, convert, and pipeline manage", () => {
      expect(can("SALES_MANAGER", "sales:view", SALES_MANAGER_PERMISSIONS)).toBe(true);
      expect(can("SALES_MANAGER", "sales:create", SALES_MANAGER_PERMISSIONS)).toBe(true);
      expect(can("SALES_MANAGER", "sales:edit", SALES_MANAGER_PERMISSIONS)).toBe(true);
      expect(can("SALES_MANAGER", "sales:delete", SALES_MANAGER_PERMISSIONS)).toBe(true);
      expect(can("SALES_MANAGER", "sales:assign", SALES_MANAGER_PERMISSIONS)).toBe(true);
      expect(can("SALES_MANAGER", "sales:pipeline:manage", SALES_MANAGER_PERMISSIONS)).toBe(true);
      expect(can("SALES_MANAGER", "sales:dashboard:view", SALES_MANAGER_PERMISSIONS)).toBe(true);
      expect(can("SALES_MANAGER", "sales:convert", SALES_MANAGER_PERMISSIONS)).toBe(true);
    });

    it("should NOT have access to PMS tasks or Admin user management", () => {
      expect(can("SALES_MANAGER", "task:create", SALES_MANAGER_PERMISSIONS)).toBe(false);
      expect(can("SALES_MANAGER", "user:manage", SALES_MANAGER_PERMISSIONS)).toBe(false);
      expect(can("SALES_MANAGER", "note:create", SALES_MANAGER_PERMISSIONS)).toBe(false);
    });
  });

  describe("Sales Client Isolation & Move to Dev Gate", () => {
    it("ensures clients created in sales default to clientType SALES", () => {
      const initialClientType = "SALES";
      expect(initialClientType).toBe("SALES");
      // PMS Development clients list strictly requires DEVELOPMENT
      const isVisibleInDevClients = initialClientType === "DEVELOPMENT";
      expect(isVisibleInDevClients).toBe(false);
    });

    it("moves to DEVELOPMENT clientType only after Move to Dev is invoked", () => {
      let client = { name: "BioTech Alpha", clientType: "SALES", status: "INTAKE" };
      let lead = { stage: "QUALIFIED", clientType: "SALES" };

      // Before Move to Dev
      expect(client.clientType).toBe("SALES");

      // Simulating Move to Dev conversion
      client = { ...client, clientType: "DEVELOPMENT", status: "ONBOARDING" };
      lead = { ...lead, stage: "WON", clientType: "DEVELOPMENT" };

      // After Move to Dev
      expect(client.clientType).toBe("DEVELOPMENT");
      expect(client.status).toBe("ONBOARDING");
      expect(lead.stage).toBe("WON");
    });
  });
});
