import { ForgotPasswordForm } from "./forgot-password-form";
import { ShieldCheck, Sparkles, Lock, KeyRound, MailCheck, ShieldAlert } from "lucide-react";
import { auth } from "@zsyio/auth";
import Image from "next/image";
import { ThemeToggle } from "@zsyio/ui";
import { getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";

export const metadata = {
  title: "Reset Password - Zsyio Canvas",
  description: "Reset your corporate account password via 6-digit email OTP verification.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  const allowedDomains = getAllowedEmailDomains();
  const initialEmail = params?.email || session?.user?.email || "";

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
                Zsyio Canvas
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Knowledge & Docs Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated/90 border border-border/80 text-xs font-semibold text-muted-foreground shadow-2xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono">Secure Verification Active</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-8 max-w-xl my-auto py-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light border border-primary/20 text-primary text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero-Trust Account Recovery</span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground font-display leading-[1.12]">
              Corporate Password Recovery &amp; MFA Verification.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Safely reset your workspace credentials with one-time verification tokens sent directly to your corporate inbox.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 w-full">
            <div className="rounded-2xl border border-border/80 bg-surface-elevated/75 dark:bg-card/50 backdrop-blur-md p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span>6-Digit OTP</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                One-time dynamic authentication codes generated with cryptographically secure random integers.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface-elevated/75 dark:bg-card/50 backdrop-blur-md p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <MailCheck className="w-4 h-4" />
                </div>
                <span>Direct Inbox Delivery</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Delivered via verified enterprise relay with strict anti-spoofing and domain SPF verification.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface-elevated/75 dark:bg-card/50 backdrop-blur-md p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span>Anti-Brute Force</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Strict 10-minute expiry window and 5-attempt lockdown to mitigate brute-force attempts.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface-elevated/75 dark:bg-card/50 backdrop-blur-md p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Bcrypt Salted</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Passwords and OTPs are hashed before persistent storage. Plaintext is never retained.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-4 z-10">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[11px]">256-bit TLS · Automated Session Clear</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">Zsyio IAM v1.2</span>
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
                Zsyio Canvas
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Password Recovery
              </span>
            </div>
          </div>

          <ForgotPasswordForm serverAllowedDomains={allowedDomains} initialEmail={initialEmail} />

          <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/80 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Protected by Zsyio Role-Based Access Control</span>
          </div>
        </div>
      </div>
    </div>
  );
}
