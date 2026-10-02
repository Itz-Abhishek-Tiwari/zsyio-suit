import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "@zsyio/auth/password";

describe("Password Change Logic", () => {
  it("should validate hashing and comparison correctly", async () => {
    const hash = await hashPassword("password", 6);
    expect(await comparePassword("password", hash)).toBe(true);
    expect(await comparePassword("wrongpass", hash)).toBe(false);

    const newHash = await hashPassword("NewPassword123", 6);
    expect(await comparePassword("NewPassword123", newHash)).toBe(true);
  });
});
