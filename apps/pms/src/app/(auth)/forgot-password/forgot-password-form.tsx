"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Label } from "@zsyio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { isEmailDomainAllowed, getAllowedDomainsNotice, getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";

interface ForgotPasswordFormProps {
  serverAllowedDomains?: string[];
  initialEmail?: string;
}

type Step = "REQUEST" | "VERIFY" | "SUCCESS";

export function ForgotPasswordForm({ serverAllowedDomains, initialEmail }: ForgotPasswordFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("REQUEST");

  const allowedDomains = useMemo(
    () => (serverAllowedDomains && serverAllowedDomains.length > 0 ? serverAllowedDomains : getAllowedEmailDomains()),
    [serverAllowedDomains]
  );

  const parsedInitial = useMemo(() => {
    if (!initialEmail) return { username: "", domain: "" };
    const [userPart, ...domainParts] = initialEmail.split("@");
    const domainPart = domainParts.join("@").trim().toLowerCase();
    return {
      username: userPart || "",
      domain: domainPart || "",
    };
  }, [initialEmail]);

  const [emailUsername, setEmailUsername] = useState(parsedInitial.username);
  const [selectedDomain, setSelectedDomain] = useState(
    parsedInitial.domain && allowedDomains.includes(parsedInitial.domain)
      ? parsedInitial.domain
      : allowedDomains[0] || "zsyio.com"
  );

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Timer State (10 minutes = 600s)
  const [timeLeft, setTimeLeft] = useState(600);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    if (parsedInitial.username && !emailUsername) {
      setEmailUsername(parsedInitial.username);
    }
    if (parsedInitial.domain && allowedDomains.includes(parsedInitial.domain)) {
      setSelectedDomain(parsedInitial.domain);
    }
  }, [parsedInitial, allowedDomains, emailUsername]);

  useEffect(() => {
    if (allowedDomains.length > 0 && !allowedDomains.includes(selectedDomain)) {
      setSelectedDomain(allowedDomains[0]);
    }
  }, [allowedDomains, selectedDomain]);

  const cleanUsername = emailUsername.trim().toLowerCase().replace(/^@+|@+$/g, "");
  const fullEmail = cleanUsername ? `${cleanUsername}@${selectedDomain}` : "";

  // 10-Minute Expiry Countdown Effect
  useEffect(() => {
    if (step !== "VERIFY" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    if (step !== "SUCCESS") return;

    if (redirectCountdown <= 0) {
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, redirectCountdown, router]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Request OTP Submission
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!cleanUsername) {
      setError("Please enter your corporate username.");
      return;
    }

    if (!isEmailDomainAllowed(fullEmail)) {
      setError(`Access restricted. Only corporate accounts from (${getAllowedDomainsNotice()}) are authorized.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fullEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.message || "Unable to process password reset request.");
        setLoading(false);
        return;
      }

      setStep("VERIFY");
      setTimeLeft(600); // 10 minutes
      setOtp(["", "", "", "", "", ""]);
      setSuccessMessage(`A 6-digit verification code has been dispatched to ${fullEmail}`);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resending || timeLeft > 540) return; // 1 min debounce
    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fullEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.message || "Failed to resend verification code.");
      } else {
        setTimeLeft(600);
        setSuccessMessage("A fresh verification code has been sent to your inbox.");
      }
    } catch {
      setError("Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...otp];
      updated[index] = "";
      setOtp(updated);
      return;
    }

    if (cleaned.length > 1) {
      const updated = [...otp];
      for (let i = 0; i < 6; i++) {
        if (cleaned[i]) {
          updated[i] = cleaned[i];
        }
      }
      setOtp(updated);
      const nextFocus = Math.min(cleaned.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = cleaned[0];
    setOtp(updated);

    if (index < 5 && cleaned[0]) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP & Reset Password Submission
  async function handleVerifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    const fullOtp = otp.join("");

    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify your new password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fullEmail,
          otp: fullOtp,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.message || "Invalid or expired verification code.");
        setLoading(false);
        return;
      }

      setStep("SUCCESS");
    } catch {
      setError("An unexpected error occurred while resetting password.");
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const strengthColor = ["bg-muted", "bg-red-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"][passwordStrength];
  const strengthLabel = ["Empty", "Weak", "Fair", "Good", "Strong"][passwordStrength];

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 text-center sm:text-left">
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight font-display">
          {step === "REQUEST" && "Forgot Password"}
          {step === "VERIFY" && "Verify Email & Reset"}
          {step === "SUCCESS" && "Password Reset Complete"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {step === "REQUEST" && "Enter your corporate username to receive a 6-digit verification code."}
          {step === "VERIFY" && `Enter the 6-digit code sent to ${fullEmail} and create a new password.`}
          {step === "SUCCESS" && "Your workspace password has been updated securely."}
        </p>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-xs font-medium text-destructive border border-destructive/30 bg-destructive-light flex items-start gap-2.5 shadow-2xs transition-opacity duration-200 ease-out">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {successMessage && step === "VERIFY" && !error && (
        <div className="rounded-xl px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMessage}</span>
        </div>
      )}

      {step === "REQUEST" && (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="corporateEmail" className="text-xs font-bold text-foreground">
                Corporate Email Address
              </Label>
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3 text-primary" />
                <span>Authorized domains</span>
              </span>
            </div>

            <div className="flex items-center rounded-xl border border-border/80 bg-surface-elevated/90 overflow-hidden shadow-2xs transition-colors duration-200 ease-out focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
              <div className="pl-3.5 text-muted-foreground flex items-center pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <Input
                id="corporateEmail"
                type="text"
                value={emailUsername}
                onChange={(e) => {
                  let raw = e.target.value;
                  if (raw.includes("@")) {
                    const [userPart, ...rest] = raw.split("@");
                    const potentialDomain = rest.join("").trim().toLowerCase();
                    raw = userPart;
                    if (potentialDomain && allowedDomains.includes(potentialDomain)) {
                      setSelectedDomain(potentialDomain);
                    }
                  }
                  setEmailUsername(raw.replace(/[@\s]/g, ""));
                }}
                autoComplete="username"
                placeholder="username"
                required
                className="border-0 shadow-none focus-visible:ring-0 rounded-none h-11 text-xs flex-1 bg-transparent px-2.5 font-medium placeholder:text-muted-foreground/60"
              />

              <div className="h-6 w-[1px] bg-border/80 shrink-0" />

              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger
                  aria-label="Select email domain"
                  className="w-[140px] sm:w-[155px] border-0 shadow-none rounded-none bg-surface-subtle/80 hover:bg-surface-subtle text-xs font-mono font-bold text-foreground focus:ring-0 h-11 px-3 cursor-pointer shrink-0 transition-colors duration-200"
                >
                  <SelectValue placeholder={`@${selectedDomain}`} />
                </SelectTrigger>
                <SelectContent align="end">
                  {allowedDomains.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs font-mono font-semibold cursor-pointer">
                      <span className="flex items-center gap-1.5">
                        <span className="text-primary font-bold">@</span>
                        <span>{d}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground font-mono">
              <span>Code will be sent to:</span>
              <span className="font-bold text-foreground truncate max-w-[240px]">
                {cleanUsername ? `${cleanUsername}@${selectedDomain}` : `username@${selectedDomain}`}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full mt-2 font-bold text-xs h-11 rounded-xl shadow-md shadow-primary/20 gap-2 cursor-pointer transition-colors duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Verification Code...</span>
              </>
            ) : (
              <>
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="flex items-center justify-center mt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}

      {step === "VERIFY" && (
        <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border/80 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span className="font-mono font-semibold text-foreground truncate">{fullEmail}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("REQUEST");
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer ml-2"
            >
              Change
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">6-Digit Verification Code</Label>
              <span className="text-[11px] font-mono font-semibold text-muted-foreground flex items-center gap-1">
                <span>Expires in:</span>
                <span className={timeLeft < 120 ? "text-destructive font-bold" : "text-primary font-bold"}>
                  {formatTimer(timeLeft)}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {otp.map((digit, idx) => (
                <Input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  disabled={loading}
                  className="h-12 text-center text-lg font-mono font-extrabold rounded-xl border-border bg-surface-elevated/90 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary p-0"
                />
              ))}
            </div>

            <div className="flex items-center justify-between px-1 text-[11px]">
              <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || timeLeft > 540}
                className="font-bold text-primary hover:underline cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
              >
                {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                <span>Resend Code</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="newPassword" className="text-xs font-bold text-foreground">
                New Password
              </Label>
              <span className="text-[10px] text-muted-foreground">Min. 8 characters</span>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
                required
                className="pl-10 pr-10 text-xs h-11 rounded-xl bg-surface-elevated/90 border-border font-medium placeholder:text-muted-foreground/60 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors duration-200 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {newPassword && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Strength:</span>
                  <span className="font-bold text-foreground">{strengthLabel}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                  <div className={passwordStrength >= 1 ? strengthColor : "bg-transparent"} />
                  <div className={passwordStrength >= 2 ? strengthColor : "bg-transparent"} />
                  <div className={passwordStrength >= 3 ? strengthColor : "bg-transparent"} />
                  <div className={passwordStrength >= 4 ? strengthColor : "bg-transparent"} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-bold text-foreground">
              Confirm New Password
            </Label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
                required
                className="pl-10 pr-10 text-xs h-11 rounded-xl bg-surface-elevated/90 border-border font-medium placeholder:text-muted-foreground/60 shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-colors duration-200"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full mt-2 font-bold text-xs h-11 rounded-xl shadow-md shadow-primary/20 gap-2 cursor-pointer transition-colors duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying &amp; Resetting Password...</span>
              </>
            ) : (
              <>
                <span>Confirm &amp; Reset Password</span>
                <ShieldCheck className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="flex items-center justify-center mt-2">
            <button
              type="button"
              onClick={() => {
                setStep("REQUEST");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Email Entry</span>
            </button>
          </div>
        </form>
      )}

      {step === "SUCCESS" && (
        <div className="flex flex-col items-center gap-5 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2 max-w-sm">
            <h3 className="text-xl font-extrabold text-foreground tracking-tight font-display">
              Password Reset Complete!
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your password has been securely updated. You can now use your new credentials to sign in to Zsyio Workspace.
            </p>
          </div>

          <div className="w-full p-3 rounded-xl bg-surface-subtle border border-border/80 text-xs font-mono text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Redirecting to Sign In in {redirectCountdown}s...</span>
          </div>

          <Button
            onClick={() => router.push("/login")}
            size="lg"
            className="w-full font-bold text-xs h-11 rounded-xl shadow-md shadow-primary/20 gap-2 cursor-pointer transition-colors duration-200"
          >
            <span>Sign In to Workspace Now</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
