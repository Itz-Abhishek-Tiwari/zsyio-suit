import { describe, it, expect } from "vitest";
import { updateThemeSchema, updateUserSchema, themeEnum } from "@zsyio/validators";
import { setCachedUserAuth, getCachedUserAuth, invalidateUserAuth } from "@zsyio/auth/auth-cache";

describe("Theme Synchronization & Schema Validation", () => {
  describe("themeEnum & updateThemeSchema", () => {
    it("should accept valid theme values (light, dark, system)", () => {
      expect(updateThemeSchema.parse({ theme: "light" })).toEqual({ theme: "light" });
      expect(updateThemeSchema.parse({ theme: "dark" })).toEqual({ theme: "dark" });
      expect(updateThemeSchema.parse({ theme: "system" })).toEqual({ theme: "system" });
    });

    it("should reject invalid theme values", () => {
      expect(() => updateThemeSchema.parse({ theme: "neon-blue" })).toThrow();
      expect(() => updateThemeSchema.parse({ theme: "" })).toThrow();
      expect(() => updateThemeSchema.parse({})).toThrow();
    });

    it("should allow optional theme in updateUserSchema", () => {
      const parsedWithTheme = updateUserSchema.parse({ name: "Alice", theme: "dark" });
      expect(parsedWithTheme.theme).toBe("dark");

      const parsedWithoutTheme = updateUserSchema.parse({ name: "Alice" });
      expect(parsedWithoutTheme.theme).toBeUndefined();
    });
  });

  describe("CachedAuthUser theme persistence", () => {
    it("should store and retrieve theme in in-memory auth cache", () => {
      const userId = "cache-test-user-1";
      invalidateUserAuth(userId);

      setCachedUserAuth({
        id: userId,
        name: "Cache User",
        email: "cache@zsyio.de",
        role: "DEVELOPER",
        customRoleId: null,
        permissions: [],
        active: true,
        theme: "dark",
      });

      const cached = getCachedUserAuth(userId);
      expect(cached).not.toBeNull();
      expect(cached?.theme).toBe("dark");

      // Test updating the cached theme
      setCachedUserAuth({
        ...cached!,
        theme: "light",
      });

      const updated = getCachedUserAuth(userId);
      expect(updated?.theme).toBe("light");

      invalidateUserAuth(userId);
      expect(getCachedUserAuth(userId)).toBeNull();
    });
  });
});
