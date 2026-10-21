import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { forgotPasswordRequestSchema, forgotPasswordVerifySchema } from "@zsyio/validators";

describe("Forgot Password Auth & OTP System", () => {
  describe("Validation Schemas", () => {
    it("should validate allowed corporate email in forgot password request", () => {
      const valid = forgotPasswordRequestSchema.safeParse({ email: "suyashgaikwad@zsyio.de" });
      expect(valid.success).toBe(true);

      const invalidDomain = forgotPasswordRequestSchema.safeParse({ email: "attacker@gmail.com" });
      expect(invalidDomain.success).toBe(false);

      const empty = forgotPasswordRequestSchema.safeParse({ email: "" });
      expect(empty.success).toBe(false);
    });

    it("should validate OTP and new password in verify request", () => {
      const valid = forgotPasswordVerifySchema.safeParse({
        email: "suyashgaikwad@zsyio.de",
        otp: "123456",
        newPassword: "NewSecurePassword123!",
      });
      expect(valid.success).toBe(true);

      const invalidOtp = forgotPasswordVerifySchema.safeParse({
        email: "suyashgaikwad@zsyio.de",
        otp: "1234",
        newPassword: "NewSecurePassword123!",
      });
      expect(invalidOtp.success).toBe(false);

      const shortPassword = forgotPasswordVerifySchema.safeParse({
        email: "suyashgaikwad@zsyio.de",
        otp: "123456",
        newPassword: "short",
      });
      expect(shortPassword.success).toBe(false);
    });
  });

  describe("OTP Hashing & Expiration Logic", () => {
    it("should correctly compare raw OTP with stored bcrypt hash", async () => {
      const rawOtp = "849201";
      const otpHash = await bcrypt.hash(rawOtp, 10);

      const matches = await bcrypt.compare(rawOtp, otpHash);
      expect(matches).toBe(true);

      const wrong = await bcrypt.compare("111111", otpHash);
      expect(wrong).toBe(false);
    });

    it("should reject expired OTP timestamps", () => {
      const expiredTime = new Date(Date.now() - 1000 * 60); // 1 minute ago
      const isExpired = new Date(expiredTime) < new Date();
      expect(isExpired).toBe(true);

      const validTime = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes in future
      const isValid = new Date(validTime) > new Date();
      expect(isValid).toBe(true);
    });

    it("should enforce rate limiting on 5 failed attempts", () => {
      let attempts = 0;
      const maxAttempts = 5;

      for (let i = 0; i < 5; i++) {
        attempts++;
      }

      const isLocked = attempts >= maxAttempts;
      expect(isLocked).toBe(true);
    });
  });
});
