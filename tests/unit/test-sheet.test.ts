import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_TICKET_TEST_CASES } from "@/lib/test-sheet-defaults";
import { generateGeminiTestCases } from "@/lib/ai/gemini-testcase-helper";
import * as geminiClient from "@/lib/ai/gemini-client";

describe("QA Test Sheet Defaults & AI Generation", () => {
  it("should have standard default test cases configured", () => {
    expect(DEFAULT_TICKET_TEST_CASES.length).toBe(4);
    expect(DEFAULT_TICKET_TEST_CASES[0].title).toContain("Core Acceptance Criteria");
    expect(DEFAULT_TICKET_TEST_CASES[1].title).toContain("Input Validation");
    expect(DEFAULT_TICKET_TEST_CASES[2].title).toContain("UI / UX");
    expect(DEFAULT_TICKET_TEST_CASES[3].title).toContain("Regression");

    // All should have steps and expected result
    DEFAULT_TICKET_TEST_CASES.forEach((tc) => {
      expect(tc.steps).toBeTruthy();
      expect(tc.expectedResult).toBeTruthy();
      expect(typeof tc.order).toBe("number");
    });
  });

  describe("generateGeminiTestCases", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("should return fallback when API key is missing", async () => {
      const result = await generateGeminiTestCases({
        title: "Test Feature",
        apiKey: "",
      });
      expect(result.source).toBe("fallback");
      expect(result.testCases).toEqual([]);
    });

    it("should parse valid Gemini JSON responses into test cases", async () => {
      const mockCases = [
        {
          title: "Verify user login with valid credentials",
          description: "Standard authentication flow",
          steps: "1. Enter email\n2. Enter password\n3. Click Login",
          expectedResult: "User is redirected to dashboard",
        },
        {
          title: "Verify invalid password error",
          steps: "1. Enter email\n2. Enter wrong password\n3. Click Login",
          expectedResult: "Error toast 'Invalid credentials' displayed",
        },
      ];

      vi.spyOn(geminiClient, "callGeminiChat").mockResolvedValue({
        content: JSON.stringify(mockCases),
        model: "gemini-2.5-flash",
      });

      const result = await generateGeminiTestCases({
        title: "User Authentication",
        description: "Login functionality",
        apiKey: "test-gemini-key",
      });

      expect(result.source).toBe("gemini");
      expect(result.testCases.length).toBe(2);
      expect(result.testCases[0].title).toBe("Verify user login with valid credentials");
      expect(result.testCases[1].expectedResult).toContain("Invalid credentials");
    });
  });
});
