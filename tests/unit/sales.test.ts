import { describe, it, expect } from "vitest";
import {
  createSalesLeadSchema,
  updateSalesLeadSchema,
  moveSalesLeadSchema,
  createSalesActivitySchema,
} from "@zsyio/validators";
import { createClientSchema } from "@zsyio/validators";
import { can, type Role } from "@zsyio/auth/permissions";
import { SALES_STAGE_FLOW, SALES_STAGE_LABELS } from "@zsyio/types";

describe("Sales Validators", () => {
  describe("ClientType in createClientSchema", () => {
    it("accepts valid clientType = SALES", () => {
      const result = createClientSchema.safeParse({
        name: "Acme Corp",
        clientType: "SALES",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientType).toBe("SALES");
      }
    });

    it("accepts valid clientType = DEVELOPMENT", () => {
      const result = createClientSchema.safeParse({
        name: "Beta Inc",
        clientType: "DEVELOPMENT",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientType).toBe("DEVELOPMENT");
      }
    });

    it("defaults or allows optional clientType", () => {
      const result = createClientSchema.safeParse({
        name: "Default Co",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid clientType string", () => {
      const result = createClientSchema.safeParse({
        name: "Bad Type Corp",
        clientType: "INVALID_TYPE",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createSalesLeadSchema", () => {
    it("validates valid lead creation with client info", () => {
      const result = createSalesLeadSchema.safeParse({
        clientName: "Enterprise Global",
        currentStage: "NEW_LEAD",
        priority: "HIGH",
        dealValue: 50000,
      });
      expect(result.success).toBe(true);
    });

    it("validates lead creation with all optional fields", () => {
      const result = createSalesLeadSchema.safeParse({
        clientName: "New Enterprise",
        contactName: "John Doe",
        contactEmail: "john@enterprise.com",
        contactPhone: "+1234567890",
        currentStage: "QUALIFIED",
        dealValue: 120000,
        priority: "CRITICAL",
        leadSource: "Referral",
      });
      expect(result.success).toBe(true);
    });

    it("rejects when clientName is missing or empty", () => {
      const result = createSalesLeadSchema.safeParse({
        clientName: "",
        dealValue: 50000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("moveSalesLeadSchema", () => {
    it("accepts valid stage transition", () => {
      const result = moveSalesLeadSchema.safeParse({
        stageKey: "PROPOSAL_SENT",
      });
      expect(result.success).toBe(true);
    });

    it("accepts LOST stage with reason", () => {
      const result = moveSalesLeadSchema.safeParse({
        stageKey: "LOST",
        reason: "Budget constraints",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid stage key", () => {
      const result = moveSalesLeadSchema.safeParse({
        stageKey: "NON_EXISTENT_STAGE",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createSalesActivitySchema", () => {
    it("validates valid activity", () => {
      const result = createSalesActivitySchema.safeParse({
        leadId: "lead_abc123",
        type: "CALL",
        title: "Introductory Discovery Call",
        description: "Discussed requirements and scope",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing title", () => {
      const result = createSalesActivitySchema.safeParse({
        leadId: "lead_abc123",
        type: "MEETING",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing leadId", () => {
      const result = createSalesActivitySchema.safeParse({
        type: "MEETING",
        title: "Team Sync",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Sales Permissions Matrix", () => {
  const admin: Role = "ADMIN";
  const manager: Role = "MANAGER";
  const dev: Role = "DEVELOPER";
  const support: Role = "SUPPORT";

  it("ADMIN has all sales permissions", () => {
    expect(can(admin, "sales:view")).toBe(true);
    expect(can(admin, "sales:create")).toBe(true);
    expect(can(admin, "sales:edit")).toBe(true);
    expect(can(admin, "sales:delete")).toBe(true);
    expect(can(admin, "sales:assign")).toBe(true);
    expect(can(admin, "sales:pipeline:manage")).toBe(true);
    expect(can(admin, "sales:dashboard:view")).toBe(true);
    expect(can(admin, "sales:convert")).toBe(true);
    expect(can(admin, "app:access:sales")).toBe(true);
  });

  it("MANAGER has operational sales permissions but NOT sales:delete", () => {
    expect(can(manager, "sales:view")).toBe(true);
    expect(can(manager, "sales:create")).toBe(true);
    expect(can(manager, "sales:edit")).toBe(true);
    expect(can(manager, "sales:delete")).toBe(false);
    expect(can(manager, "sales:assign")).toBe(true);
    expect(can(manager, "sales:convert")).toBe(true);
    expect(can(manager, "app:access:sales")).toBe(true);
  });

  it("DEVELOPER and SUPPORT cannot access sales CRM by default", () => {
    expect(can(dev, "sales:view")).toBe(false);
    expect(can(dev, "sales:create")).toBe(false);
    expect(can(dev, "app:access:sales")).toBe(false);

    expect(can(support, "sales:view")).toBe(false);
    expect(can(support, "sales:create")).toBe(false);
    expect(can(support, "app:access:sales")).toBe(false);
  });
});

describe("Sales Pipeline Constants", () => {
  it("defines the 7 required stages in chronological sequence", () => {
    expect(SALES_STAGE_FLOW).toEqual([
      "NEW_LEAD",
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL_SENT",
      "NEGOTIATION",
      "WON",
      "LOST",
    ]);
  });

  it("has human-readable labels for all 7 stages", () => {
    for (const stage of SALES_STAGE_FLOW) {
      expect(SALES_STAGE_LABELS[stage]).toBeDefined();
      expect(typeof SALES_STAGE_LABELS[stage]).toBe("string");
    }
  });
});
