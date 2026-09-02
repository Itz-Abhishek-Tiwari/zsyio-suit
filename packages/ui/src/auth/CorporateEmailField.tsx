"use client";

import React from "react";
import { Input } from "../components/input";
import { Label } from "../components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import { Mail, Building2 } from "lucide-react";

export interface CorporateEmailFieldProps {
  id?: string;
  label?: string;
  /** Text shown above the input on the right (e.g. "Authorized domains") */
  hint?: string;
  /** Label for the preview row under the input (e.g. "Signing in as:" or "Code will be sent to:") */
  previewLabel?: string;
  emailUsername: string;
  onEmailUsernameChange: (value: string) => void;
  selectedDomain: string;
  onSelectedDomainChange: (domain: string) => void;
  allowedDomains: string[];
  autoComplete?: string;
  disabled?: boolean;
}

/**
 * Corporate email/username + domain-select field shared by the login, invite, and
 * forgot-password flows across all Zsyio applications.
 */
export function CorporateEmailField({
  id = "corporateEmail",
  label = "Corporate Email Address",
  hint = "Authorized domains",
  previewLabel = "Signing in as:",
  emailUsername,
  onEmailUsernameChange,
  selectedDomain,
  onSelectedDomainChange,
  allowedDomains,
  autoComplete = "username",
  disabled = false,
}: CorporateEmailFieldProps) {
  const cleanUsername = emailUsername.trim().toLowerCase().replace(/^@+|@+$/g, "");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-bold text-foreground">
          {label}
        </Label>
        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <Building2 className="w-3 h-3 text-primary" />
          <span>{hint}</span>
        </span>
      </div>

      <div className="flex items-center rounded-xl border border-border/80 bg-surface-elevated/90 overflow-hidden shadow-2xs transition-colors duration-200 ease-out focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
        <div className="pl-3.5 text-muted-foreground flex items-center pointer-events-none">
          <Mail className="w-4 h-4" />
        </div>
        <Input
          id={id}
          type="text"
          value={emailUsername}
          onChange={(e) => {
            let raw = e.target.value;
            if (raw.includes("@")) {
              const [userPart, ...rest] = raw.split("@");
              const potentialDomain = rest.join("").trim().toLowerCase();
              raw = userPart;
              if (potentialDomain && allowedDomains.includes(potentialDomain)) {
                onSelectedDomainChange(potentialDomain);
              }
            }
            onEmailUsernameChange(raw.replace(/[@\s]/g, ""));
          }}
          autoComplete={autoComplete}
          placeholder="username"
          required
          disabled={disabled}
          className="border-0 shadow-none focus-visible:ring-0 rounded-none h-11 text-xs flex-1 bg-transparent px-2.5 font-medium placeholder:text-muted-foreground/60"
        />

        <div className="h-6 w-[1px] bg-border/80 shrink-0" />

        <Select value={selectedDomain} onValueChange={onSelectedDomainChange}>
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
        <span>{previewLabel}</span>
        <span className="font-bold text-foreground truncate max-w-[240px]">
          {cleanUsername ? `${cleanUsername}@${selectedDomain}` : `username@${selectedDomain}`}
        </span>
      </div>
    </div>
  );
}
