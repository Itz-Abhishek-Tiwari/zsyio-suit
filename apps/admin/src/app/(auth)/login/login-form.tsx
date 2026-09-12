"use client";

import { signIn } from "next-auth/react";
import { AuthLoginForm } from "@zsyio/ui";
import { isEmailDomainAllowed, getAllowedDomainsNotice, getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";
import { useMemo } from "react";

interface LoginFormProps {
  serverAllowedDomains?: string[];
}

export function LoginForm({ serverAllowedDomains }: LoginFormProps) {
  const allowedDomains = useMemo(
    () =>
      serverAllowedDomains && serverAllowedDomains.length > 0
        ? serverAllowedDomains
        : getAllowedEmailDomains(),
    [serverAllowedDomains]
  );

  async function handleSignIn(email: string, password: string) {
    if (!isEmailDomainAllowed(email)) {
      return {
        error: `Corporate access is restricted: only accounts from ${getAllowedDomainsNotice()} are permitted.`,
      };
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Invalid email address or password." };
    }
  }

  return (
    <AuthLoginForm
      emailMode="corporate"
      allowedDomains={allowedDomains}
      submitLabel="Sign in to Admin Console"
      loadingLabel="Verifying Admin Clearance…"
      onSignIn={handleSignIn}
    />
  );
}
