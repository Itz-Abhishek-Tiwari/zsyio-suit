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
    process.env.ALLOWED_EMAIL_DOMAINS = "zsyio.de";
  });

  afterEach(() => {
    process.env.ALLOWED_EMAIL_DOMAINS = originalEnv;
  });

  describe("getAllowedEmailDomains", () => {
    it("should return default zsyio.de when env is not set", () => {
      delete process.env.ALLOWED_EMAIL_DOMAINS;
      delete process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS;
      expect(getAllowedEmailDomains()).toEqual(["zsyio.com", "zsyio.de"]);
    });

    it("should parse single domain correctly", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "zsyio.de";
      expect(getAllowedEmailDomains()).toEqual(["zsyio.de"]);
    });

    it("should parse multiple comma-separated domains with whitespace and @ symbols", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = " @zsyio.de , zsyio.com , ZSYIO.ORG ";
      expect(getAllowedEmailDomains()).toEqual(["zsyio.de", "zsyio.com", "zsyio.org"]);
    });

    it("should prioritize dynamic database domains when set", () => {
      setDynamicAllowedDomains(["custom-corp.com", "partner.io"]);
      expect(getAllowedEmailDomains()).toEqual(["custom-corp.com", "partner.io"]);
      expect(isEmailDomainAllowed("test@custom-corp.com")).toBe(true);
      expect(isEmailDomainAllowed("test@zsyio.de")).toBe(false);
      setDynamicAllowedDomains([]); // reset
    });
  });

  describe("getEmailDomain", () => {
    it("should extract domain properly", () => {
      expect(getEmailDomain("admin@zsyio.de")).toBe("zsyio.de");
      expect(getEmailDomain("User.Name+Tag@ZSYIO.DE")).toBe("zsyio.de");
    });

    it("should return null for invalid emails", () => {
      expect(getEmailDomain("")).toBeNull();
      expect(getEmailDomain("invalidemail")).toBeNull();
      expect(getEmailDomain("invalid@")).toBeNull();
      expect(getEmailDomain(null as unknown as string)).toBeNull();
    });
  });

  describe("isEmailDomainAllowed", () => {
    it("should allow valid zsyio.de emails", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "zsyio.de";
      expect(isEmailDomainAllowed("alex@zsyio.de")).toBe(true);
      expect(isEmailDomainAllowed("ALEX.MORGAN@ZSYIO.DE")).toBe(true);
      expect(isEmailDomainAllowed("  user@zsyio.de  ")).toBe(true);
    });

    it("should reject unauthorized email domains", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "zsyio.de";
      expect(isEmailDomainAllowed("attacker@gmail.com")).toBe(false);
      expect(isEmailDomainAllowed("user@yahoo.com")).toBe(false);
      expect(isEmailDomainAllowed("user@fakezsyio.de")).toBe(false);
      expect(isEmailDomainAllowed("user@zsyio.de.evil.com")).toBe(false);
      expect(isEmailDomainAllowed("user@subdomain.zsyio.de")).toBe(false);
      expect(isEmailDomainAllowed("")).toBe(false);
      expect(isEmailDomainAllowed(undefined)).toBe(false);
    });

    it("should support multiple allowed domains", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "zsyio.de, partner.zsyio.com";
      expect(isEmailDomainAllowed("admin@zsyio.de")).toBe(true);
      expect(isEmailDomainAllowed("partner@partner.zsyio.com")).toBe(true);
      expect(isEmailDomainAllowed("hacker@other.com")).toBe(false);
    });
  });

  describe("getAllowedDomainsNotice and Error Messages", () => {
    it("should format notice and error messages correctly", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "zsyio.de";
      expect(getAllowedDomainsNotice()).toBe("@zsyio.de");
      expect(getDomainRestrictionErrorMessage()).toContain("@zsyio.de");
    });
  });

  describe("createUserSchema Validation", () => {
    it("should accept valid input with @zsyio.de email", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "zsyio.de";
      const result = createUserSchema.safeParse({
        name: "Test User",
        email: "test@zsyio.de",
        role: "DEVELOPER",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject input with non-whitelisted email domain", () => {
      process.env.ALLOWED_EMAIL_DOMAINS = "zsyio.de";
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
