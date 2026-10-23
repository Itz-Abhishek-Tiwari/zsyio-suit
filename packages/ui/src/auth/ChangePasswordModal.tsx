"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, KeyRound, ShieldCheck, Mail } from "lucide-react";
import { Modal } from "../components/modal";
import { SegmentedTabs } from "../components/segmented-tabs";
import { PasswordField, PasswordStrengthChecklist } from "./PasswordField";
import { toast } from "sonner";
import { OtpPasswordResetForm } from "./OtpPasswordResetForm";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters.")
      .regex(/[A-Z]/, "Must contain at least one  letter.")
      .regex(/[0-9]/, "Must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true the modal cannot be dismissed — first-login forced reset */
  forced?: boolean;
  /** Optional user email for the OTP reset tab */
  userEmail?: string;
  /** Optional callback triggered when forced reset signs out */
  onSignOut?: () => void;
}

export function ChangePasswordModal({
  open,
  onOpenChange,
  forced = false,
  userEmail: propUserEmail,
  onSignOut,
}: ChangePasswordModalProps) {
  const [tab, setTab] = useState<"current" | "otp">("current");
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState<string>(propUserEmail || "");

  useEffect(() => {
    if (propUserEmail) {
      setResolvedEmail(propUserEmail);
    } else if (open && !resolvedEmail) {
      // Gracefully resolve email from /api/users/me if not passed via prop
      fetch("/api/users/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const email = data?.data?.email || data?.email || "";
          if (email) setResolvedEmail(email);
        })
        .catch(() => {});
    }
  }, [open, propUserEmail, resolvedEmail]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Reset all state when modal is reopened
  useEffect(() => {
    if (open) {
      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setServerError(null);
      setSuccess(false);
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setTab("current");
    }
  }, [open, reset]);

  const newPwd = watch("newPassword") || "";

  // Direct Password Change submit handler
  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        const fieldError = json?.error?.fields
          ? Object.values(json.error.fields as Record<string, string[]>).flat().join(" ")
          : null;
        setServerError(fieldError || json?.error?.message || "Invalid current password.");
        return;
      }

      setSuccess(true);
      if (forced) {
        setTimeout(() => {
          if (onSignOut) {
            onSignOut();
          } else {
            window.location.href = "/login?reset=1";
          }
        }, 1800);
      } else {
        toast.success("Password updated successfully!");
        setTimeout(() => onOpenChange(false), 1400);
      }
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  // Shared success handler for the OTP reset flow
  const handleOtpSuccess = () => {
    setSuccess(true);
    setTimeout(() => onOpenChange(false), 1500);
  };

  return (
    <Modal
      open={open}
      onOpenChange={forced ? () => {} : onOpenChange}
      hideClose={forced}
      title={forced ? "Set Your Password" : "Change Password"}
      description={
        forced
          ? "Your account requires a password change before you can continue."
          : "Update your account password or reset it securely via email verification code."
      }
      icon={<KeyRound className="w-4 h-4" />}
      iconVariant="primary"
      size="md"
      bodyClassName="p-5"
    >
      {success ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-14 h-14 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-success" />
          </div>
          <p className="text-sm font-semibold text-foreground">Password Updated!</p>
          <p className="text-xs text-muted-foreground">
            {forced ? "Signing you back in…" : "Your password has been changed successfully."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {!forced && (
            <SegmentedTabs<"current" | "otp">
              value={tab}
              onChange={(v) => {
                setTab(v);
                setServerError(null);
              }}
              fullWidth
              size="sm"
              tabs={[
                { id: "current", label: "Current Password", icon: <Lock className="w-3.5 h-3.5" /> },
                { id: "otp", label: "Email OTP Reset", icon: <Mail className="w-3.5 h-3.5" /> },
              ]}
            />
          )}

          {tab === "current" ? (
            <form
              id="change-password-form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <PasswordField
                id="cp-current"
                label="Current Password"
                icon={<Lock className="w-3.5 h-3.5" />}
                show={showCurrent}
                onToggle={() => setShowCurrent((p) => !p)}
                autoComplete="current-password"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />

              <div className="flex flex-col gap-1.5">
                <PasswordField
                  id="cp-new"
                  label="New Password"
                  icon={<KeyRound className="w-3.5 h-3.5" />}
                  show={showNew}
                  onToggle={() => setShowNew((p) => !p)}
                  autoComplete="new-password"
                  error={errors.newPassword?.message}
                  {...register("newPassword")}
                />
                <PasswordStrengthChecklist password={newPwd} />
              </div>

              <PasswordField
                id="cp-confirm"
                label="Confirm New Password"
                icon={<Lock className="w-3.5 h-3.5" />}
                show={showConfirm}
                onToggle={() => setShowConfirm((p) => !p)}
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              {serverError && (
                <p className="text-xs text-destructive font-medium bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
                  {serverError}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition-all shadow-md  disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting
                    ? "Updating…"
                    : forced
                      ? "Set Password & Continue"
                      : "Update Password"}
                </button>
                {!forced && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab("otp");
                      setServerError(null);
                    }}
                    className="text-xs font-medium text-primary hover:underline text-center cursor-pointer mt-1"
                  >
                    Forgot current password? Reset with OTP &rarr;
                  </button>
                )}
              </div>
            </form>
          ) : (
            <OtpPasswordResetForm open={open} userEmail={resolvedEmail} onSuccess={handleOtpSuccess} />
          )}
        </div>
      )}
    </Modal>
  );
}

const keepOpen = () => {};

/**
 * The first-login password reset, renderable from a server layout:
 * `{session.user.mustChangePassword ? <ForcedPasswordChange userEmail={...} /> : null}`.
 */
export function ForcedPasswordChange({ userEmail }: { userEmail?: string }) {
  return <ChangePasswordModal open onOpenChange={keepOpen} forced userEmail={userEmail} />;
}
