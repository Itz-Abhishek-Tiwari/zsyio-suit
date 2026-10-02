import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getAllowedEmailDomains,
  setDynamicAllowedDomains,
  getEmailDomain,
  isEmailDomainAllowed,
  getAllowedDomainsNotice,
  getDomainRestrictionErrorMessage,
} from "@zsyio/auth/domain-restriction";
import { createUserSchema } from "@zsyio/validators";

describe("Domain Restriction Utilities", () => {
  const originalEnv = process.env.ALLOWED_EMAIL_DOMAINS;

  beforeEach(() => {
    process.env.ALLOWED_EMAIL_DOMAINS = "mediloon.de";
  });

  afterEach(() => {
    process.env.ALLOWED_EMAIL_DOMAINS = originalEnv;
  });

  describe("getAllowedEmailDomains", () => {
    it("should return default mediloon.de when env is not set", () => {
      delete process.env.ALLOWED_EMAIL_DOMAINS;
      delete process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS;
      expect(getAllowedEmailDomains()).toEqual(["zsyio.com", "mediloon.de"]);
    });

    it("should parse single domain correctly", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "mediloon.de";
      expect(getAllowedEmailDomains()).toEqual(["mediloon.de"]);
    });

    it("should parse multiple comma-separated domains with whitespace and @ symbols", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = " @mediloon.de , mediloon.com , MEDILOON.ORG ";
      expect(getAllowedEmailDomains()).toEqual(["mediloon.de", "mediloon.com", "mediloon.org"]);
    });

    it("should prioritize dynamic database domains when set", () => {
      setDynamicAllowedDomains(["custom-corp.com", "partner.io"]);
      expect(getAllowedEmailDomains()).toEqual(["custom-corp.com", "partner.io"]);
      expect(isEmailDomainAllowed("test@custom-corp.com")).toBe(true);
      expect(isEmailDomainAllowed("test@mediloon.de")).toBe(false);
      setDynamicAllowedDomains([]); // reset
    });
  });

  describe("getEmailDomain", () => {
    it("should extract domain properly", () => {
      expect(getEmailDomain("admin@mediloon.de")).toBe("mediloon.de");
      expect(getEmailDomain("User.Name+Tag@MEDILOON.DE")).toBe("mediloon.de");
    });

    it("should return null for invalid emails", () => {
      expect(getEmailDomain("")).toBeNull();
      expect(getEmailDomain("invalidemail")).toBeNull();
      expect(getEmailDomain("invalid@")).toBeNull();
      expect(getEmailDomain(null as unknown as string)).toBeNull();
    });
  });

  describe("isEmailDomainAllowed", () => {
    it("should allow valid mediloon.de emails", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "mediloon.de";
      expect(isEmailDomainAllowed("alex@mediloon.de")).toBe(true);
      expect(isEmailDomainAllowed("ALEX.MORGAN@MEDILOON.DE")).toBe(true);
      expect(isEmailDomainAllowed("  user@mediloon.de  ")).toBe(true);
    });

    it("should reject unauthorized email domains", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "mediloon.de";
      expect(isEmailDomainAllowed("attacker@gmail.com")).toBe(false);
      expect(isEmailDomainAllowed("user@yahoo.com")).toBe(false);
      expect(isEmailDomainAllowed("user@fakemediloon.de")).toBe(false);
      expect(isEmailDomainAllowed("user@mediloon.de.evil.com")).toBe(false);
      expect(isEmailDomainAllowed("user@subdomain.mediloon.de")).toBe(false);
      expect(isEmailDomainAllowed("")).toBe(false);
      expect(isEmailDomainAllowed(undefined)).toBe(false);
    });

    it("should support multiple allowed domains", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "mediloon.de, partner.mediloon.com";
      expect(isEmailDomainAllowed("admin@mediloon.de")).toBe(true);
      expect(isEmailDomainAllowed("partner@partner.mediloon.com")).toBe(true);
      expect(isEmailDomainAllowed("hacker@other.com")).toBe(false);
    });
  });

  describe("getAllowedDomainsNotice and Error Messages", () => {
    it("should format notice and error messages correctly", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "mediloon.de";
      expect(getAllowedDomainsNotice()).toBe("@mediloon.de");
      expect(getDomainRestrictionErrorMessage()).toContain("@mediloon.de");
    });
  });

  describe("createUserSchema Validation", () => {
    it("should accept valid input with @mediloon.de email", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "mediloon.de";
      const result = createUserSchema.safeParse({
        name: "Test User",
        email: "test@mediloon.de",
        role: "DEVELOPER",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject input with non-whitelisted email domain", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "mediloon.de";
      const result = createUserSchema.safeParse({
        name: "Test User",
        email: "test@gmail.com",
        role: "DEVELOPER",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("allowed domains");
      }
    });
  });
});
