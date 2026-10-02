import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sanitizeKebabSlug,
  generateGeminiBranchSlug,
  generateOpenAiBranchSlug,
} from "@/lib/ai/gemini-branch-helper";
import * as geminiClient from "@/lib/ai/gemini-client";
import { generateGitBranchSuggestion } from "@/lib/git-branch-helper";

describe("gemini-branch-helper", () => {
  describe("sanitizeKebabSlug", () => {
    it("cleans quotes, markdown formatting, and punctuation while stripping redundant prefixes", () => {
      expect(sanitizeKebabSlug('"fix-auth-login"')).toBe("auth-login");
      expect(sanitizeKebabSlug("`user-avatar-upload`")).toBe("user-avatar-upload");
      expect(sanitizeKebabSlug("Feature: Add Dark Mode!")).toBe("add-dark-mode");
      expect(sanitizeKebabSlug("---clean--slug---")).toBe("clean-slug");
    });

    it("limits word count without trailing hyphens", () => {
      const longSlug = "extremely-long-gemini-output-with-way-too-many-words-in-slug";
      const cleaned = sanitizeKebabSlug(longSlug, 3);
      expect(cleaned.split("-").length).toBeLessThanOrEqual(3);
      expect(cleaned.endsWith("-")).toBe(false);
    });

    it("returns empty string on empty input", () => {
      expect(sanitizeKebabSlug("")).toBe("");
    });
  });

  describe("generateGeminiBranchSlug", () => {
    const originalApiKey = process.env.GEMINI_API_KEY;

    beforeEach(() => {
      delete process.env.GEMINI_API_KEY;
    });

    afterEach(() => {
      process.env.GEMINI_API_KEY = originalApiKey;
      vi.restoreAllMocks();
    });

    it("gracefully falls back to algorithmic slug when API key is missing (0 tokens)", async () => {
      const result = await generateGeminiBranchSlug({
        title: "Fix broken pagination on task table in safari",
        apiKey: "",
      });

      expect(result.source).toBe("fallback");
      expect(result.slug).toBe("broken-pagination-task-table-safari");
    });

    it("calls Gemini API and parses response into clean kebab slug", async () => {
      vi.spyOn(geminiClient, "callGeminiChat").mockResolvedValue({
        content: "safari-pagination-fix",
        model: "gemini-2.5-flash",
        usage: { inputTokens: 28, outputTokens: 6 },
      });

      const result = await generateGeminiBranchSlug({
        title: "Fix broken pagination on task table in safari",
        apiKey: "test-gemini-key",
      });

      expect(result.source).toBe("gemini");
      expect(result.slug).toBe("safari-pagination");
      expect(result.usage?.inputTokens).toBe(28);
      expect(result.usage?.outputTokens).toBe(6);
    });

    it("falls back to local slugifier if Gemini API errors or returns null", async () => {
      vi.spyOn(geminiClient, "callGeminiChat").mockResolvedValue(null);

      const result = await generateGeminiBranchSlug({
        title: "Database connection timeout retry logic",
        apiKey: "test-gemini-key",
      });

      expect(result.source).toBe("fallback");
      expect(result.slug).toBe("database-connection-timeout-retry-logic");
    });

    it("supports backward-compatible alias generateOpenAiBranchSlug", async () => {
      const result = await generateOpenAiBranchSlug({
        title: "User settings preferences modal",
        apiKey: "",
      });

      expect(result.source).toBe("fallback");
      expect(result.slug).toBe("user-settings-preferences-modal");
    });
  });

  describe("generateGitBranchSuggestion with slugOverride", () => {
    it("uses AI slug override instead of raw title", () => {
      const result = generateGitBranchSuggestion({
        id: "TSK-6789",
        title: "Very very long task title with extensive description that should not be in branch name",
        type: "BUG",
        slugOverride: "auth-token-refresh",
      });

      expect(result.shortId).toBe("TSK-6789");
      expect(result.branchName).toBe("fix/tsk-6789-auth-token-refresh");
      expect(result.checkoutCmd).toBe("git checkout -b fix/tsk-6789-auth-token-refresh");
    });
  });
});
