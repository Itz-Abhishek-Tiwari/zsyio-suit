"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Label } from "@zsyio/ui";
import { ThemeToggle } from "@zsyio/ui";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ConfirmDialog } from "@zsyio/ui";

interface InviteData {
  id: string;
  name: string;
  email: string;
  role: string;
  customRole?: {
    name: string;
    label: string;
    color?: string | null;
  } | null;
  invitationStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  invitationExpiresAt?: string | null;
  isExpired: boolean;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [rejectedSuccess, setRejectedSuccess] = useState(false);

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`);
        const json = await res.json();
        const data: InviteData = json?.data || json;

        if (!res.ok || json?.error || !data?.email) {
          setErrorMessage(json?.error?.message || "Invalid or expired invitation link.");
          return;
        }

        if (data.isExpired) {
          setErrorMessage("This invitation link has expired (past 7 days). Please ask your workspace administrator to resend it.");
          return;
        }

        setInviteData(data);
        setName(data.name || "");

        if (initialAction === "reject" && data.invitationStatus === "PENDING") {
          setShowDeclineModal(true);
        }
      } catch {
        setErrorMessage("Unable to connect to the server to verify your invitation.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInvitation();
    }
  }, [token, initialAction]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const json = await res.json();

      if (!res.ok || json?.error) {
        toast.error(json?.error?.message || "Failed to accept invitation.");
        return;
      }

      toast.success("Invitation accepted! Your account is now active.");
      setAcceptedSuccess(true);
    } catch {
      toast.error("An unexpected error occurred while accepting the invitation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecline() {
    setIsDeclining(true);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(token)}/reject`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || json?.error) {
        toast.error(json?.error?.message || "Failed to decline invitation.");
        return;
      }

      toast.info("Invitation declined.");
      setShowDeclineModal(false);
      setRejectedSuccess(true);
    } catch {
      toast.error("An error occurred while declining the invitation.");
    } finally {
      setIsDeclining(false);
    }
  }

  const roleLabel = inviteData?.customRole?.label || inviteData?.role || "Team Member";

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary transition-colors duration-200">
      <div className="hidden lg:flex lg:w-[52%] xl:w-[54%] flex-col justify-between p-12 relative overflow-hidden bg-slate-50 dark:bg-surface-subtle border-r border-border/80 text-foreground transition-colors duration-200">
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 shrink-0 p-1.5 ring-1 ring-white/20">
              <Image
                src="/branding/zsyio-default/zsyio-mark-white.svg"
                alt="Zsyio"
                width={26}
                height={26}
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-foreground font-display">
                Zsyio Flow
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Enterprise Operations Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated/90 border border-border/80 text-xs font-semibold text-muted-foreground shadow-2xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono">Invitation Gateway Active</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-7 max-w-xl my-auto py-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light border border-primary/20 text-primary text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Team Onboarding</span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground font-display leading-[1.12]">
              Welcome to the Zsyio Workspace.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              You have been invited to collaborate on client products, agile deliverables, SLA tracking, and ticket workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 w-full">
            <div className="rounded-2xl border border-border/80 bg-surface-elevated/75 dark:bg-card/50 backdrop-blur-md p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span>Role Clearance</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Assigned permissions for tickets, sprint boards, notes, and audits.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface-elevated/75 dark:bg-card/50 backdrop-blur-md p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Encrypted Security</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Direct password setup with salted bcrypt hashing and TLS transport.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-4 z-10">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[11px]">256-bit TLS · Zero-Trust IAM</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">Zsyio v1.2</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-14 xl:px-20 bg-background relative">
        <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="flex lg:hidden items-center gap-3 justify-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 shrink-0 p-1.5">
              <Image
                src="/branding/zsyio-default/zsyio-mark-white.svg"
                alt="Zsyio"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-lg text-foreground font-display leading-tight">
                Zsyio Flow
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Invitation Setup
              </span>
            </div>
          </div>

          {loading && (
            <div className="rounded-2xl border border-border/80 bg-card p-10 flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Validating invitation token...</p>
            </div>
          )}

          {!loading && errorMessage && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex flex-col items-center text-center gap-4 shadow-xs animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-foreground text-base font-display">Invalid or Expired Invitation</h3>
                <p className="text-xs text-muted-foreground max-w-xs">{errorMessage}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl mt-2 font-semibold cursor-pointer">
                <Link href="/login">Return to Sign In</Link>
              </Button>
            </div>
          )}

          {!loading && (acceptedSuccess || inviteData?.invitationStatus === "ACCEPTED") && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-col items-center text-center gap-4 shadow-xs animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-foreground text-base font-display">Account Activated!</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Your invitation has been accepted and your password has been set. You can now sign in to your Zsyio workspace.
                </p>
              </div>
              <Button asChild size="sm" className="rounded-xl mt-2 gap-2 font-bold bg-primary text-primary-foreground cursor-pointer">
                <Link href="/login">
                  Sign In to Workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          )}

          {!loading && (rejectedSuccess || inviteData?.invitationStatus === "REJECTED") && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col items-center text-center gap-4 shadow-xs animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-foreground text-base font-display">Invitation Declined</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  You have declined this workspace invitation. If this was a mistake, please contact your workspace administrator for a new invite.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl mt-2 font-semibold cursor-pointer">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          )}

          {!loading && !errorMessage && !acceptedSuccess && !rejectedSuccess && inviteData?.invitationStatus === "PENDING" && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight font-display">
                  Accept Your Invitation
                </h2>
                <p className="text-xs text-muted-foreground">
                  Set up your personal password to activate your workspace access.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-2.5 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px] font-medium">Invited Email:</span>
                  <span className="font-mono font-bold text-foreground text-xs">{inviteData.email}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                  <span className="text-muted-foreground text-[11px] font-medium">Assigned Role:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                    <UserCheck className="w-3.5 h-3.5" />
                    {roleLabel}
                  </span>
                </div>
              </div>

              <form onSubmit={handleAccept} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your display name"
                    className="text-xs h-9.5 rounded-lg"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Create Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="text-xs h-9.5 rounded-lg pr-9"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="text-xs h-9.5 rounded-lg"
                    required
                    minLength={8}
                  />
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 rounded-xl font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer"
                  >
                    {isSubmitting ? "Activating Account..." : "Accept & Join Workspace"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeclineModal(true)}
                    disabled={isSubmitting}
                    className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                  >
                    Decline this invitation
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/80 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Protected by Zsyio Role-Based Access Control</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeclineModal}
        onOpenChange={setShowDeclineModal}
        title="Decline Workspace Invitation?"
        description="Are you sure you want to decline this invitation to Zsyio Flow? You will not be able to access the workspace unless re-invited by an administrator."
        confirmText="Yes, Decline Invitation"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDecline}
        isLoading={isDeclining}
      />
    </div>
  );
}
