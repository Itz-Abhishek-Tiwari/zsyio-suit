"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "../components/label";
import { Input } from "../components/input";
import { cn } from "../lib/utils";

/**
 * Labeled password input with a show/hide toggle. Shared between the two
 * independent auth flows in ChangePasswordModal (direct password change and
 * email-OTP reset) so that UI and behavior stay in sync between them.
 */
export interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: React.ReactNode;
  show: boolean;
  onToggle: () => void;
  error?: string;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ id, label, icon, show, onToggle, error, className, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-bold text-foreground">
        {label}
      </Label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-muted-foreground pointer-events-none">
          {icon}
        </span>
        <Input
          ref={ref}
          id={id}
          type={show ? "text" : "password"}
          className={cn(
            "pl-9 pr-9 h-10 text-xs rounded-xl bg-surface-subtle font-sans transition-colors",
            error && "border-destructive focus-visible:ring-destructive/30",
            className
          )}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
    </div>
  )
);

PasswordField.displayName = "PasswordField";

/** Password rules checked by the strength checklist below `newPassword`. */
export const PASSWORD_STRENGTH_RULES: { label: string; test: (pwd: string) => boolean }[] = [
  { label: "8+ chars", test: (pwd) => Boolean(pwd && pwd.length >= 8) },
  { label: "Uppercase", test: (pwd) => Boolean(pwd && /[A-Z]/.test(pwd)) },
  { label: "Number", test: (pwd) => Boolean(pwd && /[0-9]/.test(pwd)) },
];

/**
 * Inline strength indicator dots (8+ chars / uppercase / number), shown
 * beneath a "new password" field. Shared by both auth flows.
 */
export function PasswordStrengthChecklist({ password }: { password: string }) {
  if (!password) return null;

  return (
    <div className="flex items-center gap-3 px-0.5">
      {PASSWORD_STRENGTH_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <span
            key={rule.label}
            className={cn(
              "text-[10px] font-medium flex items-center gap-1 transition-colors",
              ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                ok ? "bg-emerald-500" : "bg-muted-foreground/30"
              )}
            />
            {rule.label}
          </span>
        );
      })}
    </div>
  );
}
