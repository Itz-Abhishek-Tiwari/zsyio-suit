import { describe, it, expect } from "vitest";
import {
  slugifyTitle,
  getDefaultBranchPrefix,
  generateGitBranchSuggestion,
} from "@/lib/git-branch-helper";

describe("git-branch-helper", () => {
  describe("slugifyTitle", () => {
    it("converts basic title to lowercase slug stripping redundant action prefixes", () => {
      expect(slugifyTitle("Add Google OAuth Login")).toBe("google-oauth-login");
    });

    it("strips special characters, filler words, and excess whitespace", () => {
      expect(slugifyTitle("Fix: User profile photo upload (urgent!)")).toBe("user-profile-photo-upload-urgent");
    });

    it("handles empty or whitespace strings", () => {
      expect(slugifyTitle("")).toBe("task");
      expect(slugifyTitle("   ")).toBe("task");
    });

    it("limits word count without trailing hyphens", () => {
      const longTitle = "This is a very very long ticket title that exceeds the maximum length allowed for git branch names";
      const slug = slugifyTitle(longTitle, 3);
      expect(slug.split("-").length).toBeLessThanOrEqual(3);
      expect(slug.endsWith("-")).toBe(false);
    });

    it("captures full technical terms and tools across complex titles", () => {
      const complexTitle = "Automate client SDK generation from Fastify OpenAPI schema using Orval / openapi-generator.";
      const slug = slugifyTitle(complexTitle);
      expect(slug).toBe("client-sdk-generation-fastify-openapi-schema-orval");
    });
  });

  describe("getDefaultBranchPrefix", () => {
    it("maps standard task types correctly", () => {
      expect(getDefaultBranchPrefix("BUG")).toBe("fix");
      expect(getDefaultBranchPrefix("FEATURE")).toBe("feature");
      expect(getDefaultBranchPrefix("SUPPORT_REQUEST")).toBe("support");
      expect(getDefaultBranchPrefix("CUSTOMIZATION")).toBe("feature");
      expect(getDefaultBranchPrefix("DEPLOYMENT")).toBe("release");
      expect(getDefaultBranchPrefix("MAINTENANCE")).toBe("chore");
      expect(getDefaultBranchPrefix("NEW_DESIGN")).toBe("design");
      expect(getDefaultBranchPrefix("DESIGN_CHANGE")).toBe("design");
      expect(getDefaultBranchPrefix("DESIGN_CHANGES")).toBe("design");
    });

    it("defaults to feature for null or unknown types", () => {
      expect(getDefaultBranchPrefix(null)).toBe("feature");
      expect(getDefaultBranchPrefix(undefined)).toBe("feature");
      expect(getDefaultBranchPrefix("CUSTOM_TYPE")).toBe("customtype");
    });
  });

  describe("generateGitBranchSuggestion", () => {
    it("generates full branch name and git commands", () => {
      const result = generateGitBranchSuggestion({
        id: "TSK-101",
        title: "Implement password reset flow",
        type: "FEATURE",
      });

      expect(result.shortId).toBe("TSK-101");
      expect(result.branchName).toBe("feature/tsk-101-password-reset-flow");
      expect(result.checkoutCmd).toBe("git checkout -b feature/tsk-101-password-reset-flow");
      expect(result.switchCmd).toBe("git switch -c feature/tsk-101-password-reset-flow");
      expect(result.pushCmd).toBe("git push -u origin feature/tsk-101-password-reset-flow");
      expect(result.commitMsg).toContain("feat(TSK-101): Implement password reset flow");
    });

    it("respects prefixOverride", () => {
      const result = generateGitBranchSuggestion({
        id: "TSK-202",
        title: "Fix crash on reload",
        type: "FEATURE",
        prefixOverride: "hotfix",
      });

      expect(result.shortId).toBe("TSK-202");
      expect(result.branchName).toBe("hotfix/tsk-202-crash-reload");
      expect(result.checkoutCmd).toBe("git checkout -b hotfix/tsk-202-crash-reload");
    });
  });
});
