"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mail, KeyRound, Lock, Loader2, RotateCw, ArrowRight, ShieldCheck } from "lucide-react";
import { Input } from "../components/input";
import { PasswordField } from "./PasswordField";
import { toast } from "sonner";

interface OtpPasswordResetFormProps {
  /** Mirrors the parent modal's open state so the flow resets each time it's reopened. */
  open: boolean;
  userEmail: string;
  onSuccess: () => void;
}

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 600;
/** Resend is allowed once the countdown has dropped below this many seconds left. */
const RESEND_UNLOCK_AT_SECONDS = 60;

function formatTimer(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Email-OTP password reset flow, extracted out of ChangePasswordModal so
 * that component isn't juggling two independent auth flows (this one, and
 * the direct current-password change) in a single 600+ line file.
 */
export function OtpPasswordResetForm({ open, userEmail, onSuccess }: OtpPasswordResetFormProps) {
  const [otpStep, setOtpStep] = useState<"READY" | "SENT">("READY");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(OTP_TTL_SECONDS);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset all local state whenever the parent modal is (re)opened.
  useEffect(() => {
    if (!open) return;
    setOtpStep("READY");
    setOtpLoading(false);
    setOtpResending(false);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setNewPassword("");
    setConfirmPassword("");
    setOtpTimeLeft(OTP_TTL_SECONDS);
    setServerError(null);
    setShowNew(false);
    setShowConfirm(false);
  }, [open]);

  // Countdown timer for the OTP's validity window. Depends only on `otpStep`
  // — the zero-floor guard lives inside the interval callback instead of the
  // effect's dependency array, so the interval isn't torn down and rebuilt
  // every single tick (it was previously also depending on `otpTimeLeft`,
  // which changes every second).
  useEffect(() => {
    if (otpStep !== "SENT") return;
    const timer = setInterval(() => {
      setOtpTimeLeft((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpStep]);

  const handleSendOtp = async () => {
    if (!userEmail) {
      setServerError("User email not found. Please log in again.");
      return;
    }
    setOtpLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data?.error?.message || data?.message || "Failed to send OTP.");
        return;
      }
      setOtpStep("SENT");
      setOtpTimeLeft(OTP_TTL_SECONDS);
      toast.success("Verification code sent to your email!");
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch {
      setServerError("Failed to send OTP code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResending || otpTimeLeft > OTP_TTL_SECONDS - RESEND_UNLOCK_AT_SECONDS) return;
    setOtpResending(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        setOtpTimeLeft(OTP_TTL_SECONDS);
        toast.success("New verification code sent!");
      }
    } catch {
      toast.error("Failed to resend code.");
    } finally {
      setOtpResending(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const copy = [...otpDigits];
      copy[index] = "";
      setOtpDigits(copy);
      return;
    }
    if (clean.length > 1) {
      const copy = [...otpDigits];
      for (let i = 0; i < OTP_LENGTH; i++) {
        if (clean[i]) copy[i] = clean[i];
      }
      setOtpDigits(copy);
      const nextIdx = Math.min(clean.length, OTP_LENGTH - 1);
      otpRefs.current[nextIdx]?.focus();
      return;
    }
    const copy = [...otpDigits];
    copy[index] = clean[0];
    setOtpDigits(copy);
    if (index < OTP_LENGTH - 1 && clean[0]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== OTP_LENGTH) {
      setServerError(`Please enter the complete ${OTP_LENGTH}-digit OTP code.`);
      return;
    }
    if (newPassword.length < 8) {
      setServerError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setServerError("Passwords do not match.");
      return;
    }

    setOtpLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          otp: code,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data?.error?.message || data?.message || "Invalid or expired OTP code.");
        return;
      }

      toast.success("Password reset successfully!");
      onSuccess();
    } catch {
      setServerError("An error occurred during password reset.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (otpStep === "READY") {
    return (
      <div className="flex flex-col gap-3 py-2">
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground">Registered Email</span>
            <span className="text-[11px] font-mono text-muted-foreground truncate">{userEmail}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Click below to receive a 6-digit one-time verification code in your corporate inbox to reset your password.
        </p>

        {serverError && (
          <p className="text-xs text-destructive font-medium bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2">
            {serverError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={otpLoading}
          className="w-full h-10 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {otpLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Code...</span>
            </>
          ) : (
            <>
              <span>Send 6-Digit Verification Code</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-bold text-foreground">Enter 6-Digit OTP</span>
        <span className="text-[11px] font-mono font-semibold text-primary">
          Expires: {formatTimer(otpTimeLeft)}
        </span>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {otpDigits.map((digit, idx) => (
          <Input
            key={idx}
            ref={(el) => {
              otpRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
            className="h-11 text-center text-base font-mono font-bold rounded-xl border-border bg-surface-subtle p-0"
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] px-0.5">
        <span className="text-muted-foreground">Didn&apos;t receive code?</span>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={otpResending || otpTimeLeft > OTP_TTL_SECONDS - RESEND_UNLOCK_AT_SECONDS}
          className="font-bold text-primary hover:underline cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
        >
          {otpResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
          <span>Resend</span>
        </button>
      </div>

      <PasswordField
        id="otp-new-pass"
        label="New Password"
        icon={<KeyRound className="w-3.5 h-3.5" />}
        show={showNew}
        onToggle={() => setShowNew((p) => !p)}
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="••••••••••••"
        required
      />

      <PasswordField
        id="otp-confirm-pass"
        label="Confirm New Password"
        icon={<Lock className="w-3.5 h-3.5" />}
        show={showConfirm}
        onToggle={() => setShowConfirm((p) => !p)}
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••••••"
        required
      />

      {serverError && (
        <p className="text-xs text-destructive font-medium bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={otpLoading}
        className="w-full h-10 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
      >
        {otpLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying &amp; Resetting...</span>
          </>
        ) : (
          <>
            <span>Reset Password</span>
            <ShieldCheck className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
