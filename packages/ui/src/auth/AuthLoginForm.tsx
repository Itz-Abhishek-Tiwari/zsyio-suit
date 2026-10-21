"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { CorporateEmailField } from "./CorporateEmailField";

export interface AuthLoginFormProps {
  /**
   * Controls the email input style:
   * - `"plain"` — standard `<input type="email">` (e.g. Sales, HRMS)
   * - `"corporate"` — username + domain-picker via CorporateEmailField (e.g. PMS, Admin, Notes)
   * @default "plain"
   */
  emailMode?: "plain" | "corporate";

  /**
   * Allowed domain list for the corporate domain picker.
   * Falls back to `["zsyio.com"]` when empty / not provided.
   */
  allowedDomains?: string[];

  /** Label on the submit button when idle. */
  submitLabel: string;

  /** Label on the submit button while submitting. @default "Signing in…" */
  loadingLabel?: string;

  /**
   * Base path for the "Forgot password?" link (corporate mode only).
   * The form appends `?email=<encoded>` when a username is typed.
   * Omit to hide the link entirely.
   */
  forgotPasswordBase?: string;

  /**
   * Async handler that receives the fully-resolved email and password.
   * Return `{ error: string }` to surface an inline validation error.
   * Return `undefined` / `void` on success — the form then navigates to
   * `window.location.search.callbackUrl` or `/`.
   */
  onSignIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string } | undefined | null | void>;
}

/**
 * Shared, headless-auth login form used by every Zsyio app.
 *
 * Renders email + password fields, an error banner, and a submit button.
 * All auth side-effects (signIn, domain validation) are delegated to the
 * per-app `onSignIn` callback so this component has zero auth dependencies.
 */
export function AuthLoginForm({
  emailMode = "plain",
  allowedDomains: allowedDomainsProp,
  submitLabel,
  loadingLabel = "Signing in…",
  forgotPasswordBase,
  onSignIn,
}: AuthLoginFormProps) {
  const allowedDomains = useMemo(
    () =>
      allowedDomainsProp && allowedDomainsProp.length > 0
        ? allowedDomainsProp
        : ["zsyio.com", "zsyio.de"],
    [allowedDomainsProp]
  );

  // Corporate mode state
  const [emailUsername, setEmailUsername] = useState("");
  const [selectedDomain, setSelectedDomain] = useState(
    allowedDomains[0] ?? "zsyio.com"
  );

  // Plain mode state
  const [plainEmail, setPlainEmail] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Keep selectedDomain in sync if allowedDomains changes
  useEffect(() => {
    if (
      emailMode === "corporate" &&
      allowedDomains.length > 0 &&
      !allowedDomains.includes(selectedDomain)
    ) {
      setSelectedDomain(allowedDomains[0]);
    }
  }, [allowedDomains, emailMode, selectedDomain]);

  const cleanUsername = emailUsername
    .trim()
    .toLowerCase()
    .replace(/^@+|@+$/g, "");

  const resolvedEmail =
    emailMode === "corporate"
      ? cleanUsername
        ? `${cleanUsername}@${selectedDomain}`
        : ""
      : plainEmail.trim().toLowerCase();

  const forgotHref = forgotPasswordBase
    ? emailMode === "corporate" && cleanUsername
      ? `${forgotPasswordBase}?email=${encodeURIComponent(
          `${cleanUsername}@${selectedDomain}`
        )}`
      : forgotPasswordBase
    : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (emailMode === "corporate" && !cleanUsername) {
      setError("Please enter your corporate username.");
      return;
    }
    if (emailMode === "plain" && !plainEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onSignIn(resolvedEmail, password);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Hard navigation flushes the server cookie and clears stale router cache
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const callbackUrl = params?.get("callbackUrl");
      const target =
        callbackUrl &&
        callbackUrl.startsWith("/") &&
        !callbackUrl.startsWith("//")
          ? callbackUrl
          : "/";
      window.location.href = target;
    } catch {
      setError(
        "An unexpected authentication error occurred. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl px-4 py-3 text-xs font-medium text-destructive border border-destructive/30 bg-destructive/5 flex items-start gap-2.5 shadow-2xs transition-opacity duration-200 ease-out"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email / Username field */}
        {emailMode === "corporate" ? (
          <CorporateEmailField
            emailUsername={emailUsername}
            onEmailUsernameChange={setEmailUsername}
            selectedDomain={selectedDomain}
            onSelectedDomainChange={setSelectedDomain}
            allowedDomains={allowedDomains}
            previewLabel="Signing in as:"
            disabled={loading}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="auth-email"
              className="text-xs font-semibold text-foreground"
            >
              Work Email
            </Label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="auth-email"
                type="email"
                value={plainEmail}
                onChange={(e) => setPlainEmail(e.target.value)}
                placeholder="user@zsyio.com"
                autoComplete="email"
                required
                disabled={loading}
                className="pl-10 text-xs h-11 rounded-xl bg-surface-elevated/90 border-border font-medium placeholder:text-muted-foreground/60 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors duration-200"
              />
            </div>
          </div>
        )}

        {/* Password field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="auth-password"
              className="text-xs font-semibold text-foreground"
            >
              Password
            </Label>
            {forgotHref && (
              <Link
                href={forgotHref}
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors duration-200 cursor-pointer"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••••••"
              required
              disabled={loading}
              className="pl-10 pr-10 text-xs h-11 rounded-xl bg-surface-elevated/90 border-border font-medium placeholder:text-muted-foreground/60 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors duration-200 cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full mt-2 font-semibold text-xs h-11 rounded-xl shadow-md  gap-2 cursor-pointer transition-colors duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{loadingLabel}</span>
            </>
          ) : (
            <>
              <span>{submitLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
